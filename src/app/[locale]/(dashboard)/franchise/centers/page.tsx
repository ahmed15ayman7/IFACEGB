import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AgentCentersPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.agentPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin", "agent"].includes(session.user.role)) {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const franchise = session.user.role === "agent"
    ? await prisma.franchise.findFirst({ where: { ownerUserId: session.user.id } })
    : null;

  const centers = await prisma.accreditedCenter.findMany({
    where: franchise ? { franchiseId: franchise.id } : {},
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("centers_title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("centers_subtitle")}</p>
      </div>

      {centers.length === 0 ? (
        <EmptyState description={t("centers_empty")} />
      ) : (
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(201,162,39,0.1)]">
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_name")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_country")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_city")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_accredited")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_expires")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_status")}</th>
              </tr>
            </thead>
            <tbody>
              {centers.map((center, i) => (
                <tr
                  key={center.id}
                  className={`border-b border-[rgba(201,162,39,0.06)] ${i % 2 === 0 ? "" : "bg-[rgba(6,15,30,0.3)]"}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{center.nameEn}</p>
                    {center.nameAr && <p className="text-[#6e7d93] text-xs">{center.nameAr}</p>}
                  </td>
                  <td className="px-4 py-3 text-[#A8B5C8]">{center.countryCode}</td>
                  <td className="px-4 py-3 text-[#A8B5C8]">{center.city ?? "—"}</td>
                  <td className="px-4 py-3 text-[#A8B5C8]">
                    {center.accreditedAt ? new Date(center.accreditedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#A8B5C8]">
                    {center.expiresAt ? new Date(center.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        center.isActive
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {center.isActive ? t("active") : t("inactive")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
