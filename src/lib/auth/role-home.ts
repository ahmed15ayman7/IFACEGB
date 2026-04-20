import type { UserRole } from "@prisma/client";

/**
 * Single canonical "home" URL per role — use for post-login routing and RBAC redirects
 * so we never bounce between /dashboard and /employee (or similar).
 */
export function getRoleHomePath(locale: string, role: UserRole, sectorId: string | null): string {
  const base = `/${locale}`;

  switch (role) {
    case "super_admin":
      return `${base}/god-view`;
    case "admin":
      return `${base}/admin/employees`;
    case "sector_manager":
      return sectorId ? `${base}/sector/${sectorId}` : `${base}/lms`;
    case "employee":
      return `${base}/employee`;
    case "trainer":
      return `${base}/trainer`;
    case "agent":
      return `${base}/franchise`;
    case "center":
      return `${base}/center`;
    case "client":
      return `${base}/client`;
    case "user":
      return `${base}/user`;
  }
}
