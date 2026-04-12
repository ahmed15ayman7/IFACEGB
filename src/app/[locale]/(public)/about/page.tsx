import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { Target, Shield, BarChart3, BookOpen } from "lucide-react";
import { PublicShell, PublicPageHeader, PublicFadeIn, PublicGlowCard } from "@/components/public/motion";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("about", locale as "en" | "ar");
}

export default async function AboutPage() {
  const t = await getTranslations("public.about");

  const pillars = [
    { title: t("pillar_1_title"), text: t("pillar_1_text"), icon: Target },
    { title: t("pillar_2_title"), text: t("pillar_2_text"), icon: Shield },
    { title: t("pillar_3_title"), text: t("pillar_3_text"), icon: BarChart3 },
  ] as const;

  return (
    <PublicShell className="py-16 sm:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <PublicPageHeader title={t("title")} subtitle={t("lead")}>
          <BookOpen className="size-7 sm:size-8" strokeWidth={1.25} aria-hidden />
        </PublicPageHeader>

        <PublicFadeIn delay={0.06} className="space-y-6 text-sm leading-relaxed text-[#A8B5C8] sm:text-[15px]">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
        </PublicFadeIn>

        <PublicFadeIn delay={0.12} className="mt-16">
          <h2
            className="mb-8 text-center text-xl font-semibold text-[#C9A227] sm:text-2xl"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("pillars_title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {pillars.map(({ title, text, icon: Icon }, i) => (
              <PublicGlowCard key={title} delay={i * 0.07} className="p-5 text-start">
                <Icon className="mb-3 size-8 text-[#C9A227] opacity-95" strokeWidth={1.35} aria-hidden />
                <h3 className="mb-2 text-sm font-semibold text-[#e8c84a]">{title}</h3>
                <p className="text-xs leading-relaxed text-[#6e7d93]">{text}</p>
              </PublicGlowCard>
            ))}
          </div>
        </PublicFadeIn>
      </div>
    </PublicShell>
  );
}
