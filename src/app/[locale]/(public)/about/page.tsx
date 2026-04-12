import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { Target, Shield, BarChart3 } from "lucide-react";

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
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">
      <header className="text-center space-y-4">
        <h1
          className="text-4xl font-bold text-[#C9A227]"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          {t("title")}
        </h1>
        <p className="text-[#A8B5C8] text-lg leading-relaxed">{t("lead")}</p>
      </header>

      <div className="space-y-6 text-[#A8B5C8] text-sm leading-relaxed">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
      </div>

      <section>
        <h2
          className="text-xl font-semibold text-[#C9A227] mb-6 text-center"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          {t("pillars_title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {pillars.map(({ title, text, icon: Icon }) => (
            <div
              key={title}
              className="rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(10,31,61,0.35)] p-5 text-start"
            >
              <Icon className="size-8 text-[#C9A227] mb-3 opacity-90" strokeWidth={1.5} aria-hidden />
              <h3 className="text-[#C9A227] font-medium text-sm mb-2">{title}</h3>
              <p className="text-[#6e7d93] text-xs leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
