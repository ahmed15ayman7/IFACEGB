import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function UserCertificatesPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.userPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "user") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const certificates = await prisma.certificate.findMany({
    where: { holderId: session.user.id },
    include: { issuer: { select: { name: true } } },
    orderBy: { issueDate: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("certificates_title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("certificates_subtitle")}</p>
      </div>

      {certificates.length === 0 ? (
        <EmptyState description={t("certificates_empty")} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.15)] rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{cert.programEn}</p>
                  <p className="text-[#6e7d93] text-xs mt-0.5">by {cert.issuer.name}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    cert.status === "issued"
                      ? "bg-green-500/10 text-green-400"
                      : cert.status === "revoked"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {cert.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {cert.grade && (
                  <div>
                    <p className="text-[#6e7d93]">{t("col_grade")}</p>
                    <p className="text-[#C9A227] font-bold">{cert.grade}</p>
                  </div>
                )}
                <div>
                  <p className="text-[#6e7d93]">{t("col_issued")}</p>
                  <p className="text-[#A8B5C8]">{new Date(cert.issueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <Link
                href={`/${locale}/verify/${cert.certificateNo}`}
                target="_blank"
                className="block w-full text-center py-1.5 border border-[rgba(201,162,39,0.3)] rounded-lg text-[#C9A227] text-xs hover:bg-[rgba(201,162,39,0.08)] transition-colors"
              >
                {t("verify_link")}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
