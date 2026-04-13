import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Award, ExternalLink } from "lucide-react";

const ALLOWED = ["sector_manager", "admin", "super_admin"];
type Props = { params: Promise<{ slug: string }> };

const STATUS_COLORS: Record<string, string> = {
  issued: "#22c55e",
  revoked: "#ef4444",
  expired: "#f97316",
  pending: "#C9A227",
};

export default async function SectorCertificatesPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.sectorPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!ALLOWED.includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const sector = await prisma.sector.findFirst({
    where: { OR: [{ code: slug }, { id: slug }] },
    select: { id: true, nameEn: true, nameAr: true },
  });
  if (!sector) notFound();

  const certificates = await prisma.certificate.findMany({
    where: { sectorId: sector.id },
    orderBy: { issueDate: "desc" },
    take: 100,
    include: {
      holder: { select: { name: true, nameAr: true, email: true } },
    },
  });

  const isRtl = locale === "ar";
  const sectorName = isRtl ? (sector.nameAr ?? sector.nameEn) : sector.nameEn;

  const statusCounts = certificates.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/sector/${slug}`}
          className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
        >
          {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
          {sectorName}
        </Link>
        <span className="text-[#6e7d93] opacity-40">·</span>
        <div className="flex items-center gap-2">
          <Award className="size-4 text-[#C9A227]" aria-hidden />
          <h1
            className="text-lg font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("certs_title")}
          </h1>
        </div>
        <span className="text-xs text-[#6e7d93] px-2 py-0.5 rounded-full border border-[rgba(201,162,39,0.2)] bg-[rgba(201,162,39,0.06)]">
          {certificates.length}
        </span>
      </div>

      <p className="text-xs text-[#6e7d93]">{t("certs_subtitle")}</p>

      {/* Status summary */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium"
              style={{
                color: STATUS_COLORS[status] ?? "#A8B5C8",
                borderColor: `${STATUS_COLORS[status] ?? "#A8B5C8"}30`,
                background: `${STATUS_COLORS[status] ?? "#A8B5C8"}08`,
              }}
            >
              <span className="size-1.5 rounded-full" style={{ background: STATUS_COLORS[status] ?? "#A8B5C8" }} aria-hidden />
              {status}: {count}
            </div>
          ))}
        </div>
      )}

      {certificates.length === 0 ? (
        <p className="py-16 text-center text-sm text-[#6e7d93]">{t("certs_empty")}</p>
      ) : (
        <div className="rounded-xl border border-[rgba(201,162,39,0.12)] overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[rgba(10,31,61,0.8)] border-b border-[rgba(201,162,39,0.1)]">
                {[
                  t("certs_col_holder"),
                  t("certs_col_program"),
                  t("certs_col_grade"),
                  t("certs_col_date"),
                  t("certs_col_status"),
                  "Cert No.",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6e7d93] uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,162,39,0.06)]">
              {certificates.map((cert) => {
                const holderName = isRtl ? (cert.holder.nameAr ?? cert.holder.name ?? "—") : (cert.holder.name ?? "—");
                const program = isRtl ? (cert.programAr ?? cert.programEn) : cert.programEn;
                const color = STATUS_COLORS[cert.status] ?? "#A8B5C8";
                return (
                  <tr key={cert.id} className="hover:bg-[rgba(201,162,39,0.02)]">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-[#C9A227]">{holderName}</p>
                      <p className="text-[10px] text-[#6e7d93]">{cert.holder.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A8B5C8] max-w-[180px] truncate">
                      {program}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[#C9A227]">
                      {cert.grade ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6e7d93]">
                      {cert.issueDate
                        ? new Date(cert.issueDate).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: `${color}12`,
                          color,
                          borderColor: `${color}30`,
                        }}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-[#6e7d93]">{cert.certificateNo ?? "—"}</span>
                        {cert.uniqueVC && (
                          <Link
                            href={`/${locale}/verify?uvc=${cert.uniqueVC}`}
                            target="_blank"
                            className="text-[#C9A227] hover:text-[#e8c84a]"
                          >
                            <ExternalLink className="size-3" aria-hidden />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
