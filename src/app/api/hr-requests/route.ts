import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";
import type { HrRequestType } from "@prisma/client";

const HR_TYPES: HrRequestType[] = [
  "annual_leave", "casual_leave", "sick_leave", "unpaid_leave",
  "absence_justification", "grievance", "remote_work", "other",
];

const createSchema = z.object({
  type: z.enum(HR_TYPES as [HrRequestType, ...HrRequestType[]]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  details: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const typeFilter = searchParams.get("type");

  const isAdmin = ["super_admin", "admin"].includes(session.user.role);

  const where = {
    ...(isAdmin ? {} : { requestedBy: session.user.id }),
    ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(typeFilter && typeFilter !== "all" ? { type: typeFilter as HrRequestType } : {}),
  };

  const requests = await prisma.hrRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      requester: { select: { name: true, nameAr: true, email: true, avatarUrl: true } },
      employee: {
        select: {
          employeeCode: true,
          jobTitleEn: true,
          sector: { select: { nameEn: true, nameAr: true } },
        },
      },
    },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find employee record for current user
  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const start = new Date(d.startDate);
  const end = new Date(d.endDate);

  if (end < start) return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });

  const hrRequest = await prisma.hrRequest.create({
    data: {
      employeeId: employee.id,
      requestedBy: session.user.id,
      type: d.type,
      details: d.details ?? null,
      startDate: start,
      endDate: end,
      status: "pending",
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "hr_request_create",
    entityType: "HrRequest",
    entityId: hrRequest.id,
    severity: "info",
    after: { type: d.type, startDate: d.startDate, endDate: d.endDate },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true, id: hrRequest.id }, { status: 201 });
}
