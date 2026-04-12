import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

/** Placeholder: extend with email provider (Resend, etc.) when configured */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
