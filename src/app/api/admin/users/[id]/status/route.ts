import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";
import { NextResponse } from "next/server";

const bodySchema = z.object({
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  suspendedReason: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["super_admin", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: targetId } = await params;

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { isActive, isSuspended, suspendedReason } = parsed.data;

  if (isSuspended && targetId === session.user.id) {
    return NextResponse.json({ error: "Cannot suspend yourself" }, { status: 400 });
  }

  const before = await prisma.user.findUnique({
    where: { id: targetId },
    select: { isActive: true, isSuspended: true },
  });
  if (!before) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isSuspended !== undefined ? { isSuspended } : {}),
      ...(suspendedReason !== undefined ? { suspendedReason } : {}),
    },
    select: {
      id: true,
      email: true,
      isActive: true,
      isSuspended: true,
      suspendedReason: true,
    },
  });

  if (isSuspended || isActive === false) {
    await prisma.session.deleteMany({ where: { userId: targetId } });
  }

  await logAudit({
    userId: session.user.id,
    action: "user_status_update",
    entityType: "User",
    entityId: targetId,
    severity: "info",
    before,
    after: { isActive: updated.isActive, isSuspended: updated.isSuspended },
  });

  return NextResponse.json({ user: updated });
}
