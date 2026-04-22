import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { assertSectorDashboardAccess } from "@/lib/auth/sector-page-access";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export default async function SectorEmployeesPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.sectorPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);

  const sector = await prisma.sector.findFirst({
    where: { OR: [{ code: slug }, { id: slug }] },
    select: { id: true, code: true, nameEn: true, nameAr: true },
  });
  if (!sector) notFound();
  assertSectorDashboardAccess(session.user, { id: sector.id, code: sector.code }, locale);

  const employees = await prisma.employee.findMany({
    where: { sectorId: sector.id, isActive: true },
    orderBy: { kineticPoints: "desc" },
    include: {
      user: {
        select: {
          name: true,
          nameAr: true,
          email: true,
          role: true,
          lastLoginAt: true,
        },
      },
    },
    take: 100,
  });

  const isRtl = locale === "ar";
  const sectorName = isRtl ? (sector.nameAr ?? sector.nameEn) : sector.nameEn;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/sector/${slug}`}
          className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
        >
          {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
          {sectorName}
        </Link>
        <span className="text-[#6e7d93] opacity-40">·</span>
        <div className="flex items-center gap-2">
          <Users className="size-4 text-[#C9A227]" aria-hidden />
          <h1
            className="text-lg font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("employees_title")}
          </h1>
        </div>
        <span className="text-xs text-[#6e7d93] px-2 py-0.5 rounded-full border border-[rgba(201,162,39,0.2)] bg-[rgba(201,162,39,0.06)]">
          {employees.length}
        </span>
      </div>

      <p className="text-xs text-[#6e7d93]">{t("employees_subtitle")}</p>

      {employees.length === 0 ? (
        <p className="py-16 text-center text-sm text-[#6e7d93]">{t("employees_empty")}</p>
      ) : (
        <div className="rounded-xl border border-[rgba(201,162,39,0.12)] overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[rgba(10,31,61,0.8)] border-b border-[rgba(201,162,39,0.1)]">
                {[
                  t("employees_col_name"),
                  t("employees_col_role"),
                  t("employees_col_job"),
                  t("employees_col_kinetic"),
                  "Profit %",
                  t("employees_col_status"),
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6e7d93] uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,162,39,0.06)]">
              {employees.map((emp) => {
                const name = isRtl ? (emp.user.nameAr ?? emp.user.name ?? "—") : (emp.user.name ?? "—");
                const job = isRtl ? (emp.jobTitleAr ?? emp.jobTitleEn ?? "—") : (emp.jobTitleEn ?? "—");
                return (
                  <tr key={emp.id} className="hover:bg-[rgba(201,162,39,0.02)]">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#C9A227]">{name}</p>
                      <p className="text-[10px] text-[#6e7d93]">{emp.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#A8B5C8] capitalize">
                        {emp.user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6e7d93]">{job}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-bold text-[#C9A227]">
                        {emp.kineticPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A8B5C8]">
                      {Number(emp.profitSharePct)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: emp.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: emp.isActive ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
