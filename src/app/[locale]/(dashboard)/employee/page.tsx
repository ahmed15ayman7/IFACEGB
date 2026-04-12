import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EmployeePortalContent } from "@/components/dashboard/EmployeePortalContent";

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
  const t = await getTranslations("dashboard.employee");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["employee", "trainer"].includes(session.user.role)) {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const data = await getEmployeePortalData(session.user.id);
  if (!data.employee) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#6e7d93]">{t("profile_missing")}</p>
      </div>
    );
  }

  const { employee, wallet, bonuses, attendance, hrRequests } = data;

  return (
    <EmployeePortalContent
      employee={{
        user: employee.user,
        jobTitleEn: employee.jobTitleEn,
        jobTitleAr: employee.jobTitleAr,
        employeeCode: employee.employeeCode,
        kineticPoints: employee.kineticPoints,
        profitSharePct: employee.profitSharePct,
        sector: employee.sector,
      }}
      walletBalance={Number(wallet?.balanceCoins ?? 0)}
      bonusesCount={bonuses.length}
      attendance={attendance}
      hrRequests={hrRequests}
    />
  );
}
