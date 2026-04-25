import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Globe2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { GodViewKPIStrip } from "@/features/god-view/components/KPIStrip";
import { GodViewKillSwitch } from "@/features/god-view/components/KillSwitch";
import { SectorLockPanel } from "@/features/god-view/components/SectorLockPanel";
import { EDirectiveComposer } from "@/features/god-view/components/EDirectiveComposer";
import { AuditTrailFeed } from "@/features/god-view/components/AuditTrailFeed";
import { SectorWalletChart } from "@/features/god-view/components/SectorWalletChart";
import { EmployeeStatusGrid } from "@/features/god-view/components/EmployeeStatusGrid";
import { SovereignGlobeView } from "@/features/god-view/components/SovereignGlobeView";

export const dynamic = "force-dynamic";

async function getGodViewData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    certsToday,
    financialFlow,
    activeExams,
    activeAgents,
    pendingDirectives,
    successfulDirectives,
    trainers,
    centers,
    sectorWallets,
    criticalAlerts,
    recentAudit,
    employees,
    sectors,
  ] = await Promise.all([
    prisma.certificate.count({ where: { issueDate: { gte: today } } }),
    prisma.coinTransaction.aggregate({
      where: { createdAt: { gte: today }, status: "completed" },
      _sum: { amountCoins: true },
    }),
    prisma.examSession.count({ where: { status: "in_progress" } }),
    prisma.agentLicense.count({ where: { status: "active" } }),
    prisma.eDirective.count({ where: { status: "active" } }),
    prisma.eDirective.count({ where: { acks: { some: {} } } }),
    prisma.user.count({ where: { role: "trainer" } }),
    prisma.accreditedCenter.count({ where: { isActive: true } }),
    prisma.wallet.findMany({
      where: { walletType: "SectorWallet" },
      include: { sector: true },
    }),
    prisma.auditTrail.count({
      where: {
        severity: "critical",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.auditTrail.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true, role: true } } },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, role: true, presence: true } },
        sector: { select: { nameEn: true } },
      },
      take: 50,
    }),
    prisma.sector.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, code: true, nameEn: true, nameAr: true, color: true, isActive: true },
    }),
  ]);

  return {
    kpis: {
      certsToday,
      financialFlow: Number(financialFlow._sum.amountCoins ?? 0),
      activeExams,
      activeAgents,
      pendingDirectives,
      successfulDirectives,
      trainers,
      centers,
      criticalAlerts,
    },
    sectorWallets,
    recentAudit,
    employees,
    sectors,
  };
}

export default async function GodViewPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.godView");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "super_admin") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  let data: Awaited<ReturnType<typeof getGodViewData>> | null = null;
  try {
    data = await getGodViewData();
  } catch {
    data = null;
  }

  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";

  if (!data) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-[#9C2A2A] text-sm text-center max-w-md">{t("loadError")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1
            className="text-2xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("title")}
          </h1>
          <p className="text-[#6e7d93] text-sm mt-1">
            {t("subtitle")} ·{" "}
            {new Date().toLocaleDateString(dateLocale, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/${locale}/god-view/globe`}
            className="inline-flex items-center gap-2 rounded-lg border border-[rgba(201,162,39,0.35)] bg-[rgba(6,15,30,0.6)] px-3 py-1.5 text-xs font-medium text-[#C9A227] hover:bg-[rgba(201,162,39,0.1)] transition-colors"
          >
            <Globe2 className="size-4 shrink-0" aria-hidden />
            الشبكة العالمية
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(201,162,39,0.3)] bg-[rgba(201,162,39,0.06)]">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[#C9A227] text-xs font-medium">{t("live")}</span>
          </div>
        </div>
      </div>

      <GodViewKillSwitch adminId={session.user.id} />

      <SectorLockPanel sectors={data.sectors} adminId={session.user.id} />

      <GodViewKPIStrip kpis={data.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectorWalletChart
            wallets={data.sectorWallets.map((w) => ({
              ...w,
              balanceCoins: Number(w.balanceCoins),
              sector: w.sector ? { nameEn: w.sector.nameEn, color: w.sector.color } : null,
            }))}
          />
        </div>

        <div>
          <EDirectiveComposer authorId={session.user.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AuditTrailFeed entries={data.recentAudit} />
        <EmployeeStatusGrid employees={data.employees} />
      </div>
      <SovereignGlobeView />
    </div>
  );
}
