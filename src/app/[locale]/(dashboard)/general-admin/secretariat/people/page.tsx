import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { resolveGeneralAdminAccess } from "@/lib/auth/general-admin-allowed";
import { format } from "date-fns";

export default async function SecretariatPeoplePage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.generalAdminSecretariat");
  if (!session?.user) redirect(`/${locale}/auth/login`);
  const ga = await resolveGeneralAdminAccess(session.user);
  if (!ga.allowed) {
    redirect(`/${locale}/dashboard`);
  }

  const sector = await prisma.sector.findFirst({ where: { code: "general-admin" } });
  const employees = sector
    ? await prisma.employee.findMany({
        where: { sectorId: sector.id, isActive: true },
        include: {
          user: { select: { name: true, email: true } },
          electronicContracts: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              templateType: true,
              status: true,
              signedAt: true,
              createdAt: true,
            },
          },
        },
        orderBy: { hireDate: "desc" },
      })
    : [];

  return (
    <main className="p-6 space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-xl font-bold text-white">{t("title")}</h1>
        <p className="text-sm text-[#64748B] mt-1">{t("subtitle")}</p>
      </div>

      <div className="rounded-xl border border-[#1E293B] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0A0F1A] text-[#94A3B8] text-xs">
              <th className="px-4 py-3 text-left">{t("col_name")}</th>
              <th className="px-4 py-3 text-left">{t("col_dept")}</th>
              <th className="px-4 py-3 text-left">{t("col_job")}</th>
              <th className="px-4 py-3 text-left">{t("col_hire")}</th>
              <th className="px-4 py-3 text-left">{t("col_contracts")}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-[#1E293B]">
                <td className="px-4 py-3 text-[#A8B5C8]">{e.user.name ?? e.user.email}</td>
                <td className="px-4 py-3 text-xs text-[#64748B]">{e.departmentEn ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[#64748B]">{e.jobTitleEn ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[#64748B]">
                  {format(e.hireDate, "PP")}
                </td>
                <td className="px-4 py-3 text-xs">
                  {e.electronicContracts.length === 0 ? (
                    <span className="text-[#64748B]">—</span>
                  ) : (
                    <ul className="space-y-1">
                      {e.electronicContracts.map((c) => (
                        <li key={c.id}>
                          {c.templateType} · {c.status}
                          {c.signedAt ? ` · ${format(c.signedAt, "PP")}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
