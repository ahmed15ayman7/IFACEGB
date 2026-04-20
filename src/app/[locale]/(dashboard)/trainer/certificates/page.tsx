import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function TrainerCertificatesPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.trainerPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "trainer") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const certificates = await prisma.certificate.findMany({
    where: { issuerId: session.user.id },
    include: { holder: { select: { name: true, nameAr: true } } },
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
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(201,162,39,0.1)]">
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_holder")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_program")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_grade")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_issued")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_status")}</th>
                <th className="text-left px-4 py-3 text-[#6e7d93] font-medium">{t("col_verify")}</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert, i) => (
                <tr
                  key={cert.id}
                  className={`border-b border-[rgba(201,162,39,0.06)] ${i % 2 === 0 ? "" : "bg-[rgba(6,15,30,0.3)]"}`}
                >
                  <td className="px-4 py-3 text-white">{cert.holder.name}</td>
                  <td className="px-4 py-3 text-[#A8B5C8]">{cert.programEn}</td>
                  <td className="px-4 py-3 text-[#A8B5C8]">{cert.grade ?? "—"}</td>
                  <td className="px-4 py-3 text-[#A8B5C8]">
                    {new Date(cert.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/verify/${cert.certificateNo}`}
                      className="text-[#C9A227] hover:underline text-xs"
                      target="_blank"
                    >
                      {t("verify_link")}
                    </Link>
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
