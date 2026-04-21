import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["super_admin", "admin", "sector_manager"];

export async function GET() {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sector = await prisma.sector.findFirst({ where: { code: "general-admin" } });
  if (!sector) {
    return NextResponse.json({ employees: [] });
  }

  const employees = await prisma.employee.findMany({
    where: { sectorId: sector.id },
    include: { user: { select: { name: true, nameAr: true, avatarUrl: true } } },
    orderBy: [{ departmentEn: "asc" }, { kineticPoints: "desc" }],
  });

  return NextResponse.json({ employees });
}
