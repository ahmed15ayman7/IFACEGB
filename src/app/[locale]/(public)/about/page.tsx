import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Target,
  Shield,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { PublicShell, PublicPageHeader, PublicFadeIn, PublicGlowCard } from "@/components/public/motion";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("about", locale as "en" | "ar");
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations("public.about");
  const isRtl = locale === "ar";

  const [pillars, milestones, partners] = await Promise.all([
    prisma.strategicPillar
      .findMany({ orderBy: { sortOrder: "asc" } })
      .catch(() => []),
    prisma.strategicMilestone
      .findMany({ where: { isCompleted: true }, orderBy: { completedAt: "desc" }, take: 8 })
      .catch(() => []),
    prisma.successPartner
      .findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 16 })
      .catch(() => []),
  ]);

  const staticPillars = [
    { title: t("pillar_1_title"), text: t("pillar_1_text"), icon: Target },
    { title: t("pillar_2_title"), text: t("pillar_2_text"), icon: Shield },
    { title: t("pillar_3_title"), text: t("pillar_3_text"), icon: BarChart3 },
  ];

  const displayPillars =
    pillars.length > 0
      ? pillars.map((p) => ({
          title: isRtl ? (p.nameAr ?? p.nameEn) : p.nameEn,
          text: p.description ?? "",
          icon: Target,
        }))
      : staticPillars;

  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";

  return (
    <PublicShell className="py-16 sm:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <PublicPageHeader title={t("title")} subtitle={t("lead")}>
          <BookOpen className="size-7 sm:size-8" strokeWidth={1.25} aria-hidden />
        </PublicPageHeader>

        <PublicFadeIn delay={0.06} className="mx-auto max-w-3xl space-y-5 text-sm leading-relaxed text-[#A8B5C8] sm:text-[15px]">
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
            {displayPillars.map(({ title, text, icon: Icon }, i) => (
              <PublicGlowCard key={title} delay={i * 0.07} className="p-5 text-start">
                <Icon className="mb-3 size-8 text-[#C9A227] opacity-95" strokeWidth={1.35} aria-hidden />
                <h3 className="mb-2 text-base font-semibold text-[#e8c84a]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#6e7d93]">{text}</p>
              </PublicGlowCard>
            ))}
          </div>
        </PublicFadeIn>

        {milestones.length > 0 && (
          <PublicFadeIn delay={0.08} className="mt-20">
            <h2
              className="mb-2 text-center text-xl font-semibold text-[#C9A227] sm:text-2xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("milestones_title")}
            </h2>
            <p className="mb-10 text-center text-sm text-[#6e7d93]">{t("milestones_subtitle")}</p>
            <ol className="relative border-s border-[rgba(201,162,39,0.25)]">
              {milestones.map((m, i) => (
                <PublicFadeIn key={m.id} delay={i * 0.05}>
                  <li className="mb-8 ms-6">
                    <span className="absolute -start-3 flex size-6 items-center justify-center rounded-full border border-[rgba(201,162,39,0.35)] bg-[rgba(6,15,30,0.9)] text-[#C9A227]">
                      <CheckCircle2 className="size-3.5" aria-hidden />
                    </span>
                    <p className="mb-0.5 text-xs text-[#6e7d93]">
                      {new Date(m.completedAt ?? m.dueDate).toLocaleDateString(dateLocale, {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="text-sm font-semibold text-[#e8c84a]">
                      {isRtl ? (m.titleAr ?? m.titleEn) : m.titleEn}
                    </h3>
                  </li>
                </PublicFadeIn>
              ))}
            </ol>
          </PublicFadeIn>
        )}

        {partners.length > 0 && (
          <PublicFadeIn delay={0.1} className="mt-20">
            <h2
              className="mb-2 text-center text-xl font-semibold text-[#C9A227] sm:text-2xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("partners_title")}
            </h2>
            <p className="mb-10 text-center text-sm text-[#6e7d93]">{t("partners_subtitle")}</p>
            <div className="flex flex-wrap items-center justify-center gap-5">
              {partners.map((p) => (
                <div
                  key={p.id}
                  className="flex h-14 items-center justify-center rounded-lg border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.45)] px-5 transition-all hover:border-[rgba(201,162,39,0.28)]"
                >
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logoUrl}
                      alt={isRtl ? (p.nameAr ?? p.nameEn) : p.nameEn}
                      className="h-7 max-w-[100px] object-contain opacity-75"
                    />
                  ) : (
                    <span className="text-sm font-medium text-[#A8B5C8]">
                      {isRtl ? (p.nameAr ?? p.nameEn) : p.nameEn}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </PublicFadeIn>
        )}

        <PublicFadeIn delay={0.14} className="mt-20 text-center">
          <div className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[rgba(10,31,61,0.4)] px-8 py-10">
            <h2
              className="mb-4 text-2xl font-bold text-[#C9A227] sm:text-3xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("cta_title")}
            </h2>
            <Link
              href={`/${locale}/auth/register`}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[rgba(201,162,39,0.9)] px-8 text-sm font-semibold text-[#060f1e] shadow-[0_6px_24px_rgba(201,162,39,0.25)] transition-all hover:bg-[#C9A227]"
            >
              {t("cta_button")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        </PublicFadeIn>
      </div>
    </PublicShell>
  );
}
