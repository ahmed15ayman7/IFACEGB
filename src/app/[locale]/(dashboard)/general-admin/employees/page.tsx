"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const DEPARTMENTS = ["All", "Secretariat", "Public Relations", "Sales"] as const;

interface Employee {
  id: string;
  jobTitleEn: string | null;
  jobTitleAr: string | null;
  departmentEn: string | null;
  departmentAr: string | null;
  kineticPoints: number;
  isActive: boolean;
  user: { name: string | null; nameAr: string | null; avatarUrl: string | null };
}

export default function GeneralAdminEmployeesPage() {
  const t = useTranslations("dashboard.generalAdmin");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState<string>("All");

  useEffect(() => {
    fetch("/api/general-admin/employees")
      .then((r) => r.json())
      .then((data) => {
        setEmployees(data.employees ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    activeDept === "All"
      ? employees
      : employees.filter((e) => e.departmentEn === activeDept);

  const deptTabLabel = (dept: string) => {
    if (dept === "All") return t("emp_tab_all");
    const map: Record<string, string> = {
      Secretariat: isRtl ? t("dept_secretariat_ar") : t("dept_secretariat"),
      "Public Relations": isRtl ? t("dept_pr_ar") : t("dept_pr"),
      Sales: isRtl ? t("dept_sales_ar") : t("dept_sales"),
    };
    return map[dept] ?? dept;
  };

  return (
    <main className="p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-xl font-bold text-white">{t("emp_title")}</h1>
        <p className="text-[#64748B] text-sm mt-1">{t("emp_subtitle")}</p>
      </div>

      {/* Dept tabs */}
      <div className="flex gap-2 flex-wrap">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeDept === dept
                ? "bg-[#C9A227] text-black"
                : "border border-[#1E293B] text-[#64748B] hover:text-white hover:border-[#C9A227]/30"
            }`}
          >
            {deptTabLabel(dept)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#64748B]">
          {isRtl ? "جارٍ التحميل…" : "Loading…"}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("emp_empty")}
          description=""
        />
      ) : (
        <div className="rounded-xl border border-[#1E293B] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080D18]">
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{t("emp_col_name")}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{t("emp_col_title")}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{t("emp_col_dept")}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{t("emp_col_points")}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{t("emp_col_status")}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{t("emp_col_actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => {
                const name = isRtl && emp.user.nameAr ? emp.user.nameAr : emp.user.name ?? "—";
                const title = isRtl && emp.jobTitleAr ? emp.jobTitleAr : emp.jobTitleEn ?? "—";
                const dept =
                  isRtl && emp.departmentAr
                    ? emp.departmentAr
                    : emp.departmentEn ?? "—";

                return (
                  <tr
                    key={emp.id}
                    className={`border-b border-[#1E293B] last:border-0 ${i % 2 === 0 ? "bg-[#0A0F1A]" : "bg-[#080D18]"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1E293B] overflow-hidden flex-shrink-0">
                          {emp.user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={emp.user.avatarUrl} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#C9A227] text-xs font-bold">
                              {name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-white font-medium">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]">{title}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">{dept}</td>
                    <td className="px-4 py-3">
                      <span className="text-[#C9A227] font-semibold">{emp.kineticPoints}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.isActive
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {emp.isActive
                          ? isRtl ? "نشط" : "Active"
                          : isRtl ? "غير نشط" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/employees/${emp.id}`}
                          className="text-[#64748B] hover:text-[#C9A227] text-xs transition-colors"
                        >
                          {t("emp_view")}
                        </Link>
                        <Link
                          href={`/admin/employees/${emp.id}/edit`}
                          className="text-[#64748B] hover:text-[#60A5FA] text-xs transition-colors"
                        >
                          {t("emp_edit")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
