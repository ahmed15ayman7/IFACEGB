import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, UserPlus } from "lucide-react";
import { NewEmployeeForm } from "@/components/dashboard/NewEmployeeForm";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminEmployeesNewPage({ searchParams }: Props) {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.hrEmployees");
  const sp = await searchParams;
  const prefillSectorCode = typeof sp.sectorCode === "string" ? sp.sectorCode : undefined;
  const prefillDept = typeof sp.dept === "string" ? sp.dept : undefined;

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin"].includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const sectors = await prisma.sector.findMany({
    where: { isActive: true },
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true, nameAr: true, code: true },
  });

  const isRtl = locale === "ar";

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/admin/employees`}
          className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
        >
          {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
          {t("title")}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.1)] text-[#C9A227]">
          <UserPlus className="size-5" strokeWidth={1.4} aria-hidden />
        </div>
        <div>
          <h1
            className="text-xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("new_title")}
          </h1>
          <p className="text-xs text-[#6e7d93] mt-0.5">{t("new_subtitle")}</p>
        </div>
      </div>

      <NewEmployeeForm
        sectors={sectors}
        prefillSectorCode={prefillSectorCode}
        prefillGeneralAdminDept={prefillDept}
      />
    </div>
  );
}
