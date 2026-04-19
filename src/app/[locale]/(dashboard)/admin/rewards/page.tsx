import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminRewardsClient } from "@/components/dashboard/AdminRewardsClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.adminRewards" });
  return { title: t("title") };
}

export default async function AdminRewardsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["super_admin", "admin"].includes(session.user.role)) {
    redirect(getRoleHomePath(session.user.role));
  }

  const locale = await getLocale();
  const isAr = locale === "ar";

  // Fetch all data in parallel
  const [bonusesRaw, targetsRaw, employeesRaw] = await Promise.all([
    prisma.bonus.findMany({
      orderBy: { issuedAt: "desc" },
      take: 200,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { name: true, nameAr: true, avatarUrl: true } },
            sector: { select: { nameEn: true, nameAr: true } },
          },
        },
      },
    }),
    prisma.performanceTarget.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { name: true, nameAr: true, avatarUrl: true } },
            sector: { select: { nameEn: true, nameAr: true } },
          },
        },
      },
    }),
    prisma.employee.findMany({
      where: { user: { isActive: true } },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        employeeCode: true,
        kineticPoints: true,
        user: { select: { id: true, name: true, nameAr: true, avatarUrl: true } },
        sector: { select: { nameEn: true, nameAr: true } },
      },
    }),
  ]);

  const bonuses = bonusesRaw.map((b) => ({
    ...b,
    amountCoins: Number(b.amountCoins),
    issuedAt: b.issuedAt.toISOString(),
    paidAt: b.paidAt?.toISOString() ?? null,
  }));

  const targets = targetsRaw.map((t) => ({
    ...t,
    targetValue: Number(t.targetValue),
    achievedValue: Number(t.achievedValue),
    bonusPerUnit: Number(t.bonusPerUnit),
    createdAt: t.createdAt.toISOString(),
  }));

  const employees = employeesRaw.map((e) => ({
    id: e.id,
    userId: e.user.id,
    name: isAr ? (e.user.nameAr ?? e.user.name ?? "") : (e.user.name ?? ""),
    code: e.employeeCode,
    sector: isAr
      ? (e.sector?.nameAr ?? e.sector?.nameEn ?? "—")
      : (e.sector?.nameEn ?? "—"),
    kineticPoints: e.kineticPoints,
    avatarUrl: e.user.avatarUrl ?? null,
  }));

  return (
    <div className="min-h-screen bg-[#060f1e] px-4 py-8 md:px-8">
      <AdminRewardsClient
        initialBonuses={bonuses}
        initialTargets={targets}
        employees={employees}
      />
    </div>
  );
}
