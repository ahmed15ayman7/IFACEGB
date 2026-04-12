import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { ApplyAgencyForm } from "@/components/public/ApplyAgencyForm";
import { getTranslations } from "next-intl/server";
import { Network } from "lucide-react";
import { PublicShell, PublicPageHeader, PublicFadeIn } from "@/components/public/motion";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("apply-agency", locale as "en" | "ar");
}

export default async function ApplyAgencyPage() {
  const t = await getTranslations("public.applyAgency");

  return (
    <PublicShell className="py-16 sm:py-24">
      <div className="container mx-auto max-w-xl px-4">
        <PublicPageHeader title={t("title")} subtitle={t("subtitle")}>
          <Network className="size-7 sm:size-8" strokeWidth={1.25} aria-hidden />
        </PublicPageHeader>
        <PublicFadeIn delay={0.1}>
          <ApplyAgencyForm />
        </PublicFadeIn>
      </div>
    </PublicShell>
  );
}
