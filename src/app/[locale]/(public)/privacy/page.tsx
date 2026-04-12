import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { FileText } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("privacy", locale as "en" | "ar");
}

export default async function PrivacyPage() {
  const t = await getTranslations("public.privacy");
  const year = new Date().getFullYear();

  const sections = [
    { title: t("s1_title"), body: t("s1_text") },
    { title: t("s2_title"), body: t("s2_text") },
    { title: t("s3_title"), body: t("s3_text") },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="size-8 text-[#C9A227] shrink-0" aria-hidden />
        <div>
          <h1
            className="text-3xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("title")}
          </h1>
          <p className="text-[#6e7d93] text-xs mt-1">
            {t("updated")}: {year}
          </p>
        </div>
      </div>
      <p className="text-[#A8B5C8] text-sm leading-relaxed mb-10">{t("intro")}</p>
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-[#C9A227] font-semibold text-sm mb-2">{s.title}</h2>
            <p className="text-[#6e7d93] text-sm leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
