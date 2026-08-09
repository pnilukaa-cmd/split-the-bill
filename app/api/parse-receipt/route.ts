import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ParsedReceipt, ReceiptItem } from "@/lib/types";
import { dollarsToCents } from "@/lib/split";

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
        description: "Subtotal in dollars before tax and tip. Estimate as sum of items if not printed.",
      },
      tax: { type: "number", description: "Tax amount in dollars. 0 if none." },
      tip: {
        type: "number",
        description: "Tip/gratuity amount in dollars, if already printed on the receipt. 0 if none.",
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
  total: number;
}

const SUPPORTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
type SupportedMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function isValidRawReceipt(value: unknown): value is RawReceipt {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
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
    typeof v.total === "number"
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

  const formData = await req.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }
  if (!SUPPORTED_MEDIA_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image format (${file.type || "unknown"}). Please use a JPEG, PNG, WEBP, or GIF photo.` },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mediaType = file.type as SupportedMediaType;

  const anthropic = new Anthropic({ apiKey });

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
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: "This is a photo of a restaurant receipt, possibly crumpled, faded, or at an angle. Read it carefully and extract every line item with its price, plus subtotal, tax, tip, and total. If a value isn't printed, make your best estimate rather than leaving it blank.",
            },
          ],
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

  const itemsSum = items.reduce((sum, item) => sum + item.priceCents, 0);
  const reconciled = itemsSum + taxCents + tipCents;

  let warning: string | undefined;
  if (Math.abs(reconciled - totalCents) > 100) {
    warning = `The scanned items, tax, and tip add up to $${(reconciled / 100).toFixed(
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
    totalCents,
    warning,
  };

  return NextResponse.json(receipt);
}
