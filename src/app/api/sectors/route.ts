import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const createSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_-]+$/, "Code must be lowercase letters, numbers, hyphens or underscores"),
  nameEn: z.string().min(2),
  nameAr: z.string().min(2),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").default("#C9A227"),
  sortOrder: z.number().int().min(0).default(0),
  targetRevPct: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  createWallet: z.boolean().default(true),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sectors = await prisma.sector.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { users: true, employees: true } },
      wallets: { where: { walletType: "SectorWallet" }, select: { balanceCoins: true } },
    },
  });

  return NextResponse.json(sectors);
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

  const existing = await prisma.sector.findUnique({ where: { code: d.code } });
  if (existing) return NextResponse.json({ error: "Sector code already exists" }, { status: 409 });

  const sector = await prisma.sector.create({
    data: {
      code: d.code,
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      description: d.description ?? null,
      color: d.color,
      sortOrder: d.sortOrder,
      targetRevPct: d.targetRevPct,
      isActive: d.isActive,
    },
  });

  // Optionally create a SectorWallet
  if (d.createWallet) {
    await prisma.wallet.create({
      data: {
        ownerId: session.user.id, // owned by the creator (admin) as placeholder
        sectorId: sector.id,
        walletType: "SectorWallet",
        balanceCoins: 0,
      },
    }).catch(() => null);
  }

  await logAudit({
    userId: session.user.id,
    action: "sector_create",
    entityType: "Sector",
    entityId: sector.id,
    severity: "info",
    after: { code: d.code, nameEn: d.nameEn },
  });

  return NextResponse.json({ success: true, sectorId: sector.id, code: sector.code }, { status: 201 });
}
