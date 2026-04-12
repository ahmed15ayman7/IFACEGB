import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(320),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(8000),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;
  const details = `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`;

  try {
    await prisma.publicServiceRequest.create({
      data: {
        name,
        email,
        serviceType: "contact_form",
        details,
        status: "pending",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
