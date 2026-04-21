import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CenterPortalPage() {
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

  const [trainerCount, certCount, wallet] = await Promise.all([
    center?.franchiseId
      ? prisma.user.count({ where: { role: "trainer" } })
      : Promise.resolve(0),
    prisma.certificate.count({ where: { issuer: { role: "trainer" } } }),
    prisma.wallet.findFirst({ where: { ownerId: session.user.id } }),
  ]);

  const kpis = [
    { label: t("kpi_accreditation"), value: center?.isActive ? "Active" : "Inactive" },
    { label: t("kpi_trainers"), value: trainerCount },
    { label: t("kpi_certificates"), value: certCount },
    { label: t("kpi_wallet"), value: wallet ? Number(wallet.balanceCoins).toLocaleString() : "0" },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[rgba(201,162,39,0.06)] border border-[rgba(201,162,39,0.15)] rounded-xl p-4"
          >
            <p className="text-[#6e7d93] text-xs mb-1">{kpi.label}</p>
            <p className="text-[#C9A227] text-xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Center Info */}
      {!center ? (
        <EmptyState description={t("accreditation_empty")} />
      ) : (
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-6">
          <h2 className="text-[#A8B5C8] font-semibold mb-4">{t("accreditation_title")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[#6e7d93] text-xs">{t("acc_name")}</p>
              <p className="text-white mt-1">{center.nameEn}</p>
            </div>
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
            {center.accreditedAt && (
              <div>
                <p className="text-[#6e7d93] text-xs">{t("acc_accredited_at")}</p>
                <p className="text-[#A8B5C8] mt-1">{new Date(center.accreditedAt).toLocaleDateString()}</p>
              </div>
            )}
            {center.expiresAt && (
              <div>
                <p className="text-[#6e7d93] text-xs">{t("acc_expires")}</p>
                <p className="text-[#A8B5C8] mt-1">{new Date(center.expiresAt).toLocaleDateString()}</p>
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

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: `/${locale}/center/trainers`, label: t("trainers_title") },
          { href: `/${locale}/center/certificates`, label: t("certificates_title") },
          { href: `/${locale}/center/wallet`, label: t("wallet_title") },
          { href: `/${locale}/center/accreditation`, label: t("accreditation_title") },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-4 text-center hover:border-[rgba(201,162,39,0.3)] transition-colors"
          >
            <span className="text-[#A8B5C8] text-sm">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
