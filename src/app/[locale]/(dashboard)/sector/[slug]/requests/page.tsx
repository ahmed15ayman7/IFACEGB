import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { assertSectorDashboardAccess } from "@/lib/auth/sector-page-access";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { IsrInboxClient } from "@/components/dashboard/isr/IsrInboxClient";

type Props = { params: Promise<{ slug: string }> };

export default async function SectorRequestsPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.sectorPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);

  const sector = await prisma.sector.findFirst({
    where: { OR: [{ code: slug }, { id: slug }] },
    select: { id: true, nameEn: true, nameAr: true, code: true },
  });
  if (!sector) notFound();
  const { readOnly } = assertSectorDashboardAccess(
    session.user,
    { id: sector.id, code: sector.code },
    locale
  );

  const isRtl = locale === "ar";
  const sectorName = isRtl ? (sector.nameAr ?? sector.nameEn) : sector.nameEn;

  const [inbox, sent] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { toSectorId: sector.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        requester: { select: { name: true, nameAr: true } },
        sector: { select: { nameEn: true, nameAr: true } },
      },
    }),
    prisma.serviceRequest.findMany({
      where: { fromSectorId: sector.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        requester: { select: { name: true, nameAr: true } },
        sector: { select: { nameEn: true, nameAr: true } },
      },
    }),
  ]);

  const serialize = <T extends { createdAt: Date; slaDeadline?: Date | null }>(items: T[]) =>
    items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      slaDeadline: item.slaDeadline ? item.slaDeadline.toISOString() : null,
    }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {readOnly && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
          Read-only access — you cannot create requests or change ISR status.
        </p>
      )}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/sector/${slug}`}
            className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
          >
            {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
            {sectorName}
          </Link>
          <span className="text-[#6e7d93] opacity-40">·</span>
          <h1
            className="text-lg font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("requests_title")}
          </h1>
        </div>
        {!readOnly && (
          <Link
            href={`/${locale}/sector/${slug}/requests/new`}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[rgba(201,162,39,0.9)] px-4 text-xs font-semibold text-[#060f1e] hover:bg-[#C9A227] transition-colors"
          >
            <Plus className="size-3.5" aria-hidden />
            {t("action_new_request")}
          </Link>
        )}
      </div>

      <p className="text-xs text-[#6e7d93]">{t("requests_subtitle")}</p>

      <IsrInboxClient inbox={serialize(inbox)} sent={serialize(sent)} readOnly={readOnly} />
    </div>
  );
}
