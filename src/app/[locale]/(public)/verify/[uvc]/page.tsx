import { verifyCertificateByUVC } from "@/lib/blockchain/certificate.service";
import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { PublicShell, PublicPageHeader, PublicEnter, PublicFadeIn } from "@/components/public/motion";

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
    <PublicShell ambient="dense" className="min-h-[72vh] py-16 sm:py-20">
      <div className="container mx-auto max-w-lg px-4">
        <PublicPageHeader title={t("page_title")} subtitle={t("subtitle")}>
          <Image src="/logo-dark.png" alt="iFACE" width={44} height={44} className="object-contain" />
        </PublicPageHeader>

        <PublicEnter delay={0.08}>
          <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(10,31,61,0.65)] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <div className="mb-6 text-center">
              <p className="mb-1 text-xs text-[#6e7d93]">{t("uvc_label")}</p>
              <code className="rounded-lg bg-[rgba(201,162,39,0.1)] px-3 py-1.5 font-mono text-sm text-[#C9A227]">
                {uvc}
              </code>
            </div>

            {result.valid ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] py-4 ps-4 pe-3">
                  <CheckCircle2 className="size-9 shrink-0 text-[#22c55e]" aria-hidden />
                  <div className="min-w-0 text-start">
                    <p className="font-semibold text-[#22c55e]">{t("valid_title")}</p>
                    <p className="text-xs text-[#6e7d93]">{t("valid_subtitle")}</p>
                  </div>
                </div>

                {result.cert && (
                  <div className="space-y-3 pt-2">
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
                        className="flex items-center justify-between gap-3 border-b border-[rgba(201,162,39,0.08)] pb-2 text-sm last:border-0"
                      >
                        <span className="shrink-0 text-[#6e7d93]">{row.label}</span>
                        <span className="break-all text-end font-medium text-[#A8B5C8]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <XCircle className="size-14 text-[#9C2A2A]" aria-hidden />
                <p className="text-center font-semibold text-[#9C2A2A]">{t("invalid_title")}</p>
                <p className="text-center text-sm text-[#6e7d93]">{result.reason}</p>
              </div>
            )}
          </div>
        </PublicEnter>

        <PublicFadeIn delay={0.18} className="mt-8 text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 text-xs text-[#C9A227] transition-colors hover:text-[#e8c84a]"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            {t("back_home")}
          </Link>
        </PublicFadeIn>
      </div>
    </PublicShell>
  );
}
