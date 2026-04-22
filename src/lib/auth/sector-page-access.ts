import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getRoleHomePath } from "./role-home";

type User = Session["user"];

const SECTOR_DASH_ROLES: UserRole[] = ["sector_manager", "admin", "super_admin"];

/**
 * Resolves view vs manage access to a real sector (by DB id + code).
 * - Home sector (`user.sectorId === sector.id`) = full access.
 * - `UserSectorAccess` with read_only = browse-only; manager = same as home for extras.
 * - Admins: full access.
 */
export function getSectorPageAccess(
  user: User,
  sector: { id: string; code: string }
): { allowed: boolean; readOnly: boolean } {
  if (user.role === "super_admin" || user.role === "admin") {
    return { allowed: true, readOnly: false };
  }
  if (user.sectorId === sector.id) {
    return { allowed: true, readOnly: false };
  }
  const extra = user.extraSectorAccess ?? [];
  const g = extra.find((e) => e.sectorId === sector.id);
  if (!g) {
    return { allowed: false, readOnly: false };
  }
  return { allowed: true, readOnly: g.accessLevel === "read_only" };
}

/**
 * Server pages: sector dashboard routes (not fallbacks). Redirects if not allowed.
 */
export function assertSectorDashboardAccess(
  user: NonNullable<User>,
  sector: { id: string; code: string },
  locale: string
): { readOnly: boolean } {
  const { allowed, readOnly } = getSectorPageAccess(user, sector);
  if (!allowed || !SECTOR_DASH_ROLES.includes(user.role)) {
    redirect(getRoleHomePath(locale, user.role, user.sectorId ?? null, user.sectorCode ?? null));
  }
  return { readOnly };
}
