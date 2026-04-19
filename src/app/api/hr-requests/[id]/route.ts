import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["approve", "reject", "cancel"]),
  note: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { action, note } = parsed.data;
  const isAdmin = ["super_admin", "admin"].includes(session.user.role);

  const existing = await prisma.hrRequest.findUnique({
    where: { id },
    select: { id: true, requestedBy: true, status: true, type: true },
  });
  if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // Employees can only cancel their own pending requests
  if (action === "cancel") {
    if (existing.requestedBy !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (existing.status !== "pending")
      return NextResponse.json({ error: "Only pending requests can be cancelled" }, { status: 409 });
  } else {
    // Approve / reject requires admin
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newStatus =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "cancelled";

  const updated = await prisma.hrRequest.update({
    where: { id },
    data: {
      status: newStatus,
      approvedBy: action !== "cancel" ? session.user.id : undefined,
      approvedAt: action !== "cancel" ? new Date() : undefined,
      ...(note ? { details: note } : {}),
    },
  });

  // Notify the employee
  await prisma.notification.create({
    data: {
      userId: existing.requestedBy,
      type: "hr_request",
      titleEn: `Leave request ${newStatus}`,
      titleAr: `طلب الإجازة ${newStatus === "approved" ? "مقبول" : newStatus === "rejected" ? "مرفوض" : "ملغى"}`,
      bodyEn: note ?? `Your ${existing.type.replace(/_/g, " ")} request has been ${newStatus}.`,
      bodyAr: note ?? `تم ${newStatus === "approved" ? "قبول" : "رفض"} طلب ${existing.type.replace(/_/g, " ")} الخاص بك.`,
    },
  }).catch(() => null);

  await logAudit({
    userId: session.user.id,
    action: `hr_request_${action}`,
    entityType: "HrRequest",
    entityId: id,
    severity: action === "approve" ? "info" : "warning",
    after: { status: newStatus, note },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true, status: newStatus, request: updated });
}
