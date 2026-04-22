import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { canAccessGeneralAdminDashboard } from "@/lib/auth/general-admin-allowed";
import { format } from "date-fns";

export default async function GaNetworkTrainersPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.generalAdminNetwork");
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

  const trainers = await prisma.user.findMany({
    where: { role: "trainer" },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { id: true, name: true, email: true, lastLoginAt: true, createdAt: true },
  });

  return (
    <main className="p-6 space-y-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="text-xl font-bold text-white">{t("trainers_title")}</h1>
      <div className="rounded-xl border border-[#1E293B] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0A0F1A] text-[#94A3B8] text-xs">
              <th className="px-4 py-3 text-left">{t("col_name")}</th>
              <th className="px-4 py-3 text-left">{t("col_email")}</th>
              <th className="px-4 py-3 text-left">{t("col_last_login")}</th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((u) => (
              <tr key={u.id} className="border-t border-[#1E293B]">
                <td className="px-4 py-3 text-[#A8B5C8]">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[#64748B]">{u.email}</td>
                <td className="px-4 py-3 text-xs text-[#64748B]">
                  {u.lastLoginAt ? format(u.lastLoginAt, "PP") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
