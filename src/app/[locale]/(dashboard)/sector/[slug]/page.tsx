import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SectorDashboardHeaderIcon } from "@/components/dashboard/SectorDashboardHeaderIcon";
import { SectorKpiCards } from "@/components/dashboard/SectorKpiCards";
import { SectorQuickActions } from "@/components/dashboard/SectorQuickActions";

async function getSectorData(slug: string, locale: string) {
  // slug can be either a sector `code` (for super_admin links like /sector/training)
  // or a sector `id` (cuid, for sector_manager whose nav uses sectorId from session).
  const sector = await prisma.sector.findFirst({
    where: { OR: [{ code: slug }, { id: slug }] },
    include: {
      wallets: { where: { walletType: "SectorWallet" } },
      _count: {
        select: {
          users: true,
          serviceRequests: true,
        },
      },
    },
  });
  if (!sector) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthLocale = locale === "ar" ? "ar-EG" : "en-US";

  const [pendingRequests, resolvedToday, openSLA, walletTxns, kpiData] = await Promise.all([
    prisma.serviceRequest.count({
      where: { toSectorId: sector.id, status: { in: ["pending", "acknowledged"] } },
    }),
    prisma.serviceRequest.count({
      where: { toSectorId: sector.id, status: "completed", resolvedAt: { gte: today } },
    }),
    prisma.serviceRequest.count({
      where: {
        toSectorId: sector.id,
        status: { in: ["pending", "in_progress"] },
        slaDeadline: { lt: new Date() },
      },
    }),
    prisma.coinTransaction.aggregate({
      where: {
        receiverWallet: { sectorId: sector.id },
        status: "completed",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: { amountCoins: true },
    }),
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return prisma.coinTransaction
          .aggregate({
            where: {
              receiverWallet: { sectorId: sector.id },
              status: "completed",
              createdAt: { gte: start, lte: end },
            },
            _sum: { amountCoins: true },
          })
          .then((r) => ({
            month: d.toLocaleString(monthLocale, { month: "short" }),
            revenue: Number(r._sum.amountCoins ?? 0),
          }));
      })
    ),
  ]);

  return {
    sector,
    metrics: {
      pendingRequests,
      resolvedToday,
      openSLA,
      monthlyRevenue: Number(walletTxns._sum.amountCoins ?? 0),
      walletBalance: Number(sector.wallets[0]?.balanceCoins ?? 0),
      employeeCount: sector._count.users,
    },
    revenueChart: kpiData,
  };
}

type SectorDashboardData = NonNullable<Awaited<ReturnType<typeof getSectorData>>>;

const KNOWN_SECTOR_SLUGS = [
  "training",
  "accreditation",
  "consultancy",
  "tech",
  "partnerships",
] as const;

function emptyRevenueChart(locale: string) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { month: "short" }),
      revenue: 0,
    };
  });
}

async function buildFallbackSectorDashboard(slug: string, locale: string): Promise<SectorDashboardData | null> {
  if (!KNOWN_SECTOR_SLUGS.includes(slug as (typeof KNOWN_SECTOR_SLUGS)[number])) return null;
  const tEn = await getTranslations({ locale: "en", namespace: "dashboard.sectorPortal" });
  const tAr = await getTranslations({ locale: "ar", namespace: "dashboard.sectorPortal" });
  const tf = await getTranslations({ locale, namespace: "dashboard.sectorPortal" });
  const base = `fallback.${slug}` as const;
  return {
    sector: {
      nameEn: tEn(`${base}.name`),
      nameAr: tAr(`${base}.name`),
      description: tf(`${base}.description`),
    } as SectorDashboardData["sector"],
    metrics: {
      pendingRequests: 0,
      resolvedToday: 0,
      openSLA: 0,
      monthlyRevenue: 0,
      walletBalance: 0,
      employeeCount: 0,
    },
    revenueChart: emptyRevenueChart(locale),
  };
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function SectorDashboard({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.sectorPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);

  let data = await getSectorData(slug, locale);
  if (!data) {
    const role = session.user.role;
    if (role === "super_admin" || role === "admin") {
      const fallback = await buildFallbackSectorDashboard(slug, locale);
      if (!fallback) notFound();
      data = fallback;
    } else {
      redirect(getRoleHomePath(locale, role, session.user.sectorId ?? null));
    }
  }

  const { sector, metrics, revenueChart } = data;
  const sectorRow = sector as { nameEn: string; nameAr?: string | null; description: string | null };
  const displayName = locale === "ar" ? sectorRow.nameAr ?? sectorRow.nameEn : sectorRow.nameEn;

  const kpiItems = [
    {
      label: t("kpi_wallet"),
      value: metrics.walletBalance.toLocaleString(),
      suffix: t("kpi_wallet_suffix"),
      color: "#C9A227",
    },
    {
      label: t("kpi_revenue"),
      value: metrics.monthlyRevenue.toLocaleString(),
      suffix: t("kpi_wallet_suffix"),
      color: "#e8c84a",
    },
    {
      label: t("kpi_pending"),
      value: metrics.pendingRequests.toString(),
      suffix: t("kpi_pending_suffix"),
      color: "#A8B5C8",
    },
    {
      label: t("kpi_resolved"),
      value: metrics.resolvedToday.toString(),
      suffix: t("kpi_resolved_suffix"),
      color: "#22c55e",
    },
    {
      label: t("kpi_sla"),
      value: metrics.openSLA.toString(),
      suffix: t("kpi_sla_suffix"),
      color: metrics.openSLA > 0 ? "#9C2A2A" : "#6e7d93",
    },
  ];

  const quickActions = [
    { href: `/${locale}/sector/${slug}/requests/new`, label: t("action_new_request"), icon: "plus" as const },
    { href: `/${locale}/sector/${slug}/employees`, label: t("action_employees"), icon: "users" as const },
    { href: `/${locale}/sector/${slug}/wallet`, label: t("action_wallet"), icon: "wallet" as const },
    { href: `/${locale}/sector/${slug}/certificates`, label: t("action_certificates"), icon: "award" as const },
    { href: `/${locale}/sector/${slug}/reports`, label: t("action_reports"), icon: "chart" as const },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <SectorDashboardHeaderIcon slug={slug} />
            <h1
              className="text-2xl font-bold text-[#C9A227]"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {displayName}
            </h1>
          </div>
          <p className="text-[#6e7d93] text-sm">{sectorRow.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/sector/${slug}/requests`}
            className="h-8 px-4 text-xs font-medium rounded-lg border border-[rgba(201,162,39,0.3)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.08)] flex items-center"
          >
            {t("isr_inbox")}
          </Link>
          <Link
            href={`/${locale}/sector/${slug}/inter-ops`}
            className="h-8 px-4 text-xs font-medium rounded-lg bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.2)] hover:bg-[rgba(201,162,39,0.15)] flex items-center"
          >
            {t("inter_ops")}
          </Link>
        </div>
      </div>

      <SectorKpiCards items={kpiItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5">
          <h3
            className="text-[#C9A227] font-semibold mb-4"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("revenue_trend")}
          </h3>
          <div className="flex items-end gap-2 h-32">
            {revenueChart.map((d, i) => {
              const max = Math.max(...revenueChart.map((x) => x.revenue), 1);
              const h = Math.max((d.revenue / max) * 100, 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${h}%`,
                      background: i === 5 ? "#C9A227" : "rgba(201,162,39,0.3)",
                    }}
                  />
                  <span className="text-[10px] text-[#6e7d93]">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <SectorQuickActions actions={quickActions} />
      </div>
    </div>
  );
}
