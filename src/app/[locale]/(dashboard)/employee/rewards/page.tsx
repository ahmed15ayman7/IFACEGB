import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { RewardsClient } from "@/components/dashboard/RewardsClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.rewards" });
  return { title: t("title") };
}

export default async function EmployeeRewardsPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.rewards" });

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["employee", "trainer"].includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      kineticPoints: true,
      profitSharePct: true,
      bonuses: {
        orderBy: { issuedAt: "desc" },
        take: 50,
        select: {
          id: true, type: true, amountCoins: true,
          reason: true, status: true, issuedAt: true,
        },
      },
      performanceTargets: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, period: true, targetValue: true,
          achievedValue: true, bonusPerUnit: true,
          isAchieved: true, createdAt: true,
        },
      },
    },
  });

  if (!employee) {
    return (
      <div className="p-6 text-center text-white/40 text-sm">
        {t("targets_empty")}
      </div>
    );
  }

  // Serialize Decimals for client
  const serialized = {
    kineticPoints: employee.kineticPoints,
    profitSharePct: Number(employee.profitSharePct),
    bonuses: employee.bonuses.map((b) => ({
      ...b,
      amountCoins: Number(b.amountCoins),
      issuedAt: b.issuedAt.toISOString(),
    })),
    targets: employee.performanceTargets.map((t) => ({
      ...t,
      targetValue: Number(t.targetValue),
      achievedValue: Number(t.achievedValue),
      bonusPerUnit: Number(t.bonusPerUnit),
      createdAt: t.createdAt.toISOString(),
    })),
  };

  return (
    <div className="min-h-screen bg-[#060f1e] px-4 sm:px-6 lg:px-10 py-8 max-w-7xl">
      <RewardsClient {...serialized} />
    </div>
  );
}
