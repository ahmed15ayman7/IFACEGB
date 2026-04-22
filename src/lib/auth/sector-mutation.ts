import "server-only";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import { getSectorPageAccess } from "./sector-page-access";

/** True if the user may perform mutating actions on behalf of this sector (not read-only grant). */
export async function canWriteSector(
  user: NonNullable<Session["user"]>,
  sectorId: string | null
): Promise<boolean> {
  if (!sectorId) return false;
  if (user.role === "super_admin" || user.role === "admin") return true;
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    select: { id: true, code: true },
  });
  if (!sector) return false;
  const a = getSectorPageAccess(user, sector);
  return a.allowed && !a.readOnly;
}
