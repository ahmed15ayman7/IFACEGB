import type { UserRole } from "@prisma/client";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getSectorPageAccess } from "./sector-page-access";

const ALLOWED: UserRole[] = ["super_admin", "admin", "sector_manager"];

const GA_CODE = "general-admin";

export function isGeneralAdminRoleAllowed(role: UserRole): boolean {
  return (ALLOWED as readonly string[]).includes(role);
}

export type GeneralAdminAccess = { allowed: boolean; readOnly: boolean };

/**
 * Who may open general-admin UI: admins, or sector_manager with home GA / extra GA (read or write).
 */
export async function resolveGeneralAdminAccess(
  user: NonNullable<Session["user"]>
): Promise<GeneralAdminAccess> {
  if (user.role === "super_admin" || user.role === "admin") {
    return { allowed: true, readOnly: false };
  }
  if (user.role !== "sector_manager") {
    return { allowed: false, readOnly: false };
  }

  const sector = await prisma.sector.findFirst({
    where: { code: GA_CODE },
    select: { id: true, code: true },
  });
  if (!sector) {
    return { allowed: false, readOnly: false };
  }

  const a = getSectorPageAccess(user, sector);
  if (!a.allowed) {
    return { allowed: false, readOnly: false };
  }
  return { allowed: true, readOnly: a.readOnly };
}

/** @deprecated Prefer resolveGeneralAdminAccess for read-only handling */
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
