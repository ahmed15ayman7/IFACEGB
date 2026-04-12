import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { getLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SectorDashboardHeaderIcon } from "@/components/dashboard/SectorDashboardHeaderIcon";
import { SectorKpiCards } from "@/components/dashboard/SectorKpiCards";
import { SectorQuickActions } from "@/components/dashboard/SectorQuickActions";

async function getSectorData(slug: string) {
  const sector = await prisma.sector.findUnique({
    where: { code: slug },
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
            month: d.toLocaleString("en-US", { month: "short" }),
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

const SECTOR_FALLBACK_META: Record<
  (typeof KNOWN_SECTOR_SLUGS)[number],
  { nameEn: string; description: string }
> = {
  training: {
    nameEn: "Training & Development",
    description: "Professional training programs, LMS, virtual classrooms, and certified diplomas.",
  },
  accreditation: {
    nameEn: "International Accreditation",
    description: "World-recognized institutional and program accreditation.",
  },
  consultancy: {
    nameEn: "Consultancy & Excellence",
    description: "Strategic institutional consulting and performance excellence.",
  },
  tech: {
    nameEn: "Tech Engine",
    description: "AI-powered EdTech, Face-ID services, and digital infrastructure.",
  },
  partnerships: {
    nameEn: "Global Partnerships",
    description: "Master franchise network and international alliances.",
  },
};

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

/** When DB has no Sector row yet, super_admin/admin still need to open these URLs (no redirect to god-view). */
function buildFallbackSectorDashboard(slug: string, locale: string): SectorDashboardData | null {
  if (!KNOWN_SECTOR_SLUGS.includes(slug as (typeof KNOWN_SECTOR_SLUGS)[number])) return null;
  const meta = SECTOR_FALLBACK_META[slug as keyof typeof SECTOR_FALLBACK_META];
  return {
    sector: { nameEn: meta.nameEn, description: meta.description } as SectorDashboardData["sector"],
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

  if (!session?.user) redirect(`/${locale}/auth/login`);

  let data = await getSectorData(slug);
  if (!data) {
    const role = session.user.role;
    if (role === "super_admin" || role === "admin") {
      const fallback = buildFallbackSectorDashboard(slug, locale);
      if (!fallback) notFound();
      data = fallback;
    } else {
      redirect(getRoleHomePath(locale, role, session.user.sectorId ?? null));
    }
  }

  const { sector, metrics, revenueChart } = data;

  const kpiItems = [
    { label: "Wallet Balance", value: metrics.walletBalance.toLocaleString(), suffix: "coins", color: "#C9A227" },
    { label: "Monthly Revenue", value: metrics.monthlyRevenue.toLocaleString(), suffix: "coins", color: "#e8c84a" },
    { label: "Pending Requests", value: metrics.pendingRequests.toString(), suffix: "open", color: "#A8B5C8" },
    { label: "Resolved Today", value: metrics.resolvedToday.toString(), suffix: "done", color: "#22c55e" },
    { label: "SLA Breaches", value: metrics.openSLA.toString(), suffix: "overdue", color: metrics.openSLA > 0 ? "#9C2A2A" : "#6e7d93" },
  ];

  const quickActions = [
    { href: `/${locale}/sector/${slug}/requests/new`, label: "New Service Request", icon: "plus" as const },
    { href: `/${locale}/sector/${slug}/employees`, label: "View Employees", icon: "users" as const },
    { href: `/${locale}/sector/${slug}/wallet`, label: "Wallet & Finance", icon: "wallet" as const },
    { href: `/${locale}/sector/${slug}/certificates`, label: "Certificates", icon: "award" as const },
    { href: `/${locale}/sector/${slug}/reports`, label: "Reports", icon: "chart" as const },
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
              {sector.nameEn}
            </h1>
          </div>
          <p className="text-[#6e7d93] text-sm">{sector.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/sector/${slug}/requests`}
            className="h-8 px-4 text-xs font-medium rounded-lg border border-[rgba(201,162,39,0.3)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.08)] flex items-center"
          >
            ISR Inbox
          </Link>
          <Link
            href={`/${locale}/sector/${slug}/inter-ops`}
            className="h-8 px-4 text-xs font-medium rounded-lg bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.2)] hover:bg-[rgba(201,162,39,0.15)] flex items-center"
          >
            Inter-Ops
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
            Revenue Trend (6 months)
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
