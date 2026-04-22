import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronDown, Building, Plus, Users } from "lucide-react";
import Link from "next/link";
import { canAccessGeneralAdminDashboard } from "@/lib/auth/general-admin-allowed";

const DEPARTMENTS = ["Secretariat", "Public Relations", "Sales"] as const;

const JOB_LEVEL_ORDER = [
  "director",
  "senior specialist",
  "specialist",
  "assistant",
  "intern",
] as const;

function getJobLevel(title: string | null): number {
  const lower = (title ?? "").toLowerCase();
  if (lower.includes("director")) return 0;
  if (lower.includes("senior")) return 1;
  if (lower.includes("specialist")) return 2;
  if (lower.includes("assistant")) return 3;
  if (lower.includes("intern")) return 4;
  return 5;
}

export default async function GeneralAdminDepartmentsPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.generalAdmin");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (
    !(await canAccessGeneralAdminDashboard(
      session.user.role,
      session.user.sectorId ?? null,
      session.user.sectorCode ?? null
    ))
  ) {
    redirect(`/${locale}/dashboard`);
  }

  const isRtl = locale === "ar";

  const sector = await prisma.sector.findFirst({ where: { code: "general-admin" } });

  type DeptEmployee = {
    id: string;
    jobTitleEn: string | null;
    jobTitleAr: string | null;
    kineticPoints: number;
    isActive: boolean;
    user: { name: string | null; nameAr: string | null; avatarUrl: string | null };
  };

  let deptData: Array<{ dept: string; employees: DeptEmployee[] }> = [];

  if (sector) {
    deptData = await Promise.all(
      DEPARTMENTS.map(async (dept) => {
        const employees = await prisma.employee.findMany({
          where: { sectorId: sector.id, departmentEn: dept, isActive: true },
          include: { user: { select: { name: true, nameAr: true, avatarUrl: true } } },
          orderBy: { kineticPoints: "desc" },
        });
        const sorted = [...employees].sort(
          (a, b) => getJobLevel(a.jobTitleEn) - getJobLevel(b.jobTitleEn)
        );
        return { dept, employees: sorted };
      })
    );
  }

  const deptNameMap: Record<string, { ar: string; en: string }> = {
    Secretariat: { ar: t("dept_secretariat_ar"), en: t("dept_secretariat") },
    "Public Relations": { ar: t("dept_pr_ar"), en: t("dept_pr") },
    Sales: { ar: t("dept_sales_ar"), en: t("dept_sales") },
  };

  const levelLabelMap: Record<number, string> = {
    0: isRtl ? t("dept_director") : "Director",
    1: isRtl ? t("dept_senior_specialist") : "Senior Specialist",
    2: isRtl ? t("dept_specialist") : "Specialist",
    3: isRtl ? t("dept_assistant") : "Assistant",
    4: isRtl ? t("dept_intern") : "Intern",
  };

  return (
    <main className="p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-xl font-bold text-white">{t("dept_title")}</h1>
        <p className="text-[#64748B] text-sm mt-1">{t("dept_subtitle")}</p>
      </div>

      {!sector ? (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-400 text-sm">
          {isRtl ? "قطاع الإدارة العامة غير موجود." : "General Administration sector not found."}
        </div>
      ) : (
        <div className="space-y-6">
          {deptData.map(({ dept, employees }) => {
            const names = deptNameMap[dept] ?? { ar: dept, en: dept };
            const deptLabel = isRtl ? names.ar : names.en;

            return (
              <div key={dept} className="rounded-xl border border-[#1E293B] bg-[#0A0F1A] overflow-hidden">
                {/* Department header */}
                <div className="flex items-center justify-between p-4 border-b border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#C9A227]/15 border border-[#C9A227]/30 flex items-center justify-center">
                      <Building size={16} className="text-[#C9A227]" />
                    </div>
                    <div>
                      <h2 className="text-white font-semibold">{deptLabel}</h2>
                      <p className="text-[#64748B] text-xs">
                        <Users size={10} className="inline mr-1" />
                        {employees.length} {t("dept_employees")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/${locale}/admin/employees/new?sectorCode=general-admin&dept=${encodeURIComponent(dept)}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9A227]/15 border border-[#C9A227]/30 text-[#C9A227] text-xs font-medium hover:bg-[#C9A227]/25 transition-colors"
                  >
                    <Plus size={13} />
                    {t("dept_add_employee")}
                  </Link>
                </div>

                {/* Org chart tree */}
                {employees.length === 0 ? (
                  <div className="p-8 text-center text-[#475569] text-sm">{t("emp_empty")}</div>
                ) : (
                  <div className="p-4 space-y-2">
                    {employees.map((emp, i) => {
                      const level = getJobLevel(emp.jobTitleEn);
                      const levelLabel = levelLabelMap[level] ?? (isRtl ? emp.jobTitleAr : emp.jobTitleEn) ?? "";
                      const name =
                        isRtl && emp.user.nameAr ? emp.user.nameAr : emp.user.name ?? "";
                      const indentClass =
                        level === 0
                          ? ""
                          : level === 1
                          ? "ml-4"
                          : level === 2
                          ? "ml-8"
                          : level === 3
                          ? "ml-12"
                          : "ml-16";

                      return (
                        <div
                          key={emp.id}
                          className={`flex items-center gap-3 p-3 rounded-lg bg-[#080D18] border border-[#1E293B] ${indentClass}`}
                        >
                          {/* Level indicator */}
                          {level > 0 && (
                            <div
                              className="w-0.5 h-4 rounded-full self-center"
                              style={{ backgroundColor: `rgba(201,162,39,${0.6 - level * 0.1})` }}
                            />
                          )}

                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1E293B] flex-shrink-0">
                            {emp.user.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={emp.user.avatarUrl} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#C9A227] text-xs font-bold">
                                {name.charAt(0)}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{name}</p>
                            <p className="text-[#64748B] text-xs">{levelLabel}</p>
                          </div>

                          <div className="text-right">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `rgba(201,162,39,${0.08 + level * 0.01})`,
                                color: `rgba(201,162,39,${1 - level * 0.12})`,
                              }}
                            >
                              {emp.kineticPoints} pts
                            </span>
                          </div>

                          <Link
                            href={`/${locale}/admin/employees/${emp.id}`}
                            className="text-[#475569] hover:text-[#C9A227] text-xs transition-colors"
                          >
                            {t("emp_view")}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
