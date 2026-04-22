import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { SessionExtraSectorAccess } from "@/types/next-auth";

/**
 * Ensures the user is allowed to use the dashboard (DB is source of truth).
 * Call from the dashboard layout so suspension / deactivation takes effect on next navigation.
 */
export async function ensureDashboardAccess(locale: string): Promise<{
  session: Session;
  extraSectorAccess: SessionExtraSectorAccess[];
}> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  const row = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, isSuspended: true },
  });

  if (!row || !row.isActive || row.isSuspended) {
    redirect(`/${locale}/auth/login?error=disabled`);
  }

  const extra = await prisma.userSectorAccess.findMany({
    where: { userId: session.user.id },
    include: { sector: { select: { id: true, code: true, nameEn: true, nameAr: true, isActive: true } } },
  });

  const extraSectorAccess: SessionExtraSectorAccess[] = extra
    .filter((r) => r.sector.isActive)
    .map((r) => ({
      sectorId: r.sectorId,
      code: r.sector.code,
      nameEn: r.sector.nameEn,
      nameAr: r.sector.nameAr,
      accessLevel: r.accessLevel,
    }));

  return { session, extraSectorAccess };
}
