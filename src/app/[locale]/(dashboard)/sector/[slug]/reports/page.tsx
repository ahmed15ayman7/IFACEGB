import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { assertSectorDashboardAccess } from "@/lib/auth/sector-page-access";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3 } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export default async function SectorReportsPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.sectorPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);

  const sector = await prisma.sector.findFirst({
    where: { OR: [{ code: slug }, { id: slug }] },
    select: { id: true, code: true, nameEn: true, nameAr: true },
  });
  if (!sector) notFound();
  assertSectorDashboardAccess(session.user, { id: sector.id, code: sector.code }, locale);

  const isRtl = locale === "ar";
  const monthLocale = isRtl ? "ar-EG" : "en-US";
  const sectorName = isRtl ? (sector.nameAr ?? sector.nameEn) : sector.nameEn;

  // Revenue last 6 months
  const revenueChart = await Promise.all(
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
  );

  // SLA stats
  const [totalRequests, resolvedOnTime, slaBreached, recentActivity] = await Promise.all([
    prisma.serviceRequest.count({ where: { toSectorId: sector.id } }),
    // Count resolved requests where resolvedAt is before slaDeadline (on-time)
    prisma.serviceRequest
      .findMany({
        where: {
          toSectorId: sector.id,
          status: { in: ["completed","escalated"] },
          resolvedAt: { not: null },
        },
        select: { resolvedAt: true, slaDeadline: true },
      })
      .then((rows) => rows.filter((r) => !r.slaDeadline || (r.resolvedAt! <= r.slaDeadline)).length),
    prisma.serviceRequest.count({
      where: {
        toSectorId: sector.id,
        slaDeadline: { lt: new Date() },
        status: { in: ["pending", "in_progress"] },
      },
    }),
    prisma.serviceRequest.findMany({
      where: { OR: [{ toSectorId: sector.id }, { fromSectorId: sector.id }] },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        titleEn: true,
        titleAr: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    }),
  ]);

  const chartMax = Math.max(...revenueChart.map((d) => d.revenue), 1);
  const resolvedTotal = totalRequests > 0 ? Math.round(((resolvedOnTime) / totalRequests) * 100) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/sector/${slug}`}
          className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
        >
          {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
          {sectorName}
        </Link>
        <span className="text-[#6e7d93] opacity-40">·</span>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-[#C9A227]" aria-hidden />
          <h1
            className="text-lg font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("reports_title")}
          </h1>
        </div>
      </div>

      <p className="text-xs text-[#6e7d93]">{t("reports_subtitle")}</p>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.6)] p-5">
        <h2 className="text-[#C9A227] font-semibold mb-4" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("reports_revenue_6m")}
        </h2>
        <div className="flex items-end gap-2 h-40">
          {revenueChart.map((d, i) => {
            const h = Math.max((d.revenue / chartMax) * 100, 4);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-[#C9A227] font-mono">
                  {d.revenue > 0 ? d.revenue.toLocaleString() : ""}
                </span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${h}%`,
                    background: i === 5
                      ? "linear-gradient(180deg, #C9A227 0%, rgba(201,162,39,0.5) 100%)"
                      : "rgba(201,162,39,0.25)",
                  }}
                />
                <span className="text-[10px] text-[#6e7d93]">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SLA Summary */}
      <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.6)] p-5">
        <h2 className="text-[#C9A227] font-semibold mb-4" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("reports_sla_summary")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t("reports_sla_total"), value: totalRequests, color: "#A8B5C8" },
            { label: t("reports_sla_resolved"), value: resolvedOnTime, color: "#22c55e" },
            { label: t("reports_sla_breached"), value: slaBreached, color: slaBreached > 0 ? "#ef4444" : "#6e7d93" },
            { label: t("reports_sla_rate"), value: `${resolvedTotal}%`, color: resolvedTotal >= 80 ? "#22c55e" : resolvedTotal >= 60 ? "#C9A227" : "#ef4444" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-[rgba(201,162,39,0.1)] bg-[rgba(6,15,30,0.5)] p-4 text-center">
              <p className="text-2xl font-bold" style={{ color, fontFamily: "var(--font-eb-garamond)" }}>
                {value}
              </p>
              <p className="text-[10px] text-[#6e7d93] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* SLA progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-[#6e7d93] mb-1">
            <span>SLA compliance</span>
            <span>{resolvedTotal}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[rgba(201,162,39,0.1)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${resolvedTotal}%`,
                background: resolvedTotal >= 80 ? "#22c55e" : resolvedTotal >= 60 ? "#C9A227" : "#ef4444",
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.6)] p-5">
        <h2 className="text-[#C9A227] font-semibold mb-4" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("reports_activity")}
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-[#6e7d93] py-4 text-center">No recent activity.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((req) => {
              const title = isRtl ? (req.titleAr ?? req.titleEn) : req.titleEn;
              const statusColors: Record<string, string> = {
                resolved: "#22c55e", pending: "#C9A227", in_progress: "#3b82f6", rejected: "#ef4444", escalated: "#f97316",
              };
              const color = statusColors[req.status] ?? "#A8B5C8";
              return (
                <Link
                  key={req.id}
                  href={`/${locale}/isr/${req.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(201,162,39,0.04)] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-1.5 rounded-full shrink-0" style={{ background: color }} aria-hidden />
                    <span className="text-xs text-[#A8B5C8] truncate">{title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-[10px] text-[#6e7d93]">
                    <span style={{ color }}>{req.status.replace("_", " ")}</span>
                    <span>·</span>
                    <span>{new Date(req.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
