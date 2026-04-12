import { verifyCertificateByUVC } from "@/lib/blockchain/certificate.service";
import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

type Props = { params: Promise<{ uvc: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uvc } = await params;
  return {
    title: `Verify Certificate ${uvc} | iFACE Global`,
    description: "Instantly verify the authenticity of an iFACE-issued certificate on the Polygon blockchain.",
    robots: { index: false },
  };
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { uvc } = await params;
  const locale = await getLocale();
  const t = await getTranslations("public.verifyResult");

  const result = await verifyCertificateByUVC(uvc);
  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(201,162,39,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <Image src="/logo-dark.png" alt="iFACE" width={60} height={60} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {t("page_title")}
          </h1>
          <p className="text-[#6e7d93] text-sm mt-1">{t("subtitle")}</p>
        </div>

        <div className="rounded-2xl border border-[rgba(201,162,39,0.18)] bg-[rgba(10,31,61,0.6)] backdrop-blur-md p-8">
          <div className="mb-6 text-center">
            <p className="text-[#6e7d93] text-xs mb-1">{t("uvc_label")}</p>
            <code className="text-[#C9A227] text-sm font-mono bg-[rgba(201,162,39,0.08)] px-3 py-1.5 rounded-lg">
              {uvc}
            </code>
          </div>

          {result.valid ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 py-4 rounded-xl bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)]">
                <CheckCircle2 className="size-9 text-[#22c55e] shrink-0" aria-hidden />
                <div className="text-start">
                  <p className="text-[#22c55e] font-semibold">{t("valid_title")}</p>
                  <p className="text-[#6e7d93] text-xs">{t("valid_subtitle")}</p>
                </div>
              </div>

              {result.cert && (
                <div className="space-y-3">
                  {[
                    { label: t("holder"), value: result.cert.holder.name ?? "—" },
                    { label: t("program"), value: result.cert.programEn },
                    { label: t("grade"), value: result.cert.grade ?? "—" },
                    {
                      label: t("issue_date"),
                      value: new Date(result.cert.issueDate).toLocaleDateString(dateLocale),
                    },
                    { label: t("cert_no"), value: result.cert.certificateNo },
                    {
                      label: t("tx"),
                      value: result.cert.blockchainTxHash
                        ? result.cert.blockchainTxHash.slice(0, 20) + "…"
                        : t("tx_na"),
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center text-sm border-b border-[rgba(201,162,39,0.08)] pb-2 last:border-0 gap-3"
                    >
                      <span className="text-[#6e7d93] shrink-0">{row.label}</span>
                      <span className="text-[#A8B5C8] font-medium text-end break-all">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6">
              <XCircle className="size-14 text-[#9C2A2A]" aria-hidden />
              <p className="text-[#9C2A2A] font-semibold text-center">{t("invalid_title")}</p>
              <p className="text-[#6e7d93] text-sm text-center">{result.reason}</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 text-[#C9A227] hover:text-[#e8c84a] text-xs transition-colors"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            {t("back_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
