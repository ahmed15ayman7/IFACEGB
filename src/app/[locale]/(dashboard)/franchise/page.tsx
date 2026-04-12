import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import Link from "next/link";

export default async function FranchisePage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin", "agent"].includes(session.user.role)) {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const isAr = locale === "ar";

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
        {isAr ? "مركز الامتياز العالمي" : "Global Franchise Hub"}
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {franchises.length}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{isAr ? "الامتيازات" : "Franchises"}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#A8B5C8]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {agentLicenses.filter((l) => l.status === "active").length}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{isAr ? "التراخيص النشطة" : "Active Licenses"}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#e8c84a]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {applications.length}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{isAr ? "طلبات معلقة" : "Pending Applications"}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {franchises.reduce((s, f) => s + f.children.length, 0)}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{isAr ? "الفروع الفرعية" : "Sub-Franchises"}</p>
        </div>
      </div>

      {/* Franchise Hierarchy */}
      <div>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {isAr ? "هيكل الامتيازات" : "Franchise Hierarchy"}
        </h2>
        <div className="space-y-2">
          {franchises.map((franchise) => (
            <div
              key={franchise.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.4)] hover:bg-[rgba(6,15,30,0.6)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {franchise.tier === "master" ? "🌍" : franchise.tier === "regional" ? "🗺" : "🏢"}
                </span>
                <div>
                  <p className="text-[#A8B5C8] font-medium text-sm">{franchise.nameEn}</p>
                  <p className="text-[#6e7d93] text-xs">
                    {franchise.tier} · {franchise.countryCode} · {franchise.children.length} sub-franchises
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: franchise.isActive ? "#22c55e" : "#9C2A2A" }}
                />
                <span className="text-xs text-[#6e7d93]">
                  {franchise.agentLicenses.length} active license{franchise.agentLicenses.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
          {franchises.length === 0 && (
            <p className="text-[#6e7d93] text-sm text-center py-8">No franchises found.</p>
          )}
        </div>
      </div>

      {/* Pending Applications (admin only) */}
      {session.user.role === "super_admin" && applications.length > 0 && (
        <div>
          <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            Pending Agency Applications
          </h2>
          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.4)]"
              >
                <div>
                  <p className="text-[#A8B5C8] text-sm font-medium">{app.applicantName}</p>
                  <p className="text-[#6e7d93] text-xs">{app.email} · {app.countryCode}</p>
                </div>
                <div className="flex gap-2">
                  <button className="h-7 px-3 text-xs rounded-lg bg-[rgba(34,197,94,0.1)] text-[#22c55e] border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.15)]">
                    Approve
                  </button>
                  <button className="h-7 px-3 text-xs rounded-lg bg-[rgba(156,42,42,0.1)] text-[#9C2A2A] border border-[rgba(156,42,42,0.2)] hover:bg-[rgba(156,42,42,0.15)]">
                    Reject
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
