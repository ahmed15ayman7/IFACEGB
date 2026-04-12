import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const SECTOR_ICONS: Record<string, string> = {
  training: "🎓",
  accreditation: "🏛",
  consultancy: "⚖️",
  tech: "⚙️",
  partnerships: "🌐",
};

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
    // Last 6 months revenue
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

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function SectorDashboard({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect(`/${locale}/auth/login`);

  const data = await getSectorData(slug);
  if (!data) redirect(`/${locale}/dashboard`);

  const { sector, metrics, revenueChart } = data;
  const icon = SECTOR_ICONS[slug] ?? "🏢";

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{icon}</span>
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

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Wallet Balance", value: metrics.walletBalance.toLocaleString(), suffix: "coins", color: "#C9A227" },
          { label: "Monthly Revenue", value: metrics.monthlyRevenue.toLocaleString(), suffix: "coins", color: "#e8c84a" },
          { label: "Pending Requests", value: metrics.pendingRequests.toString(), suffix: "open", color: "#A8B5C8" },
          { label: "Resolved Today", value: metrics.resolvedToday.toString(), suffix: "done", color: "#22c55e" },
          { label: "SLA Breaches", value: metrics.openSLA.toString(), suffix: "overdue", color: metrics.openSLA > 0 ? "#9C2A2A" : "#6e7d93" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4"
          >
            <p className="text-2xl font-bold" style={{ color: kpi.color, fontFamily: "var(--font-eb-garamond)" }}>
              {kpi.value}
            </p>
            <p className="text-[#6e7d93] text-xs mt-0.5">{kpi.label}</p>
            <p className="text-[10px] text-[#6e7d93] opacity-60">{kpi.suffix}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Quick Actions */}
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

        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5 space-y-3">
          <h3
            className="text-[#C9A227] font-semibold"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            Quick Actions
          </h3>
          {[
            { href: `/${locale}/sector/${slug}/requests/new`, label: "New Service Request", icon: "➕" },
            { href: `/${locale}/sector/${slug}/employees`, label: "View Employees", icon: "👥" },
            { href: `/${locale}/sector/${slug}/wallet`, label: "Wallet & Finance", icon: "💰" },
            { href: `/${locale}/sector/${slug}/certificates`, label: "Certificates", icon: "🏆" },
            { href: `/${locale}/sector/${slug}/reports`, label: "Reports", icon: "📊" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[rgba(201,162,39,0.06)] transition-colors group"
            >
              <span className="text-lg">{action.icon}</span>
              <span className="text-sm text-[#A8B5C8] group-hover:text-[#C9A227] transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
