import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { PublicLanding } from "@/components/landing/PublicLanding";
import type { LandingProps } from "@/components/landing/PublicLanding";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("home", locale as "en" | "ar");
}

export default async function LandingPage() {
  const props: LandingProps = {};

  try {
    const [successStories, partners, countriesCount, certCount] = await Promise.all([
      prisma.successStory.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        take: 6,
        select: {
          id: true,
          quoteEn: true,
          quoteAr: true,
          nameEn: true,
          nameAr: true,
          role: true,
          avatarUrl: true,
        },
      }),
      prisma.successPartner.findMany({
        orderBy: { sortOrder: "asc" },
        take: 16,
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          logoUrl: true,
          websiteUrl: true,
        },
      }),
      prisma.franchiseCountry.count(),
      prisma.certificate.count({ where: { status: "issued" } }),
    ]);

    if (successStories.length > 0)
      props.successStories = successStories.map((s) => ({ ...s, role: s.role ?? "" }));
    if (partners.length > 0) props.partners = partners;

    const statsOverride: LandingProps["statsOverride"] = {};
    if (countriesCount > 0) statsOverride.countries = `${countriesCount}+`;
    if (certCount > 0) {
      statsOverride.certificates =
        certCount >= 1000 ? `${Math.floor(certCount / 1000)}K+` : `${certCount}+`;
    }
    if (Object.keys(statsOverride).length > 0) props.statsOverride = statsOverride;
  } catch {
    // DB not yet seeded or unavailable — render with static defaults
  }

  return <PublicLanding {...props} />;
}
