import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AgentLicensePage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.agentPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin", "agent"].includes(session.user.role)) {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const license = await prisma.agentLicense.findFirst({
    where: session.user.role === "agent" ? { agentUserId: session.user.id } : {},
    include: { actionsLog: { orderBy: { createdAt: "desc" }, take: 20 } },
    orderBy: { createdAt: "desc" },
  });

  const statusColor: Record<string, string> = {
    active: "bg-green-500/10 text-green-400",
    suspended: "bg-red-500/10 text-red-400",
    expired: "bg-gray-500/10 text-gray-400",
    revoked: "bg-red-700/10 text-red-500",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("license_title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("license_subtitle")}</p>
      </div>

      {!license ? (
        <EmptyState />
      ) : (
        <>
          {/* License Card */}
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.15)] rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[#6e7d93] text-xs">{t("license_no")}</p>
                <p className="text-[#C9A227] text-xl font-bold font-mono mt-1">{license.licenseNo}</p>
              </div>
              <span
                className={`text-sm px-3 py-1 rounded-full font-medium ${
                  statusColor[license.status] ?? "bg-gray-500/10 text-gray-400"
                }`}
              >
                {t(`license_${license.status}` as Parameters<typeof t>[0])}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[#6e7d93] text-xs">{t("license_country")}</p>
                <p className="text-[#A8B5C8] mt-1">{license.countryCode}</p>
              </div>
              <div>
                <p className="text-[#6e7d93] text-xs">{t("license_issued")}</p>
                <p className="text-[#A8B5C8] mt-1">{new Date(license.issuedAt).toLocaleDateString()}</p>
              </div>
              {license.expiresAt && (
                <div>
                  <p className="text-[#6e7d93] text-xs">{t("license_expires")}</p>
                  <p
                    className={`mt-1 ${
                      new Date(license.expiresAt) < new Date() ? "text-red-400" : "text-[#A8B5C8]"
                    }`}
                  >
                    {new Date(license.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            {license.suspendedReason && (
              <div className="mt-4 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{license.suspendedReason}</p>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-6">
            <h2 className="text-[#A8B5C8] font-semibold mb-4">{t("license_history")}</h2>
            {license.actionsLog.length === 0 ? (
              <EmptyState compact description={t("license_empty")} />
            ) : (
              <div className="space-y-2">
                {license.actionsLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-3 bg-[rgba(6,15,30,0.4)] rounded-lg"
                  >
                    <div>
                      <p className="text-white text-sm capitalize">{log.action.replace(/_/g, " ")}</p>
                      {log.reason && <p className="text-[#6e7d93] text-xs mt-0.5">{log.reason}</p>}
                    </div>
                    <p className="text-[#6e7d93] text-xs shrink-0 ml-4">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
