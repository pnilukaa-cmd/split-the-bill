import { NextRequest, NextResponse } from "next/server";
import { resolveShortLink } from "@/lib/shareStore";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const encoded = await resolveShortLink(slug);
  if (!encoded) {
    return NextResponse.json({ error: "This link has expired or doesn't exist." }, { status: 404 });
  }
  return NextResponse.json({ encoded });
}
