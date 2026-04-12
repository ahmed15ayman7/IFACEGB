import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { ContactForm } from "@/components/public/ContactForm";
import { Mail } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("contact", locale as "en" | "ar");
}

export default async function ContactPage() {
  const t = await getTranslations("public.contact");

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center size-12 rounded-full bg-[rgba(201,162,39,0.12)] border border-[rgba(201,162,39,0.25)] text-[#C9A227] mb-4">
          <Mail className="size-6" aria-hidden />
        </div>
        <h1
          className="text-3xl font-bold text-[#C9A227]"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          {t("title")}
        </h1>
        <p className="text-[#6e7d93] text-sm mt-2 max-w-md mx-auto">{t("subtitle")}</p>
      </div>
      <ContactForm />
    </div>
  );
}
