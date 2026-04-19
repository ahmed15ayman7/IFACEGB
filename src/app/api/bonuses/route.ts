import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const BONUS_TYPES = ["performance", "referral", "project", "kpi", "other"] as const;

const createSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(BONUS_TYPES).default("performance"),
  amountCoins: z.number().positive(),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const employeeId = searchParams.get("employeeId");

  const bonuses = await prisma.bonus.findMany({
    where: {
      ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(employeeId ? { employeeId } : {}),
    },
    orderBy: { issuedAt: "desc" },
    take: 200,
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          jobTitleEn: true,
          user: { select: { name: true, nameAr: true, avatarUrl: true } },
          sector: { select: { nameEn: true, nameAr: true } },
        },
      },
    },
  });

  return NextResponse.json(
    bonuses.map((b) => ({ ...b, amountCoins: Number(b.amountCoins), issuedAt: b.issuedAt.toISOString(), paidAt: b.paidAt?.toISOString() ?? null }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;

  const employee = await prisma.employee.findUnique({ where: { id: d.employeeId }, select: { id: true } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const bonus = await prisma.bonus.create({
    data: {
      employeeId: d.employeeId,
      type: d.type,
      amountCoins: d.amountCoins,
      reason: d.reason ?? null,
      status: "approved",
      approvedBy: session.user.id,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "bonus_create",
    entityType: "Bonus",
    entityId: bonus.id,
    severity: "info",
    after: { employeeId: d.employeeId, type: d.type, amountCoins: d.amountCoins },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true, id: bonus.id }, { status: 201 });
}
