import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { canWriteSector } from "@/lib/auth/sector-mutation";
import { z } from "zod";

const ALLOWED_ROLES = ["sector_manager", "admin", "super_admin"];

const patchSchema = z.object({
  status: z.enum(["accepted", "rejected", "in_progress", "resolved", "escalated"]).optional(),
  assignedTo: z.string().optional(),
  resolution: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { name: true, nameAr: true, email: true } },
      sector: { select: { nameEn: true, nameAr: true } },
    },
  });

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(request);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!(await canWriteSector(session.user, existing.toSectorId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "resolved") updateData.resolvedAt = new Date();
  }
  if (parsed.data.assignedTo) updateData.assignedTo = parsed.data.assignedTo;
  if (parsed.data.resolution) updateData.resolution = parsed.data.resolution;

  // Auto-create InternalInvoice when accepted
  if (parsed.data.status === "accepted" && existing.fromSectorId && existing.toSectorId) {
    await prisma.internalInvoice.create({
      data: {
        fromSectorId: existing.fromSectorId,
        toSectorId: existing.toSectorId,
        serviceRequestId: id,
        amountCoins: 0,
        description: `ISR: ${existing.titleEn}`,
      },
    }).catch(() => null); // non-blocking
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: updateData,
  });

  await logAudit({
    userId: session.user.id,
    action: "isr_update",
    entityType: "ServiceRequest",
    entityId: id,
    severity: parsed.data.status === "escalated" ? "warning" : "info",
    before: { status: existing.status },
    after: updateData,
  });

  return NextResponse.json({ success: true, request: updated });
}
