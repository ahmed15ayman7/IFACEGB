import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { EditEmployeeForm } from "@/components/dashboard/EditEmployeeForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.hrEmployees" });
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  return { title: `${t("edit_title")} — ${employee?.user.name ?? id}` };
}

export default async function AdminEmployeeEditPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.hrEmployees" });

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin"].includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const [employee, sectors] = await Promise.all([
    prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            email: true,
            role: true,
            sectorId: true,
            isActive: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.sector.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, nameEn: true, nameAr: true },
    }),
  ]);

  if (!employee) notFound();

  const isRtl = locale === "ar";

  // Serialize Decimal fields for client component
  const serialized = {
    ...employee,
    salaryBase: Number(employee.salaryBase),
    profitSharePct: Number(employee.profitSharePct),
    hireDate: employee.hireDate.toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#060f1e] px-4 sm:px-6 lg:px-10 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-white/40 flex-wrap">
        <Link
          href={`/${locale}/admin/employees`}
          className="hover:text-[#C9A227] transition-colors"
        >
          {t("title")}
        </Link>
        <span>/</span>
        <Link
          href={`/${locale}/admin/employees/${id}`}
          className="hover:text-[#C9A227] transition-colors flex items-center gap-1"
        >
          {isRtl ? <ArrowRight className="size-3" /> : <ArrowLeft className="size-3" />}
          {employee.user.name ?? id}
        </Link>
        <span>/</span>
        <span className="text-white">{t("edit_title")}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t("edit_title")}</h1>
        <p className="text-sm text-white/40 mt-1">{t("edit_subtitle")}</p>
        <p className="text-xs text-white/25 mt-0.5 font-mono">{employee.user.email}</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <EditEmployeeForm employee={serialized} sectors={sectors} />
      </div>
    </div>
  );
}
