import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const createSchema = z.object({
  employeeId: z.string().min(1),
  period: z.string().min(1),
  targetValue: z.number().positive(),
  achievedValue: z.number().min(0).default(0),
  bonusPerUnit: z.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");

  const targets = await prisma.performanceTarget.findMany({
    where: { ...(employeeId ? { employeeId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          user: { select: { name: true, nameAr: true, avatarUrl: true } },
          sector: { select: { nameEn: true, nameAr: true } },
        },
      },
    },
  });

  return NextResponse.json(
    targets.map((t) => ({
      ...t,
      targetValue: Number(t.targetValue),
      achievedValue: Number(t.achievedValue),
      bonusPerUnit: Number(t.bonusPerUnit),
      createdAt: t.createdAt.toISOString(),
    }))
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
  const target = await prisma.performanceTarget.create({
    data: {
      employeeId: d.employeeId,
      period: d.period,
      targetValue: d.targetValue,
      achievedValue: d.achievedValue,
      bonusPerUnit: d.bonusPerUnit,
      isAchieved: false,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "performance_target_create",
    entityType: "PerformanceTarget",
    entityId: target.id,
    severity: "info",
    after: { employeeId: d.employeeId, period: d.period, targetValue: d.targetValue },
  });

  return NextResponse.json({ success: true, id: target.id }, { status: 201 });
}
