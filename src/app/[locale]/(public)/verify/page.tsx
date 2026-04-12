import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { VerifyUvcForm } from "@/components/public/VerifyUvcForm";
import { ShieldCheck } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("verify", locale as "en" | "ar");
}

export default async function VerifyLandingPage() {
  const t = await getTranslations("public.verify");

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center size-14 rounded-full bg-[rgba(201,162,39,0.12)] border border-[rgba(201,162,39,0.25)] text-[#C9A227] mb-6">
        <ShieldCheck className="size-7" aria-hidden />
      </div>
      <h1
        className="text-3xl font-bold text-[#C9A227] mb-3"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        {t("title")}
      </h1>
      <p className="text-[#6e7d93] text-sm mb-10 max-w-lg mx-auto leading-relaxed">{t("subtitle")}</p>
      <VerifyUvcForm />
    </div>
  );
}
