import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Award,
  Building2,
  Cpu,
  Globe,
  GraduationCap,
  Landmark,
  Scale,
  Sparkle,
} from "lucide-react";
import { PublicShell, PublicPageHeader, PublicFadeIn, PublicGlowCard } from "@/components/public/motion";

type Props = { params: Promise<{ slug: string; locale: string }> };

type SectorIconSlug = "training" | "accreditation" | "consultancy" | "tech" | "partnerships";
const FEATURE_SLUGS: SectorIconSlug[] = [
  "training",
  "accreditation",
  "consultancy",
  "tech",
  "partnerships",
];

function sectorIcon(slug: string) {
  const map: Record<SectorIconSlug, typeof GraduationCap> = {
    training: GraduationCap,
    accreditation: Building2,
    consultancy: Scale,
    tech: Cpu,
    partnerships: Globe,
  };
  return map[slug as SectorIconSlug] ?? Landmark;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const sector = await prisma.sector.findUnique({ where: { code: slug } });
    if (!sector) return {};
    return {
      title: `${locale === "ar" ? sector.nameAr : sector.nameEn} | iFACE`,
      description: sector.description ?? "",
      alternates: {
        languages: { en: `/en/sectors/${slug}`, ar: `/ar/sectors/${slug}` },
      },
    };
  } catch {
    return {};
  }
}

export default async function SectorPublicPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("public.sector_public");
  const tFeatures = await getTranslations("public.sector_features");

  const sector = await prisma.sector
    .findUnique({
      where: { code: slug },
      include: { sectorPublicPage: true },
    })
    .catch(() => null);

  const certCount = sector
    ? await prisma.certificate
        .count({ where: { status: "issued", sectorId: sector.id } })
        .catch(() => 0)
    : 0;

  const SECTOR_DEFAULTS = {
    training: {
      nameEn: "Training & Development",
      nameAr: "التدريب والتطوير",
      description: "Professional training programs, LMS, virtual classrooms, and certified diplomas.",
    },
    accreditation: {
      nameEn: "International Accreditation",
      nameAr: "الاعتماد الدولي",
      description: "World-recognized institutional and program accreditation.",
    },
    consultancy: {
      nameEn: "Consultancy & Excellence",
      nameAr: "الاستشارات والتميز",
      description: "Strategic institutional consulting and performance excellence.",
    },
    tech: {
      nameEn: "Tech Engine",
      nameAr: "محرك التقنية",
      description: "AI-powered EdTech, Face-ID services, and digital infrastructure.",
    },
    partnerships: {
      nameEn: "Global Partnerships",
      nameAr: "الشراكات العالمية",
      description: "Master franchise network and international alliances.",
    },
  };

  const defaultData = SECTOR_DEFAULTS[slug as keyof typeof SECTOR_DEFAULTS];
  if (!sector && !defaultData) notFound();

  const sectorData = sector ?? { ...defaultData!, id: slug, sectorPublicPage: null };
  const pg = sectorData.sectorPublicPage;

  const features: string[] = FEATURE_SLUGS.includes(slug as SectorIconSlug)
    ? (tFeatures.raw(slug as SectorIconSlug) as string[])
    : [];

  const displayName =
    locale === "ar"
      ? (sectorData as { nameAr?: string; nameEn: string }).nameAr ?? sectorData.nameEn
      : sectorData.nameEn;

  const Icon = sectorIcon(slug);

  const heroDescription =
    pg && (locale === "ar" ? pg.heroAr ?? pg.heroEn : pg.heroEn)
      ? (locale === "ar" ? pg.heroAr ?? pg.heroEn : pg.heroEn) ?? undefined
      : (sectorData.description ?? undefined);

  return (
    <PublicShell className="py-16 sm:py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <PublicPageHeader
          title={displayName}
          subtitle={heroDescription}
          iconFrameClassName="!size-[5.5rem] sm:!size-28 rounded-3xl shadow-[0_20px_50px_rgba(201,162,39,0.15)]"
        >
          <Icon className="size-12 sm:size-14" strokeWidth={1.2} aria-hidden />
        </PublicPageHeader>

        {certCount > 0 && (
          <PublicFadeIn delay={0.04} className="mb-12">
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex min-w-[160px] flex-col items-center gap-1 rounded-xl border border-[rgba(201,162,39,0.2)] bg-[rgba(10,31,61,0.45)] p-5 text-center backdrop-blur-sm">
                <Award className="size-7 text-[#C9A227]" strokeWidth={1.3} aria-hidden />
                <span
                  className="text-2xl font-bold text-[#C9A227]"
                  style={{ fontFamily: "var(--font-eb-garamond)" }}
                >
                  {certCount >= 1000 ? `${Math.floor(certCount / 1000)}K+` : `${certCount}+`}
                </span>
                <span className="text-xs text-[#6e7d93]">{t("stats_certs")}</span>
              </div>
            </div>
          </PublicFadeIn>
        )}

        {pg?.contentEn && (
          <PublicFadeIn delay={0.08} className="mb-14">
            <div className="rounded-2xl border border-[rgba(201,162,39,0.14)] bg-[rgba(10,31,61,0.5)] p-8 backdrop-blur-sm">
              <div className="prose prose-invert max-w-none text-[#A8B5C8]">
                {locale === "ar" ? pg.contentAr ?? pg.contentEn : pg.contentEn}
              </div>
            </div>
          </PublicFadeIn>
        )}

        {features.length > 0 && (
          <PublicFadeIn delay={0.06} className="mb-16">
            <h2
              className="mb-8 text-center text-2xl font-bold text-[#C9A227] sm:text-3xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("services_title")}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <PublicGlowCard key={`${feature}-${i}`} delay={i * 0.05} className="flex items-start gap-3 p-5">
                  <Sparkle className="mt-0.5 size-5 shrink-0 text-[#C9A227]" aria-hidden />
                  <p className="text-sm leading-relaxed text-[#A8B5C8]">{feature}</p>
                </PublicGlowCard>
              ))}
            </div>
          </PublicFadeIn>
        )}

        <PublicFadeIn delay={0.1} className="text-center">
          <h3
            className="mb-6 text-xl font-bold text-[#C9A227] sm:text-2xl"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("cta_title")}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/auth/login`}
              className="inline-flex h-12 items-center rounded-xl bg-[rgba(201,162,39,0.92)] px-8 text-sm font-semibold text-[#060f1e] shadow-[0_8px_28px_rgba(201,162,39,0.25)] transition-all hover:bg-[#C9A227]"
            >
              {t("cta_primary")}
            </Link>
            <Link
              href={`/${locale}/apply-agency`}
              className="inline-flex h-12 items-center rounded-xl border border-[rgba(201,162,39,0.35)] px-8 text-sm font-semibold text-[#C9A227] transition-all hover:bg-[rgba(201,162,39,0.08)]"
            >
              {t("cta_agency")}
            </Link>
          </div>
        </PublicFadeIn>
      </div>
    </PublicShell>
  );
}
