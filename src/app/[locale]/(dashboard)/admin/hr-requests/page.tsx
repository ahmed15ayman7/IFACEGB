import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LeaveApprovalClient } from "@/components/dashboard/LeaveApprovalClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.leave" });
  return { title: t("admin_title") };
}

export default async function AdminHrRequestsPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin"].includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  // Load pending by default
  const requests = await prisma.hrRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      requester: {
        select: { name: true, nameAr: true, email: true, avatarUrl: true },
      },
      employee: {
        select: {
          employeeCode: true,
          jobTitleEn: true,
          sector: { select: { nameEn: true, nameAr: true } },
        },
      },
    },
  });

  const serialized = requests.map((r) => ({
    ...r,
    startDate: r.startDate?.toISOString() ?? null,
    endDate: r.endDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#060f1e] px-4 sm:px-6 lg:px-10 py-8 max-w-4xl">
      <LeaveApprovalClient initial={serialized} />
    </div>
  );
}
