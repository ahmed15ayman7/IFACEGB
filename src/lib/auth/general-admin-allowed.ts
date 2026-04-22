import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ALLOWED: UserRole[] = ["super_admin", "admin", "sector_manager"];

export function isGeneralAdminRoleAllowed(role: UserRole): boolean {
  return (ALLOWED as readonly string[]).includes(role);
}

/** sector_manager is allowed only when assigned to the general-admin sector. */
export async function canAccessGeneralAdminDashboard(
  role: UserRole,
  sectorId: string | null,
  sectorCode: string | null
): Promise<boolean> {
  if (role === "super_admin" || role === "admin") return true;
  if (role !== "sector_manager" || !sectorId) return false;
  if (sectorCode === "general-admin") return true;
  const s = await prisma.sector.findUnique({ where: { id: sectorId }, select: { code: true } });
  return s?.code === "general-admin";
}
