import type { Metadata } from "next";
import { Suspense } from "react";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { ApplyAgencyForm, type ApplicationType } from "@/components/public/ApplyAgencyForm";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Network,
  ClipboardCheck,
  Users,
  BadgeCheck,
  FileText,
  Globe2,
} from "lucide-react";
import { PublicShell, PublicPageHeader, PublicFadeIn, PublicGlowCard } from "@/components/public/motion";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

function parseAppType(v: string | string[] | undefined): ApplicationType {
  const s = Array.isArray(v) ? v[0] : v;
  if (s === "center" || s === "trainer") return s;
  return "agent";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("apply-agency", locale as "en" | "ar");
}

export default async function ApplyAgencyPage({ searchParams }: Props) {
  const locale = await getLocale();
  const sp = await searchParams;
  const appType = parseAppType(sp.type);
  const t = await getTranslations("public.applyAgency");
  const isRtl = locale === "ar";

  const pageTitleKey =
    appType === "center" ? "page_title_center" : appType === "trainer" ? "page_title_trainer" : "page_title_agent";
  const pageSubKey =
    appType === "center"
      ? "page_subtitle_center"
      : appType === "trainer"
        ? "page_subtitle_trainer"
        : "page_subtitle_agent";

  const countries = await prisma.franchiseCountry
    .findMany({ orderBy: { countryEn: "asc" } })
    .catch(() => []);

  const steps = [
    {
      icon: FileText,
      title: t("process_step1_title"),
      desc: t("process_step1_desc"),
    },
    {
      icon: Users,
      title: t("process_step2_title"),
      desc: t("process_step2_desc"),
    },
    {
      icon: BadgeCheck,
      title: t("process_step3_title"),
      desc: t("process_step3_desc"),
    },
  ];

  const requirements = [
    t("req_1"),
    t("req_2"),
    t("req_3"),
    t("req_4"),
  ];

  return (
    <PublicShell className="py-16 sm:py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <PublicPageHeader title={t(pageTitleKey)} subtitle={t(pageSubKey)}>
          <Network className="size-7 sm:size-8" strokeWidth={1.25} aria-hidden />
        </PublicPageHeader>

        <PublicFadeIn delay={0.06} className="mb-16">
          <h2
            className="mb-8 text-center text-xl font-bold text-[#C9A227] sm:text-2xl"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("process_title")}
          </h2>
          <ol className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <PublicGlowCard key={title} delay={i * 0.06} className="relative flex flex-col gap-4 p-6">
                <span
                  className="absolute -start-3 -top-3 flex size-7 items-center justify-center rounded-full border border-[rgba(201,162,39,0.35)] bg-[rgba(6,15,30,0.95)] text-xs font-bold text-[#C9A227]"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <Icon className="size-8 text-[#C9A227]" strokeWidth={1.35} aria-hidden />
                <div>
                  <h3
                    className="mb-1.5 text-base font-semibold text-[#e8c84a]"
                    style={{ fontFamily: "var(--font-eb-garamond)" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#6e7d93]">{desc}</p>
                </div>
              </PublicGlowCard>
            ))}
          </ol>
        </PublicFadeIn>

        <PublicFadeIn delay={0.08} className="mb-16">
          <div className="rounded-2xl border border-[rgba(201,162,39,0.14)] bg-[rgba(10,31,61,0.35)] p-7">
            <h2
              className="mb-5 flex items-center gap-2 text-xl font-bold text-[#C9A227]"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              <ClipboardCheck className="size-5" strokeWidth={1.4} aria-hidden />
              {t("requirements_title")}
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {requirements.map((req) => (
                <li key={req} className="flex items-start gap-3 text-sm text-[#A8B5C8]">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[rgba(201,162,39,0.3)] text-[#C9A227]">
                    <BadgeCheck className="size-3" aria-hidden />
                  </span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </PublicFadeIn>

        {countries.length > 0 && (
          <PublicFadeIn delay={0.1} className="mb-16">
            <h2
              className="mb-2 text-center text-xl font-bold text-[#C9A227] sm:text-2xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              <span className="inline-flex items-center gap-2">
                <Globe2 className="size-5" aria-hidden />
                {t("countries_title")}
              </span>
            </h2>
            <p className="mb-8 text-center text-sm text-[#6e7d93]">{t("countries_subtitle")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {countries.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(201,162,39,0.15)] bg-[rgba(6,15,30,0.5)] px-3 py-1.5 text-xs font-medium text-[#A8B5C8]"
                >
                  <span className="font-semibold text-[#C9A227]">{c.countryCode}</span>
                  {isRtl ? (c.countryAr ?? c.countryEn) : c.countryEn}
                </span>
              ))}
            </div>
          </PublicFadeIn>
        )}

        <div id="apply-form" className="mx-auto max-w-xl scroll-mt-24">
          <h2
            className="mb-6 text-center text-xl font-bold text-[#C9A227] sm:text-2xl"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("form_title")}
          </h2>
          <PublicFadeIn delay={0.12}>
            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded-xl border border-[rgba(201,162,39,0.1)] bg-[rgba(6,15,30,0.4)]" />
              }
            >
              <ApplyAgencyForm initialType={appType} />
            </Suspense>
          </PublicFadeIn>
        </div>
      </div>
    </PublicShell>
  );
}
