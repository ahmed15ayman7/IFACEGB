import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { ContactForm } from "@/components/public/ContactForm";
import { Mail } from "lucide-react";
import { PublicShell, PublicPageHeader, PublicFadeIn } from "@/components/public/motion";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("contact", locale as "en" | "ar");
}

export default async function ContactPage() {
  const t = await getTranslations("public.contact");

  return (
    <PublicShell className="py-16 sm:py-24">
      <div className="container mx-auto max-w-2xl px-4">
        <PublicPageHeader title={t("title")} subtitle={t("subtitle")}>
          <Mail className="size-7 sm:size-8" strokeWidth={1.25} aria-hidden />
        </PublicPageHeader>
        <PublicFadeIn delay={0.1}>
          <ContactForm />
        </PublicFadeIn>
      </div>
    </PublicShell>
  );
}
