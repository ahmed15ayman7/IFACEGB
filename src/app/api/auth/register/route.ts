import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  locale: z.enum(["en", "ar"]).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password, locale } = parsed.data;
  const emailNorm = email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email: emailNorm,
        name,
        passwordHash,
        role: "user",
        locale: locale ?? "en",
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 503 });
  }
}
