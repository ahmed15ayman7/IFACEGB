import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Building2,
  Cpu,
  Globe,
  GraduationCap,
  Landmark,
  Scale,
  Sparkle,
} from "lucide-react";

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-[rgba(201,162,39,0.1)] border border-[rgba(201,162,39,0.2)] text-[#C9A227]">
            <Icon className="size-10" aria-hidden />
          </div>
        </div>
        <h1
          className="text-4xl font-bold text-[#C9A227]"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          {displayName}
        </h1>
        {pg && (
          <p className="text-[#6e7d93] max-w-2xl mx-auto text-lg leading-relaxed">
            {locale === "ar" ? pg.heroAr ?? pg.heroEn : pg.heroEn}
          </p>
        )}
        {!pg && sectorData.description && (
          <p className="text-[#6e7d93] max-w-2xl mx-auto text-lg">{sectorData.description}</p>
        )}
      </div>

      {pg?.contentEn && (
        <div className="bg-[rgba(10,31,61,0.4)] rounded-2xl border border-[rgba(201,162,39,0.12)] p-8">
          <div className="prose prose-invert text-[#A8B5C8] max-w-none">
            {locale === "ar" ? pg.contentAr ?? pg.contentEn : pg.contentEn}
          </div>
        </div>
      )}

      {features.length > 0 && (
        <div>
          <h2
            className="text-2xl font-bold text-[#C9A227] mb-6 text-center"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("services_title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-5 rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(10,31,61,0.4)]"
              >
                <Sparkle className="text-[#C9A227] size-5 shrink-0 mt-0.5" aria-hidden />
                <p className="text-[#A8B5C8] text-sm">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("cta_title")}
        </h3>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href={`/${locale}/auth/login`}
            className="h-11 px-6 rounded-xl bg-[rgba(201,162,39,0.9)] text-[#060f1e] font-semibold hover:bg-[#C9A227] transition-colors flex items-center"
          >
            {t("cta_primary")}
          </Link>
          <Link
            href={`/${locale}/apply-agency`}
            className="h-11 px-6 rounded-xl border border-[rgba(201,162,39,0.3)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.08)] transition-colors flex items-center"
          >
            {t("cta_agency")}
          </Link>
        </div>
      </div>
    </div>
  );
}
