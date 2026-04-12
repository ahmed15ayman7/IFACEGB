import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import { ApplyAgencyForm } from "@/components/public/ApplyAgencyForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("apply-agency", locale as "en" | "ar");
}

export default function ApplyAgencyPage() {
  return <ApplyAgencyForm />;
}
