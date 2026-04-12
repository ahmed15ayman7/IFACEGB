import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import Link from "next/link";

const PORTAL_TABS = [
  { key: "profile", labelEn: "My Profile", labelAr: "بروفايلي", icon: "👤" },
  { key: "wallet", labelEn: "My Wallet", labelAr: "محفظتي", icon: "💰" },
  { key: "rewards", labelEn: "Rewards", labelAr: "المكافآت", icon: "🏅" },
  { key: "attendance", labelEn: "Attendance", labelAr: "الحضور والانصراف", icon: "📅" },
  { key: "leaves", labelEn: "Leaves & Requests", labelAr: "الإجازات والطلبات", icon: "📋" },
  { key: "contracts", labelEn: "My Contracts", labelAr: "عقودي", icon: "📄" },
  { key: "calendar", labelEn: "Calendar & Notes", labelAr: "التقويم والنوتس", icon: "🗓" },
  { key: "connect", labelEn: "Connect", labelAr: "التواصل", icon: "💬" },
  { key: "cv", labelEn: "My CV", labelAr: "سيرتي الذاتية", icon: "📑" },
];

async function getEmployeePortalData(userId: string) {
  const [employee, wallet, bonuses, attendance, hrRequests] = await Promise.all([
    prisma.employee.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, nameAr: true, email: true, role: true, avatarUrl: true } },
        sector: { select: { nameEn: true, nameAr: true } },
        performanceTargets: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.wallet.findFirst({ where: { ownerId: userId, walletType: "EmployeeWallet" } }),
    prisma.bonus.findMany({
      where: { employee: { userId }, status: "pending" },
      orderBy: { issuedAt: "desc" },
      take: 10,
    }),
    prisma.attendance.findMany({
      where: { employee: { userId } },
      orderBy: { date: "desc" },
      take: 7,
    }),
    prisma.hrRequest.findMany({
      where: { requestedBy: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { employee, wallet, bonuses, attendance, hrRequests };
}

export default async function EmployeePortalPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["employee", "trainer"].includes(session.user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const data = await getEmployeePortalData(session.user.id);
  if (!data.employee) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#6e7d93]">Employee profile not found. Contact HR admin.</p>
      </div>
    );
  }

  const { employee, wallet, bonuses, attendance, hrRequests } = data;
  const isAr = locale === "ar";

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[rgba(201,162,39,0.1)] border-2 border-[rgba(201,162,39,0.3)] flex items-center justify-center text-2xl">
          {employee.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={employee.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : "👤"}
        </div>
        <div>
          <h1
            className="text-xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {isAr ? employee.user.nameAr ?? employee.user.name : employee.user.name}
          </h1>
          <p className="text-[#6e7d93] text-sm">
            {isAr ? employee.jobTitleAr ?? employee.jobTitleEn : employee.jobTitleEn}
            {employee.sector && ` · ${isAr ? employee.sector.nameAr : employee.sector.nameEn}`}
          </p>
          <p className="text-[#6e7d93] text-xs mt-0.5">
            Code: {employee.employeeCode} · Kinetic Points: {employee.kineticPoints}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PORTAL_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/${locale}/employee/${tab.key}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] hover:text-[#C9A227] hover:border-[rgba(201,162,39,0.35)] transition-all whitespace-nowrap text-xs"
          >
            <span>{tab.icon}</span>
            <span>{isAr ? tab.labelAr : tab.labelEn}</span>
          </Link>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {Number(wallet?.balanceCoins ?? 0).toLocaleString()}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{isAr ? "رصيد المحفظة" : "Wallet Balance"}</p>
          <p className="text-[10px] text-[#6e7d93] opacity-60">coins</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#e8c84a]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {bonuses.length}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{isAr ? "مكافآت معلقة" : "Pending Rewards"}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#A8B5C8]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {employee.kineticPoints}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{isAr ? "نقاط كينيتيك" : "Kinetic Points"}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {Number(employee.profitSharePct).toFixed(1)}%
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{isAr ? "نسبة الأرباح" : "Profit Share"}</p>
        </div>
      </div>

      {/* Recent Attendance + Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5">
          <h3 className="text-[#C9A227] font-semibold mb-3 text-sm" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {isAr ? "سجل الحضور (آخر 7 أيام)" : "Attendance (Last 7 Days)"}
          </h3>
          <div className="space-y-2">
            {attendance.length === 0 ? (
              <p className="text-[#6e7d93] text-xs">No attendance records yet.</p>
            ) : (
              attendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-[rgba(201,162,39,0.06)] last:border-0">
                  <span className="text-xs text-[#A8B5C8]">
                    {new Date(a.date).toLocaleDateString("en-GB")}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: a.status === "present" ? "rgba(34,197,94,0.1)" : "rgba(156,42,42,0.1)",
                      color: a.status === "present" ? "#22c55e" : "#9C2A2A",
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5">
          <h3 className="text-[#C9A227] font-semibold mb-3 text-sm" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {isAr ? "الطلبات الأخيرة" : "Recent HR Requests"}
          </h3>
          <div className="space-y-2">
            {hrRequests.length === 0 ? (
              <p className="text-[#6e7d93] text-xs">No requests yet.</p>
            ) : (
              hrRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-[rgba(201,162,39,0.06)] last:border-0">
                  <span className="text-xs text-[#A8B5C8]">{r.type.replace("_", " ")}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: r.status === "approved" ? "rgba(34,197,94,0.1)" : r.status === "rejected" ? "rgba(156,42,42,0.1)" : "rgba(201,162,39,0.1)",
                      color: r.status === "approved" ? "#22c55e" : r.status === "rejected" ? "#9C2A2A" : "#C9A227",
                    }}
                  >
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link
            href={`/${locale}/employee/leaves`}
            className="mt-3 w-full h-8 text-xs rounded-lg border border-[rgba(201,162,39,0.2)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.06)] flex items-center justify-center transition-colors"
          >
            {isAr ? "طلب إجازة جديدة" : "New Leave Request"}
          </Link>
        </div>
      </div>
    </div>
  );
}
