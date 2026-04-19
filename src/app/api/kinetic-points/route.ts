import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const updateSchema = z.object({
  employeeId: z.string().min(1),
  delta: z.number().int(),
  reason: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { employeeId, delta, reason } = parsed.data;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, kineticPoints: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const newPoints = Math.max(0, employee.kineticPoints + delta);
  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { kineticPoints: newPoints },
  });

  await logAudit({
    userId: session.user.id,
    action: "kinetic_points_update",
    entityType: "Employee",
    entityId: employeeId,
    severity: "info",
    before: { kineticPoints: employee.kineticPoints },
    after: { kineticPoints: newPoints, delta, reason },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true, kineticPoints: newPoints });
}
