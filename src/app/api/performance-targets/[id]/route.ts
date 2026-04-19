import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const updateSchema = z.object({
  achievedValue: z.number().min(0).optional(),
  bonusPerUnit: z.number().min(0).optional(),
  isAchieved: z.boolean().optional(),
  period: z.string().optional(),
  targetValue: z.number().positive().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const updated = await prisma.performanceTarget.update({
    where: { id },
    data: {
      ...(d.achievedValue !== undefined ? { achievedValue: d.achievedValue } : {}),
      ...(d.bonusPerUnit !== undefined ? { bonusPerUnit: d.bonusPerUnit } : {}),
      ...(d.isAchieved !== undefined ? { isAchieved: d.isAchieved } : {}),
      ...(d.period !== undefined ? { period: d.period } : {}),
      ...(d.targetValue !== undefined ? { targetValue: d.targetValue } : {}),
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "performance_target_update",
    entityType: "PerformanceTarget",
    entityId: id,
    severity: "info",
    after: d,
  });

  return NextResponse.json({ success: true, target: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.performanceTarget.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
