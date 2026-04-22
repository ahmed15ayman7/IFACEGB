import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { IsrRoutingHubClient } from "@/components/dashboard/generalAdmin/IsrRoutingHubClient";
import { resolveGeneralAdminAccess } from "@/lib/auth/general-admin-allowed";

export default async function GeneralAdminIsrPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.generalAdmin");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  const ga = await resolveGeneralAdminAccess(session.user);
  if (!ga.allowed) {
    redirect(`/${locale}/dashboard`);
  }
  const readOnly = ga.readOnly;

  const sector = await prisma.sector.findFirst({ where: { code: "general-admin" } });

  const isrs = sector
    ? await prisma.serviceRequest.findMany({
        where: { toSectorId: sector.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          requester: { select: { name: true, nameAr: true } },
        },
      })
    : [];

  // Fetch fromSector names separately since there's no direct relation
  const fromSectorIds = [...new Set(isrs.map((i) => i.fromSectorId).filter(Boolean) as string[])];
  const fromSectors = fromSectorIds.length
    ? await prisma.sector.findMany({
        where: { id: { in: fromSectorIds } },
        select: { id: true, nameEn: true, nameAr: true },
      })
    : [];
  const fromSectorMap = Object.fromEntries(fromSectors.map((s) => [s.id, s]));

  const allSectors = await prisma.sector.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameEn: true, nameAr: true, code: true },
  });

  const serializedIsrs = isrs.map((isr) => ({
    id: isr.id,
    subject: isr.titleEn,
    priority: isr.priority ?? "normal",
    status: isr.status,
    createdAt: isr.createdAt.toISOString(),
    requester: {
      name: isr.requester?.name ?? null,
      nameAr: isr.requester?.nameAr ?? null,
    },
    fromSector: isr.fromSectorId && fromSectorMap[isr.fromSectorId]
      ? { nameEn: fromSectorMap[isr.fromSectorId].nameEn, nameAr: fromSectorMap[isr.fromSectorId].nameAr ?? null }
      : null,
    toSectorId: isr.toSectorId ?? null,
  }));

  return (
    <main className="p-6 space-y-6">
      {readOnly && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
          Read-only access — routing is disabled.
        </p>
      )}
      <div>
        <h1 className="text-xl font-bold text-white">{t("isr_title")}</h1>
        <p className="text-[#64748B] text-sm mt-1">{t("isr_subtitle")}</p>
      </div>
      <IsrRoutingHubClient
        isrs={serializedIsrs}
        sectors={allSectors}
        readOnly={readOnly}
      />
    </main>
  );
}
