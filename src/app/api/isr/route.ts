import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const ALLOWED_ROLES = ["sector_manager", "admin", "super_admin"];

function slaDeadline(priority: string): Date {
  const now = new Date();
  const hours = priority === "urgent" ? 4 : priority === "high" ? 24 : priority === "low" ? 168 : 72;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

const createSchema = z.object({
  titleEn: z.string().min(3),
  titleAr: z.string().optional(),
  descriptionEn: z.string().min(10),
  descriptionAr: z.string().optional(),
  type: z.string().min(1),
  priority: z.enum(["urgent", "high", "normal", "low"]).default("normal"),
  toSectorId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction") ?? "inbox"; // inbox | sent | all
  const status = searchParams.get("status") ?? undefined;

  const sectorId = session.user.sectorId ?? undefined;

  const where =
    direction === "inbox"
      ? { toSectorId: sectorId, ...(status ? { status: status as "pending" } : {}) }
      : direction === "sent"
        ? { fromSectorId: sectorId, ...(status ? { status: status as "pending" } : {}) }
        : // admins can see all
          session.user.role === "super_admin" || session.user.role === "admin"
          ? status
            ? { status: status as "pending" }
            : {}
          : {
              OR: [{ toSectorId: sectorId }, { fromSectorId: sectorId }],
              ...(status ? { status: status as "pending" } : {}),
            };

  const requests = await prisma.serviceRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      requester: { select: { name: true, nameAr: true } },
      sector: { select: { nameEn: true, nameAr: true } },
    },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { titleEn, titleAr, descriptionEn, descriptionAr, type, priority, toSectorId } = parsed.data;

  const request = await prisma.serviceRequest.create({
    data: {
      requesterId: session.user.id,
      fromSectorId: session.user.sectorId ?? null,
      toSectorId,
      type,
      titleEn,
      titleAr: titleAr ?? null,
      descriptionEn,
      descriptionAr: descriptionAr ?? null,
      priority,
      status: "pending",
      slaDeadline: slaDeadline(priority),
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "isr_create",
    entityType: "ServiceRequest",
    entityId: request.id,
    severity: priority === "urgent" ? "warning" : "info",
    after: { titleEn, toSectorId, priority },
  });

  return NextResponse.json({ success: true, request }, { status: 201 });
}
