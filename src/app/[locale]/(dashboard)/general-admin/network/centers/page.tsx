import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { resolveGeneralAdminAccess } from "@/lib/auth/general-admin-allowed";

export default async function GaNetworkCentersPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.generalAdminNetwork");
  if (!session?.user) redirect(`/${locale}/auth/login`);
  const ga = await resolveGeneralAdminAccess(session.user);
  if (!ga.allowed) {
    redirect(`/${locale}/dashboard`);
  }

  const centers = await prisma.accreditedCenter.findMany({
    take: 500,
    orderBy: { createdAt: "desc" },
    include: {
      franchise: { select: { nameEn: true, countryCode: true } },
    },
  });

  return (
    <main className="p-6 space-y-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1 className="text-xl font-bold text-white">{t("centers_title")}</h1>
      <div className="rounded-xl border border-[#1E293B] overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-[#0A0F1A] text-[#94A3B8] text-xs">
              <th className="px-4 py-3 text-left">{t("col_center")}</th>
              <th className="px-4 py-3 text-left">{t("col_city")}</th>
              <th className="px-4 py-3 text-left">{t("col_country")}</th>
              <th className="px-4 py-3 text-left">{t("col_franchise")}</th>
            </tr>
          </thead>
          <tbody>
            {centers.map((c) => (
              <tr key={c.id} className="border-t border-[#1E293B]">
                <td className="px-4 py-3 text-[#A8B5C8]">
                  {locale === "ar" && c.nameAr ? c.nameAr : c.nameEn}
                </td>
                <td className="px-4 py-3 text-xs text-[#64748B]">{c.city ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[#64748B]">{c.countryCode}</td>
                <td className="px-4 py-3 text-xs text-[#64748B]">
                  {c.franchise?.nameEn ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
