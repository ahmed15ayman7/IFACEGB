import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Users, Inbox, Ticket, Coins, Building } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const ALLOWED_ROLES = ["super_admin", "admin", "sector_manager"] as const;
const DEPARTMENTS = ["Secretariat", "Public Relations", "Sales"] as const;

export default async function GeneralAdminPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.generalAdmin");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])) {
    redirect(`/${locale}/dashboard`);
  }

  const isRtl = locale === "ar";

  // Find the general-admin sector
  const sector = await prisma.sector.findFirst({ where: { code: "general-admin" } });

  let totalEmployees = 0;
  let pendingIsrs = 0;
  let openTickets = 0;
  let walletBalance = 0;
  let deptStats: Array<{ dept: string; count: number; headName: string | null }> = [];
  let recentIsrs: Array<{
    id: string;
    titleEn: string;
    status: string;
    createdAt: Date;
    fromSectorId: string | null;
  }> = [];
  let fromSectorMap: Record<string, { nameEn: string; nameAr: string | null }> = {};

  if (sector) {
    [totalEmployees, pendingIsrs, openTickets] = await Promise.all([
      prisma.employee.count({ where: { sectorId: sector.id, isActive: true } }),
      prisma.serviceRequest.count({
        where: { toSectorId: sector.id, status: { in: ["pending", "in_progress"] } },
      }),
      prisma.supportTicket.count({ where: { status: "open" } }),
    ]);

    const wallet = await prisma.wallet.findFirst({ where: { sectorId: sector.id } });
    if (wallet) walletBalance = Number(wallet.balance);

    // Department stats
    deptStats = await Promise.all(
      DEPARTMENTS.map(async (dept) => {
        const employees = await prisma.employee.findMany({
          where: { sectorId: sector.id, departmentEn: dept, isActive: true },
          include: { user: { select: { name: true } } },
        });
        const head = employees.find((e) =>
          e.jobTitleEn?.toLowerCase().includes("director")
        );
        return { dept, count: employees.length, headName: head?.user.name ?? null };
      })
    );

    recentIsrs = await prisma.serviceRequest.findMany({
      where: { toSectorId: sector.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const fromSectorIds = [...new Set(recentIsrs.map((r) => r.fromSectorId).filter(Boolean) as string[])];
    if (fromSectorIds.length > 0) {
      const fromSectors = await prisma.sector.findMany({
        where: { id: { in: fromSectorIds } },
        select: { id: true, nameEn: true, nameAr: true },
      });
      fromSectorMap = Object.fromEntries(fromSectors.map((s) => [s.id, { nameEn: s.nameEn, nameAr: s.nameAr ?? null }]));
    }
  }

  const kpis = [
    { label: t("home_kpi_employees"), value: totalEmployees, Icon: Users, color: "#C9A227" },
    { label: t("home_kpi_pending_isr"), value: pendingIsrs, Icon: Inbox, color: "#60A5FA" },
    { label: t("home_kpi_open_tickets"), value: openTickets, Icon: Ticket, color: "#F87171" },
    { label: t("home_kpi_wallet"), value: `${walletBalance.toLocaleString()} ¤`, Icon: Coins, color: "#4ADE80" },
  ];

  const deptNameMap: Record<string, string> = {
    "Secretariat": isRtl ? t("dept_secretariat_ar") : t("dept_secretariat"),
    "Public Relations": isRtl ? t("dept_pr_ar") : t("dept_pr"),
    "Sales": isRtl ? t("dept_sales_ar") : t("dept_sales"),
  };

  return (
    <main className="p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">{t("title")}</h1>
        <p className="text-[#64748B] text-sm mt-1">{t("subtitle")}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 rounded-xl border border-[#1E293B] bg-[#0A0F1A]"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">{label}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Department summary */}
      <div>
        <h2 className="text-sm font-semibold text-[#94A3B8] mb-3">{t("home_dept_summary")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deptStats.map(({ dept, count, headName }) => (
            <div
              key={dept}
              className="flex items-center gap-4 p-4 rounded-xl border border-[#1E293B] bg-[#0A0F1A] hover:border-[#C9A227]/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#C9A227]/15 border border-[#C9A227]/30 flex items-center justify-center">
                <Building size={18} className="text-[#C9A227]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{deptNameMap[dept] ?? dept}</p>
                <p className="text-[#64748B] text-xs">
                  {count} {t("dept_employees")}
                </p>
                {headName && (
                  <p className="text-[#94A3B8] text-xs truncate">
                    {t("home_dept_head")}: {headName}
                  </p>
                )}
              </div>
              <Link
                href={`/${locale}/general-admin/departments`}
                className="text-[#C9A227] text-xs hover:underline shrink-0"
              >
                →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Recent ISR activity */}
      {recentIsrs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#94A3B8]">{t("home_recent_isr")}</h2>
            <Link href={`/${locale}/general-admin/isr`} className="text-[#C9A227] text-xs hover:underline">
              {isRtl ? "عرض الكل" : "View all"} →
            </Link>
          </div>
          <div className="rounded-xl border border-[#1E293B] overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {recentIsrs.map((isr, i) => (
                  <tr
                    key={isr.id}
                    className={`border-b border-[#1E293B] last:border-0 ${i % 2 === 0 ? "bg-[#0A0F1A]" : "bg-[#080D18]"}`}
                  >
                    <td className="px-4 py-3 text-white truncate max-w-[200px]">{isr.titleEn}</td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">
                      {isr.fromSectorId && fromSectorMap[isr.fromSectorId]
                        ? (isRtl && fromSectorMap[isr.fromSectorId].nameAr
                            ? fromSectorMap[isr.fromSectorId].nameAr
                            : fromSectorMap[isr.fromSectorId].nameEn)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          isr.status === "pending"
                            ? "bg-yellow-500/15 text-yellow-400"
                            : isr.status === "in_progress"
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-green-500/15 text-green-400"
                        }`}
                      >
                        {isr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">
                      {format(new Date(isr.createdAt), "d MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!sector && (
        <div className="rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/10 p-6 text-center">
          <p className="text-[#C9A227] font-medium mb-2">
            {isRtl ? "قطاع الإدارة العامة غير موجود بعد." : "The General Administration sector has not been created yet."}
          </p>
          <p className="text-[#94A3B8] text-sm mb-4">
            {isRtl
              ? "قم بإنشاء القطاع من لوحة القطاعات باستخدام الكود: general-admin"
              : "Create the sector from the Sectors admin panel using code: general-admin"}
          </p>
          <Link
            href={`/${locale}/admin/sectors`}
            className="inline-block px-4 py-2 rounded-lg bg-[#C9A227] text-black text-sm font-semibold hover:bg-[#E6B830] transition-colors"
          >
            {isRtl ? "إدارة القطاعات" : "Manage Sectors"}
          </Link>
        </div>
      )}
    </main>
  );
}
