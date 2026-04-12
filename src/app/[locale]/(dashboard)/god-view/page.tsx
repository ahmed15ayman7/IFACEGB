import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { GodViewKPIStrip } from "@/features/god-view/components/KPIStrip";
import { GodViewKillSwitch } from "@/features/god-view/components/KillSwitch";
import { EDirectiveComposer } from "@/features/god-view/components/EDirectiveComposer";
import { AuditTrailFeed } from "@/features/god-view/components/AuditTrailFeed";
import { SectorWalletChart } from "@/features/god-view/components/SectorWalletChart";
import { EmployeeStatusGrid } from "@/features/god-view/components/EmployeeStatusGrid";

async function getGodViewData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    certsToday,
    financialFlow,
    activeExams,
    activeAgents,
    pendingDirectives,
    sectorWallets,
    criticalAlerts,
    recentAudit,
    employees,
  ] = await Promise.all([
    prisma.certificate.count({ where: { issueDate: { gte: today } } }),
    prisma.coinTransaction.aggregate({
      where: { createdAt: { gte: today }, status: "completed" },
      _sum: { amountCoins: true },
    }),
    prisma.examSession.count({ where: { status: "in_progress" } }),
    prisma.agentLicense.count({ where: { status: "active" } }),
    prisma.eDirective.count({ where: { status: "active" } }),
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
  ]);

  return {
    kpis: {
      certsToday,
      financialFlow: Number(financialFlow._sum.amountCoins ?? 0),
      activeExams,
      activeAgents,
      pendingDirectives,
      criticalAlerts,
    },
    sectorWallets,
    recentAudit,
    employees,
  };
}

export default async function GodViewPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "super_admin") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const data = await getGodViewData();

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            God View — Sovereign Command Center
          </h1>
          <p className="text-[#6e7d93] text-sm mt-1">
            Real-time platform oversight • {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(201,162,39,0.3)] bg-[rgba(201,162,39,0.06)]">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[#C9A227] text-xs font-medium">LIVE</span>
        </div>
      </div>

      {/* Kill Switch */}
      <GodViewKillSwitch adminId={session.user.id} />

      {/* KPI Strip */}
      <GodViewKPIStrip kpis={data.kpis} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sector Wallets Chart */}
        <div className="lg:col-span-2">
          <SectorWalletChart wallets={data.sectorWallets.map(w => ({
          ...w,
          balanceCoins: Number(w.balanceCoins),
          sector: w.sector ? { nameEn: w.sector.nameEn, color: w.sector.color } : null,
        }))} />
        </div>

        {/* E-Directive Composer */}
        <div>
          <EDirectiveComposer authorId={session.user.id} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AuditTrailFeed entries={data.recentAudit} />
        <EmployeeStatusGrid employees={data.employees} />
      </div>
    </div>
  );
}
