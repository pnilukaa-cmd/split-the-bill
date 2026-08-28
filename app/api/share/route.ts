import { NextRequest, NextResponse } from "next/server";
import { createShortLink } from "@/lib/shareStore";
import { getClientIdentifier, isShareLinkCreateAllowed } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  if (!(await isShareLinkCreateAllowed(identifier))) {
    return NextResponse.json({ error: "Too many links created from this connection today." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const encoded = body?.encoded;
  if (typeof encoded !== "string" || !encoded) {
    return NextResponse.json({ error: "Missing payload." }, { status: 400 });
  }

  const slug = await createShortLink(encoded);
  if (!slug) {
    return NextResponse.json({ error: "Short links aren't available right now." }, { status: 503 });
  }

  return NextResponse.json({ slug });
}
