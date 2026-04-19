import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LeavesClient } from "@/components/dashboard/LeavesClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.leave" });
  return { title: t("title") };
}

export default async function EmployeeLeavesPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.leave" });

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["employee", "trainer"].includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  // Verify employee record exists
  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!employee) {
    return (
      <div className="p-6 text-center text-[#6e7d93]">
        {t("empty")}
      </div>
    );
  }

  const requests = await prisma.hrRequest.findMany({
    where: { requestedBy: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, type: true, status: true,
      startDate: true, endDate: true, details: true, createdAt: true,
    },
  });

  const serialized = requests.map((r) => ({
    ...r,
    startDate: r.startDate?.toISOString() ?? null,
    endDate: r.endDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#060f1e] px-4 sm:px-6 lg:px-10 py-8 max-w-7xl">
      <LeavesClient initial={serialized} />
    </div>
  );
}
