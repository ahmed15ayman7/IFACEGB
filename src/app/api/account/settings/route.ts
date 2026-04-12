import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";

const patchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    nameAr: z.union([z.string().max(120), z.literal("")]).optional(),
    locale: z.enum(["en", "ar"]).optional(),
    timezone: z.string().min(1).max(64).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .refine(
    (d) => {
      if (d.newPassword && !d.currentPassword) return false;
      return true;
    },
    { message: "currentPassword required with newPassword" }
  );

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, nameAr, locale, timezone, currentPassword, newPassword } = parsed.data;
  const hasAny =
    name !== undefined ||
    nameAr !== undefined ||
    locale !== undefined ||
    timezone !== undefined ||
    newPassword !== undefined;
  if (!hasAny) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (newPassword) {
    if (!existing.passwordHash || !currentPassword) {
      return NextResponse.json({ error: "Cannot change password" }, { status: 400 });
    }
    const match = await bcrypt.compare(currentPassword, existing.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }
  }

  const data: {
    name?: string;
    nameAr?: string | null;
    locale?: string;
    timezone?: string;
    passwordHash?: string;
  } = {};

  if (name !== undefined) data.name = name;
  if (nameAr !== undefined) data.nameAr = nameAr === "" ? null : nameAr;
  if (locale !== undefined) data.locale = locale;
  if (timezone !== undefined) data.timezone = timezone;
  if (newPassword) data.passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
