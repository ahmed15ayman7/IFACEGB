import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Building2, Globe, Map } from "lucide-react";

export default async function FranchisePage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.franchise");
  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin", "agent"].includes(session.user.role)) {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const [franchises, agentLicenses, applications] = await Promise.all([
    prisma.franchise.findMany({
      where: session.user.role === "agent" ? { ownerUserId: session.user.id } : {},
      include: { children: { select: { id: true } }, agentLicenses: { where: { status: "active" } } },
      take: 20,
    }),
    prisma.agentLicense.findMany({
      where: session.user.role === "agent" ? { agentUserId: session.user.id } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.agencyApplication.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: session.user.role === "super_admin" ? 10 : 0,
    }),
  ]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
        {t("title")}
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {franchises.length}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{t("kpi_franchises")}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#A8B5C8]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {agentLicenses.filter((l) => l.status === "active").length}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{t("kpi_licenses")}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#e8c84a]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {applications.length}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{t("kpi_pending_apps")}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {franchises.reduce((s, f) => s + f.children.length, 0)}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{t("kpi_sub")}</p>
        </div>
      </div>

      <div>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("hierarchy")}
        </h2>
        <div className="space-y-2">
          {franchises.map((franchise) => (
            <div
              key={franchise.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.4)] hover:bg-[rgba(6,15,30,0.6)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.15)] shrink-0">
                  {franchise.tier === "master" ? (
                    <Globe className="size-5" aria-hidden />
                  ) : franchise.tier === "regional" ? (
                    <Map className="size-5" aria-hidden />
                  ) : (
                    <Building2 className="size-5" aria-hidden />
                  )}
                </span>
                <div>
                  <p className="text-[#A8B5C8] font-medium text-sm">{franchise.nameEn}</p>
                  <p className="text-[#6e7d93] text-xs">
                    {t("tier_subline", {
                      tier: franchise.tier,
                      country: franchise.countryCode,
                      count: franchise.children.length,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: franchise.isActive ? "#22c55e" : "#9C2A2A" }}
                />
                <span className="text-xs text-[#6e7d93]">
                  {t("active_licenses", { count: franchise.agentLicenses.length })}
                </span>
              </div>
            </div>
          ))}
          {franchises.length === 0 && (
            <p className="text-[#6e7d93] text-sm text-center py-8">{t("empty")}</p>
          )}
        </div>
      </div>

      {session.user.role === "super_admin" && applications.length > 0 && (
        <div>
          <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {t("pending_apps_title")}
          </h2>
          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.4)]"
              >
                <div>
                  <p className="text-[#A8B5C8] text-sm font-medium">{app.applicantName}</p>
                  <p className="text-[#6e7d93] text-xs">
                    {app.email} · {app.countryCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="h-7 px-3 text-xs rounded-lg bg-[rgba(34,197,94,0.1)] text-[#22c55e] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.15)]"
                  >
                    {t("approve")}
                  </button>
                  <button
                    type="button"
                    className="h-7 px-3 text-xs rounded-lg bg-[rgba(156,42,42,0.1)] text-[#9C2A2A] border border-[rgba(156,42,42,0.2)] hover:bg-[rgba(156,42,42,0.15)]"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
