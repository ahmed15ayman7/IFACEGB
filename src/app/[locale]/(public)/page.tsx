import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { PublicLanding } from "@/components/landing/PublicLanding";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("home", locale as "en" | "ar");
}

export default function LandingPage() {
  return <PublicLanding />;
}
