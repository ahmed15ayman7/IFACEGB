import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/audit.service";
import { auth } from "@/lib/auth/auth.config";
import {
  activateKillSwitch,
  deactivateKillSwitch,
  lockSector as redisCacheLock,
  unlockSector as redisCacheUnlock,
  getLockedSectors as redisCacheGetLocked,
} from "@/lib/redis/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns sector codes that currently have an active lock in the DB. */
async function getDbLockedSectors(): Promise<string[]> {
  const rows = await prisma.killSwitchLog.findMany({
    where: { targetType: "sector", isActive: true },
    select: { targetId: true },
  });
  return rows.map((r) => r.targetId).filter(Boolean) as string[];
}

/** Is the global platform kill switch active in the DB? */
async function isGlobalActive(): Promise<boolean> {
  const row = await prisma.killSwitchLog.findFirst({
    where: { targetType: "platform", isActive: true },
  });
  return !!row;
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminId = session.user.id; // always use the authenticated user, not body

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, reason, cosignerEmail, targetType = "platform", sectorCode } =
    body as {
      action?: string;
      reason?: string;
      cosignerEmail?: string;
      targetType?: string;
      sectorCode?: string;
    };

  const ip = req.headers.get("x-forwarded-for") ?? undefined;

  // ─── Per-sector lock / unlock ──────────────────────────────────────────────
  if (targetType === "sector") {
    if (!sectorCode) {
      return NextResponse.json({ error: "sectorCode required" }, { status: 400 });
    }
    if (action !== "lock" && action !== "unlock") {
      return NextResponse.json({ error: "action must be lock or unlock" }, { status: 400 });
    }

    if (action === "lock") {
      // Deactivate any existing lock record for this sector first (idempotent)
      await prisma.killSwitchLog.updateMany({
        where: { targetType: "sector", targetId: sectorCode, isActive: true },
        data: { isActive: false, deactivatedAt: new Date(), deactivatedBy: adminId },
      });

      await prisma.killSwitchLog.create({
        data: {
          activatedBy: adminId,
          reason: (reason as string | undefined) ?? "No reason provided",
          targetType: "sector",
          targetId: sectorCode,
          isActive: true,
          signatures: { primary: adminId },
        },
      });

      // Best-effort Redis cache update (non-fatal)
      await redisCacheLock(sectorCode).catch(() => null);

      await logAudit({
        userId: adminId,
        action: "sector_lock",
        entityType: "Sector",
        severity: "critical",
        after: { sectorCode, reason: reason ?? null },
        ipAddress: ip,
      }).catch(() => null);

      return NextResponse.json({ success: true, sectorCode, locked: true });
    }

    // action === "unlock"
    await prisma.killSwitchLog.updateMany({
      where: { targetType: "sector", targetId: sectorCode, isActive: true },
      data: { isActive: false, deactivatedAt: new Date(), deactivatedBy: adminId },
    });

    // Best-effort Redis cache update
    await redisCacheUnlock(sectorCode).catch(() => null);

    await logAudit({
      userId: adminId,
      action: "sector_unlock",
      entityType: "Sector",
      severity: "warning",
      after: { sectorCode },
      ipAddress: ip,
    }).catch(() => null);

    return NextResponse.json({ success: true, sectorCode, locked: false });
  }

  // ─── Global platform kill switch ──────────────────────────────────────────
  if (action === "activate") {
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    }

    const log = await prisma.killSwitchLog.create({
      data: {
        activatedBy: adminId,
        reason: reason as string,
        targetType: "platform",
        signatures: { primary: adminId, cosignerEmail: cosignerEmail ?? null },
        isActive: true,
      },
    });

    // Best-effort Redis
    await activateKillSwitch("platform").catch(() => null);

    await logAudit({
      userId: adminId,
      action: "kill_switch_activate",
      entityType: "KillSwitchLog",
      entityId: log.id,
      severity: "critical",
      after: { reason, targetType: "platform" },
      ipAddress: ip,
    }).catch(() => null);

    return NextResponse.json({ success: true, logId: log.id });
  }

  if (action === "deactivate") {
    await prisma.killSwitchLog.updateMany({
      where: { isActive: true, targetType: "platform" },
      data: { isActive: false, deactivatedAt: new Date(), deactivatedBy: adminId },
    });

    await deactivateKillSwitch("platform").catch(() => null);

    await logAudit({
      userId: adminId,
      action: "kill_switch_deactivate",
      entityType: "KillSwitchLog",
      severity: "warning",
      after: { targetType: "platform" },
      ipAddress: ip,
    }).catch(() => null);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("check") === "sectors") {
    // Try DB first, fallback to Redis cache
    try {
      const lockedSectors = await getDbLockedSectors();
      return NextResponse.json({ lockedSectors });
    } catch {
      // DB failed: fallback to Redis
      const lockedSectors = await redisCacheGetLocked().catch(() => []);
      return NextResponse.json({ lockedSectors });
    }
  }

  // Full status (for the admin dashboard)
  try {
    const [globalActive, lockedSectors] = await Promise.all([
      isGlobalActive(),
      getDbLockedSectors(),
    ]);

    const activeLog = globalActive
      ? await prisma.killSwitchLog.findFirst({
          where: { targetType: "platform", isActive: true },
          orderBy: { activatedAt: "desc" },
        })
      : null;

    return NextResponse.json({ active: globalActive, log: activeLog, lockedSectors });
  } catch {
    return NextResponse.json({ active: false, log: null, lockedSectors: [] });
  }
}
