import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ClientPortalPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.clientPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "client") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const userId = session.user.id;

  const [enrollmentCount, certCount, openTickets, wallet] = await Promise.all([
    prisma.enrollment.count({ where: { userId } }),
    prisma.certificate.count({ where: { holderId: userId } }),
    prisma.supportTicket.count({ where: { requesterId: userId, status: "open" } }),
    prisma.wallet.findFirst({ where: { ownerId: userId } }),
  ]);

  const recentEnrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { course: { select: { titleEn: true, level: true } } },
    orderBy: { enrolledAt: "desc" },
    take: 5,
  });

  const kpis = [
    { label: t("kpi_courses"), value: enrollmentCount },
    { label: t("kpi_certificates"), value: certCount },
    { label: t("kpi_tickets"), value: openTickets },
    { label: t("kpi_wallet"), value: wallet ? Number(wallet.balanceCoins).toLocaleString() : "0" },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[rgba(201,162,39,0.06)] border border-[rgba(201,162,39,0.15)] rounded-xl p-4"
          >
            <p className="text-[#6e7d93] text-xs mb-1">{kpi.label}</p>
            <p className="text-[#C9A227] text-xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Courses */}
      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#A8B5C8] font-semibold">{t("courses_title")}</h2>
          <Link href={`/${locale}/client/courses`} className="text-[#C9A227] text-sm hover:underline">
            View all →
          </Link>
        </div>
        {recentEnrollments.length === 0 ? (
          <EmptyState compact description={t("courses_empty")} />
        ) : (
          <div className="space-y-3">
            {recentEnrollments.map((enr) => (
              <div
                key={enr.id}
                className="flex items-center justify-between p-3 bg-[rgba(6,15,30,0.4)] rounded-lg"
              >
                <div>
                  <p className="text-white text-sm font-medium">{enr.course.titleEn}</p>
                  <p className="text-[#6e7d93] text-xs capitalize">{enr.course.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#C9A227] text-sm font-bold">{enr.progress}%</p>
                  {enr.isCompleted && (
                    <span className="text-green-400 text-xs">Completed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: `/${locale}/client/courses`, label: t("courses_title") },
          { href: `/${locale}/client/certificates`, label: t("certificates_title") },
          { href: `/${locale}/client/tickets`, label: t("tickets_title") },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-4 text-center hover:border-[rgba(201,162,39,0.3)] transition-colors"
          >
            <span className="text-[#A8B5C8] text-sm">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
