import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";
import { NextResponse } from "next/server";
import type { SectorAccessLevel } from "@prisma/client";

const putSchema = z.object({
  sectors: z.array(
    z.object({
      sectorId: z.string().min(1),
      accessLevel: z.enum(["manager", "read_only"] as const),
    })
  ),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["super_admin", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = await params;

  const rows = await prisma.userSectorAccess.findMany({
    where: { userId },
    include: {
      sector: { select: { id: true, code: true, nameEn: true, nameAr: true, isActive: true } },
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      sectorId: r.sectorId,
      accessLevel: r.accessLevel,
      sector: r.sector,
    })),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["super_admin", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = await params;
  const parsed = putSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const sectorIds = [...new Set(parsed.data.sectors.map((s) => s.sectorId))];
  const existingSectors = await prisma.sector.findMany({
    where: { id: { in: sectorIds }, isActive: true },
    select: { id: true },
  });
  const valid = new Set(existingSectors.map((s) => s.id));
  const cleaned = parsed.data.sectors.filter((s) => valid.has(s.sectorId));

  await prisma.$transaction(async (tx) => {
    await tx.userSectorAccess.deleteMany({ where: { userId } });
    for (const s of cleaned) {
      await tx.userSectorAccess.create({
        data: {
          userId,
          sectorId: s.sectorId,
          accessLevel: s.accessLevel as SectorAccessLevel,
          createdBy: session.user.id,
        },
      });
    }
  });

  await logAudit({
    userId: session.user.id,
    action: "user_sector_access_update",
    entityType: "User",
    entityId: userId,
    severity: "info",
    metadata: { count: cleaned.length },
  });

  return NextResponse.json({ ok: true });
}
