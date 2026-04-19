import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { FileText } from "lucide-react";
import { PublicShell, PublicPageHeader, PublicFadeIn } from "@/components/public/motion";

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
    <PublicShell ambient="minimal" className="py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <PublicPageHeader
          align="start"
          eyebrow={`${t("updated")}: ${year}`}
          title={t("title")}
        >
          <FileText className="size-7 sm:size-8" strokeWidth={1.25} aria-hidden />
        </PublicPageHeader>

        <PublicFadeIn delay={0.06} className="mb-12 text-sm leading-relaxed text-[#A8B5C8]">
          {t("intro")}
        </PublicFadeIn>

        <div className="relative ms-1 border-s-2 border-[rgba(201,162,39,0.18)] ps-8 sm:ps-10">
          {sections.map((s, i) => (
            <PublicFadeIn key={s.title} delay={i * 0.06} className="relative pb-12 last:pb-0">
              <span
                className="absolute -start-[25px] top-2 size-2.5 rounded-full border-2 border-[#060f1e] bg-[#C9A227] sm:-start-[29px]"
                aria-hidden
              />
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-[#e8c84a]">{s.title}</h2>
              <p className="text-sm leading-relaxed text-[#6e7d93]">{s.body}</p>
            </PublicFadeIn>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
