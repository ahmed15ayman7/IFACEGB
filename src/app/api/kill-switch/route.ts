import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activateKillSwitch, deactivateKillSwitch } from "@/lib/redis/client";
import { logAudit } from "@/lib/audit/audit.service";
import { auth } from "@/lib/auth/auth.config";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action, reason, cosignerEmail, adminId, targetType = "platform" } = body;

  if (action === "activate") {
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    }

    const log = await prisma.killSwitchLog.create({
      data: {
        activatedBy: adminId,
        reason,
        targetType,
        signatures: { primary: adminId, cosignerEmail: cosignerEmail ?? null },
        isActive: true,
      },
    });

    await activateKillSwitch(targetType);
    await logAudit({
      userId: adminId,
      action: "kill_switch_activate",
      entityType: "KillSwitchLog",
      entityId: log.id,
      severity: "critical",
      after: { reason, targetType },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ success: true, logId: log.id });
  }

  if (action === "deactivate") {
    await prisma.killSwitchLog.updateMany({
      where: { isActive: true, targetType },
      data: { isActive: false, deactivatedAt: new Date(), deactivatedBy: adminId },
    });

    await deactivateKillSwitch(targetType);
    await logAudit({
      userId: adminId,
      action: "kill_switch_deactivate",
      entityType: "KillSwitchLog",
      severity: "warning",
      after: { targetType },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  const active = await prisma.killSwitchLog.findFirst({
    where: { isActive: true },
    orderBy: { activatedAt: "desc" },
  });
  return NextResponse.json({ active: !!active, log: active });
}
