import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo/metadata";
import {
  GraduationCap,
  Landmark,
  Scale,
  Cpu,
  Globe2,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("home", locale as "en" | "ar");
}

type SectorKey = "training" | "accreditation" | "consultancy" | "tech" | "partnerships";
type StatKey = "countries" | "certificates" | "centers" | "professionals";

const SECTORS: { key: SectorKey; icon: LucideIcon; color: string }[] = [
  { key: "training", icon: GraduationCap, color: "from-[rgba(201,162,39,0.12)] to-[rgba(201,162,39,0.04)]" },
  { key: "accreditation", icon: Landmark, color: "from-[rgba(168,181,200,0.1)] to-[rgba(168,181,200,0.03)]" },
  { key: "consultancy", icon: Scale, color: "from-[rgba(201,162,39,0.1)] to-[rgba(13,40,71,0.2)]" },
  { key: "tech", icon: Cpu, color: "from-[rgba(168,181,200,0.08)] to-[rgba(10,31,61,0.2)]" },
  { key: "partnerships", icon: Globe2, color: "from-[rgba(201,162,39,0.1)] to-[rgba(201,162,39,0.03)]" },
];

const STATS: { value: string; key: StatKey }[] = [
  { value: "47+", key: "countries" },
  { value: "120K+", key: "certificates" },
  { value: "380+", key: "centers" },
  { value: "95K+", key: "professionals" },
];

export default async function LandingPage() {
  const locale = await getLocale();
  const tLanding = await getTranslations("landing");
  const tSectors = await getTranslations("sectors");
  const tStats = await getTranslations("landing.stats");

  return (
    <div className="relative overflow-hidden">
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-24">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,162,39,0.1) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[rgba(201,162,39,0.05)] pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-[rgba(201,162,39,0.07)] pointer-events-none"
        />

        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(201,162,39,0.3)] bg-[rgba(201,162,39,0.06)] text-[#C9A227] text-xs font-medium tracking-widest uppercase">
          <Sparkles className="size-3.5 shrink-0" aria-hidden />
          {tLanding("badge")}
        </div>

        <div className="mb-8 relative">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full blur-2xl bg-[rgba(201,162,39,0.15)] scale-150"
          />
          <Image
            src="/logo-dark.png"
            alt="iFACE Global"
            width={100}
            height={100}
            className="relative w-20 h-20 sm:w-24 sm:h-24 object-contain"
            priority
          />
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-4 max-w-3xl"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          <span className="text-[#C9A227]">{tLanding("headline")}</span>
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #e8c84a 0%, #C9A227 50%, #a8871f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {tLanding("headline_accent")}
          </span>
        </h1>

        <p className="text-[#A8B5C8] text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          {tLanding("subheadline")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href={`/${locale}/auth/register`}
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-[#C9A227] text-[#060f1e] font-semibold text-sm hover:bg-[#e8c84a] transition-all shadow-[0_4px_20px_rgba(201,162,39,0.35)]"
          >
            {tLanding("cta_primary")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
          <a
            href="#sectors"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-[rgba(201,162,39,0.35)] text-[#C9A227] font-semibold text-sm hover:bg-[rgba(201,162,39,0.08)] transition-all"
          >
            {tLanding("cta_secondary")}
          </a>
        </div>

        <div className="w-full max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-xl border border-[rgba(201,162,39,0.15)] bg-[rgba(201,162,39,0.15)]">
          {STATS.map((stat) => (
            <div
              key={stat.key}
              className="flex flex-col items-center justify-center gap-1 py-5 bg-[rgba(6,15,30,0.9)] backdrop-blur-sm"
            >
              <span
                className="text-2xl sm:text-3xl font-bold text-[#C9A227]"
                style={{ fontFamily: "var(--font-eb-garamond)" }}
              >
                {stat.value}
              </span>
              <span className="text-[#6e7d93] text-xs">{tStats(stat.key)}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="sectors"
        className="py-20 px-4 relative"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(10,31,61,0.4) 30%, rgba(6,15,30,0.6) 100%)",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#C9A227] mb-3"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {tSectors("title")}
            </h2>
            <p className="text-[#6e7d93] text-sm max-w-xl mx-auto">{tSectors("subtitle")}</p>
            <div className="mt-4 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-[rgba(201,162,39,0.6)] to-transparent" />
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTORS.map((sector) => {
              const Icon = sector.icon;
              return (
                <Link
                  key={sector.key}
                  href={`/${locale}/sectors/${sector.key}`}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${sector.color} border border-[rgba(201,162,39,0.12)] p-6 hover:border-[rgba(201,162,39,0.35)] transition-all duration-300 hover:shadow-[0_4px_24px_rgba(201,162,39,0.08)] block text-start`}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-[rgba(201,162,39,0.04)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="relative">
                    <Icon
                      className="size-9 text-[#C9A227] mb-4 opacity-90 group-hover:opacity-100 transition-opacity"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <h3
                      className="text-lg font-semibold text-[#C9A227] mb-2 group-hover:text-[#e8c84a] transition-colors"
                      style={{ fontFamily: "var(--font-eb-garamond)" }}
                    >
                      {tSectors(`${sector.key}.name`)}
                    </h3>
                    <p className="text-[#6e7d93] text-sm leading-relaxed mb-3">
                      {tSectors(`${sector.key}.description`)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C9A227] opacity-80 group-hover:opacity-100">
                      {tSectors("view_sector")}
                      <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[rgba(201,162,39,0.4)]" />
            <Sparkles className="size-4 text-[rgba(201,162,39,0.6)]" aria-hidden />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[rgba(201,162,39,0.4)]" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#C9A227] mb-4"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {tLanding("cta_bottom_title")}
          </h2>
          <p className="text-[#6e7d93] mb-8">{tLanding("cta_bottom_sub")}</p>
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex items-center justify-center gap-2 h-12 px-10 rounded-lg bg-[#C9A227] text-[#060f1e] font-semibold hover:bg-[#e8c84a] transition-all shadow-[0_4px_24px_rgba(201,162,39,0.4)]"
          >
            {tLanding("cta_bottom_button")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
