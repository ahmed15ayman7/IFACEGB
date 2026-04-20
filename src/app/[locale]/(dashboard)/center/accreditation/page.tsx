import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CenterAccreditationPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.centerPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "center") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const center = await prisma.accreditedCenter.findFirst({
    where: { ownerUserId: session.user.id },
    include: { franchise: true },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("accreditation_title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("accreditation_subtitle")}</p>
      </div>

      {!center ? (
        <EmptyState description={t("accreditation_empty")} />
      ) : (
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.15)] rounded-xl p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white text-lg font-semibold">{center.nameEn}</h2>
              {center.nameAr && <p className="text-[#6e7d93] text-sm">{center.nameAr}</p>}
            </div>
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium ${
                center.isActive
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {t(`acc_status`)}:{" "}
              {center.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[#6e7d93] text-xs">{t("acc_country")}</p>
              <p className="text-[#A8B5C8] mt-1">{center.countryCode}</p>
            </div>
            {center.city && (
              <div>
                <p className="text-[#6e7d93] text-xs">{t("acc_city")}</p>
                <p className="text-[#A8B5C8] mt-1">{center.city}</p>
              </div>
            )}
            {center.address && (
              <div>
                <p className="text-[#6e7d93] text-xs">Address</p>
                <p className="text-[#A8B5C8] mt-1">{center.address}</p>
              </div>
            )}
            {center.accreditedAt && (
              <div>
                <p className="text-[#6e7d93] text-xs">{t("acc_accredited_at")}</p>
                <p className="text-[#A8B5C8] mt-1">{new Date(center.accreditedAt).toLocaleDateString()}</p>
              </div>
            )}
            {center.expiresAt && (
              <div>
                <p className="text-[#6e7d93] text-xs">{t("acc_expires")}</p>
                <p
                  className={`mt-1 ${
                    new Date(center.expiresAt) < new Date() ? "text-red-400" : "text-[#A8B5C8]"
                  }`}
                >
                  {new Date(center.expiresAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {center.franchise && (
              <div>
                <p className="text-[#6e7d93] text-xs">{t("acc_franchise")}</p>
                <p className="text-[#A8B5C8] mt-1">{center.franchise.nameEn}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
