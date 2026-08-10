import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Adjustment, ParsedReceipt, ReceiptItem } from "@/lib/types";
import { dollarsToCents } from "@/lib/split";
import { getClientIdentifier, isScanAllowed } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-5";

const extractReceiptTool: Anthropic.Tool = {
  name: "extract_receipt",
  description:
    "Extract structured line items and totals from a photo of a restaurant receipt.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "Every distinct line item on the receipt, excluding tax and tip lines.",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Item name as printed, cleaned up for readability.",
            },
            price: {
              type: "number",
              description: "Total price for this line in dollars, including quantity.",
            },
            quantity: {
              type: "number",
              description: "Quantity ordered. Default 1 if not shown.",
            },
          },
          required: ["name", "price", "quantity"],
        },
      },
      subtotal: {
        type: "number",
        description: "Subtotal in dollars before tax, tip, discounts, and service charges. Estimate as sum of items if not printed.",
      },
      tax: { type: "number", description: "Tax amount in dollars. 0 if none." },
      tip: {
        type: "number",
        description: "Tip/gratuity amount in dollars, if already printed on the receipt. 0 if none.",
      },
      adjustments: {
        type: "array",
        description:
          "Any discount/coupon/promo lines (kind: discount) or service charge / auto-gratuity lines (kind: charge) printed on the receipt, separate from tax and the voluntary tip. Omit entirely if there are none — do not invent one.",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Line as printed, e.g. \"Promo Code\" or \"Service Charge\"." },
            amount: { type: "number", description: "Positive dollar amount of this line, as printed." },
            kind: { type: "string", enum: ["discount", "charge"] },
          },
          required: ["label", "amount", "kind"],
        },
      },
      total: { type: "number", description: "Grand total in dollars as printed on the receipt." },
    },
    required: ["items", "subtotal", "tax", "tip", "total"],
  },
};

interface RawReceipt {
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  tax: number;
  tip: number;
  adjustments?: { label: string; amount: number; kind: "discount" | "charge" }[];
  total: number;
}

const SUPPORTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
type SupportedMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function isValidRawReceipt(value: unknown): value is RawReceipt {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const adjustmentsValid =
    v.adjustments === undefined ||
    (Array.isArray(v.adjustments) &&
      v.adjustments.every(
        (a) =>
          a &&
          typeof a === "object" &&
          typeof (a as Record<string, unknown>).label === "string" &&
          typeof (a as Record<string, unknown>).amount === "number" &&
          ((a as Record<string, unknown>).kind === "discount" || (a as Record<string, unknown>).kind === "charge")
      ));
  return (
    Array.isArray(v.items) &&
    v.items.every(
      (it) =>
        it &&
        typeof it === "object" &&
        typeof (it as Record<string, unknown>).name === "string" &&
        typeof (it as Record<string, unknown>).price === "number"
    ) &&
    typeof v.subtotal === "number" &&
    typeof v.tax === "number" &&
    typeof v.tip === "number" &&
    typeof v.total === "number" &&
    adjustmentsValid
  );
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local and restart." },
      { status: 500 }
    );
  }

  const identifier = getClientIdentifier(req);
  if (!(await isScanAllowed(identifier))) {
    return NextResponse.json(
      { error: "You've hit today's scan limit for this app. Try again tomorrow." },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const files = formData.getAll("image");
  if (files.length === 0 || !files.every((f): f is File => f instanceof File)) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }
  const invalidType = files.find((f) => !SUPPORTED_MEDIA_TYPES.has(f.type));
  if (invalidType) {
    return NextResponse.json(
      {
        error: `Unsupported image format (${invalidType.type || "unknown"}). Please use a JPEG, PNG, WEBP, or GIF photo.`,
      },
      { status: 400 }
    );
  }

  const imageBlocks: Anthropic.ImageBlockParam[] = await Promise.all(
    files.map(async (file) => {
      const bytes = Buffer.from(await file.arrayBuffer());
      return {
        type: "image" as const,
        source: { type: "base64" as const, media_type: file.type as SupportedMediaType, data: bytes.toString("base64") },
      };
    })
  );

  const anthropic = new Anthropic({ apiKey });

  const multiPage = files.length > 1;
  const promptText = multiPage
    ? `These are ${files.length} photos of one restaurant receipt, in order, split across multiple pages because it was too long for one photo (possibly crumpled, faded, or at an angle). Treat them as one continuous receipt — read every line item exactly once even if a header, footer, or a line item appears again at the boundary between two photos due to overlap. Extract every distinct line item with its price, plus subtotal, tax, tip, and total. If a value isn't printed, make your best estimate rather than leaving it blank. Separately, if the receipt has a discount/coupon/promo line or a service charge / auto-gratuity line (distinct from a voluntary tip), extract those as adjustments — don't fold them silently into the total.`
    : "This is a photo of a restaurant receipt, possibly crumpled, faded, or at an angle. Read it carefully and extract every line item with its price, plus subtotal, tax, tip, and total. If a value isn't printed, make your best estimate rather than leaving it blank. Separately, if the receipt has a discount/coupon/promo line or a service charge / auto-gratuity line (distinct from a voluntary tip), extract those as adjustments — don't fold them silently into the total.";

  let message: Anthropic.Message;
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      tools: [extractReceiptTool],
      tool_choice: { type: "tool", name: "extract_receipt" },
      messages: [
        {
          role: "user",
          content: [...imageBlocks, { type: "text", text: promptText }],
        },
      ],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to reach the receipt-parsing model. Check the server's ANTHROPIC_API_KEY." },
      { status: 502 }
    );
  }

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    return NextResponse.json(
      { error: "Model didn't return structured data. Try a clearer photo." },
      { status: 502 }
    );
  }

  if (!isValidRawReceipt(toolUse.input)) {
    return NextResponse.json(
      { error: "The model returned an incomplete read of the receipt. Try again, or use a clearer photo." },
      { status: 502 }
    );
  }
  const raw = toolUse.input;

  const items: ReceiptItem[] = raw.items.map((it) => ({
    id: crypto.randomUUID(),
    name: it.name,
    priceCents: dollarsToCents(it.price),
    quantity: it.quantity || 1,
  }));

  const subtotalCents = dollarsToCents(raw.subtotal);
  const taxCents = dollarsToCents(raw.tax);
  const tipCents = dollarsToCents(raw.tip);
  const totalCents = dollarsToCents(raw.total);
  const adjustments: Adjustment[] = (raw.adjustments ?? []).map((a) => ({
    id: crypto.randomUUID(),
    label: a.label,
    amountCents: Math.abs(dollarsToCents(a.amount)),
    kind: a.kind,
  }));

  const itemsSum = items.reduce((sum, item) => sum + item.priceCents, 0);
  const adjustmentsNet = adjustments.reduce(
    (sum, a) => sum + (a.kind === "discount" ? -a.amountCents : a.amountCents),
    0
  );
  const reconciled = itemsSum + taxCents + tipCents + adjustmentsNet;

  let warning: string | undefined;
  if (Math.abs(reconciled - totalCents) > 100) {
    warning = `The scanned items, tax, tip, and adjustments add up to $${(reconciled / 100).toFixed(
      2
    )}, which doesn't match the printed total of $${(totalCents / 100).toFixed(
      2
    )}. Double-check the items below before splitting.`;
  }

  const receipt: ParsedReceipt = {
    items,
    subtotalCents,
    taxCents,
    tipCents,
    adjustments,
    totalCents,
    warning,
  };

  return NextResponse.json(receipt);
}
