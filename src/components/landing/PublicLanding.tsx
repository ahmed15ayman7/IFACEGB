"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Shield,
  GraduationCap,
  LayoutGrid,
  Users,
  FileCheck,
  Languages,
  Quote,
  Cpu,
  Globe2,
  Landmark,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TiltCard } from "./TiltCard";

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

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";
const AGENTS_IMAGE =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=960&q=80";
const CENTERS_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=960&q=80";

const viewAnim = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export function PublicLanding() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tSectors = useTranslations("sectors");
  const tStats = useTranslations("landing.stats");

  const { scrollYProgress } = useScroll();
  const scrollSpring = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.15 });

  const featureItems = useMemo(
    () =>
      [
        { icon: Shield, titleKey: "feature_crypto_title", descKey: "feature_crypto_desc" },
        { icon: GraduationCap, titleKey: "feature_lms_title", descKey: "feature_lms_desc" },
        { icon: LayoutGrid, titleKey: "feature_sectors_title", descKey: "feature_sectors_desc" },
        { icon: Users, titleKey: "feature_agents_title", descKey: "feature_agents_desc" },
        { icon: FileCheck, titleKey: "feature_audit_title", descKey: "feature_audit_desc" },
        { icon: Languages, titleKey: "feature_i18n_title", descKey: "feature_i18n_desc" },
      ] as const,
    []
  );

  const testimonials = useMemo(
    () =>
      [
        { q: "testimonial_1_quote", n: "testimonial_1_name", r: "testimonial_1_role" },
        { q: "testimonial_2_quote", n: "testimonial_2_name", r: "testimonial_2_role" },
        { q: "testimonial_3_quote", n: "testimonial_3_name", r: "testimonial_3_role" },
      ] as const,
    []
  );

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="fixed start-0 top-0 z-[60] h-[3px] w-full bg-gradient-to-r from-[#a8871f] via-[#C9A227] to-[#e8c84a]"
        style={{
          scaleX: scrollSpring,
          transformOrigin: isRtl ? "100% 50%" : "0% 50%",
        }}
        aria-hidden
      />

      <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:pt-14 lg:pb-24 lg:pt-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute -start-[20%] top-0 h-[420px] w-[420px] rounded-full bg-[rgba(201,162,39,0.07)] blur-[100px]"
            animate={{ x: [0, isRtl ? -30 : 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -end-[10%] top-1/4 h-[380px] w-[380px] rounded-full bg-[rgba(80,120,180,0.08)] blur-[90px]"
            animate={{ x: [0, isRtl ? 24 : -24, 0], y: [0, -16, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `radial-gradient(ellipse 70% 45% at 50% 0%, rgba(201,162,39,0.14) 0%, transparent 55%)`,
            }}
          />
        </div>

        <div
          className={cn(
            "relative z-[1] mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16",
            isRtl ? "lg:flex-row-reverse" : ""
          )}
        >
          <div className="flex-1 text-center lg:text-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,162,39,0.35)] bg-[rgba(201,162,39,0.07)] px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#C9A227]"
            >
              <Sparkles className="size-3.5 shrink-0" aria-hidden />
              {t("badge")}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.45 }}
              className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6e7d93]"
            >
              {t("mesh_tag")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              <span className="text-[#C9A227]">{t("headline")}</span>
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #e8c84a 0%, #C9A227 50%, #a8871f 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("headline_accent")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.5 }}
              className="mb-8 max-w-xl text-base leading-relaxed text-[#A8B5C8] sm:text-lg"
            >
              {t("subheadline")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.45 }}
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start"
            >
              <Link
                href={`/${locale}/auth/register`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#C9A227] px-8 text-sm font-semibold text-[#060f1e] shadow-[0_4px_20px_rgba(201,162,39,0.35)] transition-all hover:bg-[#e8c84a]"
              >
                {t("cta_primary")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
              </Link>
              <a
                href="#sectors"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[rgba(201,162,39,0.35)] px-8 text-sm font-semibold text-[#C9A227] transition-all hover:bg-[rgba(201,162,39,0.08)]"
              >
                {t("cta_secondary")}
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.5 }}
              className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-[rgba(201,162,39,0.15)] bg-[rgba(201,162,39,0.15)] sm:mx-0 sm:max-w-lg sm:grid-cols-4"
            >
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + i * 0.05, duration: 0.35 }}
                  className="flex flex-col items-center justify-center gap-1 bg-[rgba(6,15,30,0.92)] py-4 backdrop-blur-sm"
                >
                  <span
                    className="text-2xl font-bold text-[#C9A227] sm:text-3xl"
                    style={{ fontFamily: "var(--font-eb-garamond)" }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-center text-[11px] text-[#6e7d93]">{tStats(stat.key)}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="relative w-full max-w-lg flex-1 lg:max-w-none"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(10,31,61,0.5)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#060f1e]/90 via-transparent to-transparent"
              />
              <motion.div
                className="relative h-full w-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src={HERO_IMAGE}
                  alt={t("hero_visual_alt")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </motion.div>
              <div className="absolute bottom-4 start-4 end-4 rounded-xl border border-[rgba(201,162,39,0.15)] bg-[rgba(6,15,30,0.75)] p-3 backdrop-blur-md">
                <p className="text-xs font-medium text-[#C9A227]">{t("features_kicker")}</p>
                <p className="text-[11px] leading-snug text-[#A8B5C8]">{t("features_subtitle")}</p>
              </div>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] border border-[rgba(201,162,39,0.06)]"
            />
          </motion.div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-24 border-t border-[rgba(201,162,39,0.08)] bg-[rgba(6,15,30,0.35)] px-4 py-20"
      >
        <div className="container mx-auto max-w-6xl">
          <motion.div {...viewAnim} className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C9A227]">
              {t("features_kicker")}
            </p>
            <h2
              className="mb-3 text-3xl font-bold text-[#C9A227] sm:text-4xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("features_title")}
            </h2>
            <p className="text-sm text-[#6e7d93]">{t("features_subtitle")}</p>
            <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[rgba(201,162,39,0.55)] to-transparent" />
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.titleKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TiltCard className="h-full rounded-xl p-[1px] [transform-style:preserve-3d]">
                    <div className="flex h-full flex-col rounded-xl border border-[rgba(201,162,39,0.14)] bg-gradient-to-br from-[rgba(201,162,39,0.08)] to-[rgba(6,15,30,0.85)] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
                      <Icon className="mb-4 size-9 text-[#C9A227]" strokeWidth={1.35} aria-hidden />
                      <h3
                        className="mb-2 text-lg font-semibold text-[#e8c84a]"
                        style={{ fontFamily: "var(--font-eb-garamond)" }}
                      >
                        {t(item.titleKey)}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#6e7d93]">{t(item.descKey)}</p>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="sectors"
        className="scroll-mt-24 px-4 py-20"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(10,31,61,0.4) 30%, rgba(6,15,30,0.65) 100%)",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <motion.div {...viewAnim} className="text-center">
            <h2
              className="mb-3 text-3xl font-bold text-[#C9A227] sm:text-4xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {tSectors("title")}
            </h2>
            <p className="mx-auto max-w-xl text-sm text-[#6e7d93]">{tSectors("subtitle")}</p>
            <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[rgba(201,162,39,0.6)] to-transparent" />
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTORS.map((sector, i) => {
              const Icon = sector.icon;
              return (
                <motion.div
                  key={sector.key}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TiltCard intensity={8} className="h-full">
                    <Link
                      href={`/${locale}/sectors/${sector.key}`}
                      className={cn(
                        "group relative block h-full overflow-hidden rounded-xl border border-[rgba(201,162,39,0.12)] bg-gradient-to-br p-6 text-start transition-all duration-300 hover:border-[rgba(201,162,39,0.38)] hover:shadow-[0_8px_32px_rgba(201,162,39,0.1)]",
                        sector.color
                      )}
                    >
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-br from-[rgba(201,162,39,0.06)] to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                      />
                      <div className="relative">
                        <Icon
                          className="mb-4 size-9 text-[#C9A227] opacity-90 transition-opacity group-hover:opacity-100"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        <h3
                          className="mb-2 text-lg font-semibold text-[#C9A227] transition-colors group-hover:text-[#e8c84a]"
                          style={{ fontFamily: "var(--font-eb-garamond)" }}
                        >
                          {tSectors(`${sector.key}.name`)}
                        </h3>
                        <p className="mb-3 text-sm leading-relaxed text-[#6e7d93]">
                          {tSectors(`${sector.key}.description`)}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C9A227] opacity-80 group-hover:opacity-100">
                          {tSectors("view_sector")}
                          <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
                        </span>
                      </div>
                    </Link>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="network" className="scroll-mt-24 border-t border-[rgba(201,162,39,0.08)] px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...viewAnim} className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C9A227]">
              {t("network_kicker")}
            </p>
            <h2
              className="mb-3 text-3xl font-bold text-[#C9A227] sm:text-4xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("network_title")}
            </h2>
            <p className="text-sm text-[#6e7d93]">{t("network_subtitle")}</p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <motion.article
              {...viewAnim}
              className="overflow-hidden rounded-2xl border border-[rgba(201,162,39,0.14)] bg-[rgba(10,31,61,0.35)]"
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={AGENTS_IMAGE}
                  alt={t("agents_image_alt")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060f1e] via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="mb-2 text-xl font-semibold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                  {t("agents_card_title")}
                </h3>
                <p className="text-sm leading-relaxed text-[#6e7d93]">{t("agents_card_body")}</p>
                <Link
                  href={`/${locale}/apply-agency`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#e8c84a] hover:text-[#C9A227]"
                >
                  {tNav("apply_agency")}
                  <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
                </Link>
              </div>
            </motion.article>

            <motion.article
              {...viewAnim}
              transition={{ ...viewAnim.transition, delay: 0.08 }}
              className="overflow-hidden rounded-2xl border border-[rgba(201,162,39,0.14)] bg-[rgba(10,31,61,0.35)]"
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={CENTERS_IMAGE}
                  alt={t("centers_image_alt")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060f1e] via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="mb-2 text-xl font-semibold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
                  {t("centers_card_title")}
                </h3>
                <p className="text-sm leading-relaxed text-[#6e7d93]">{t("centers_card_body")}</p>
                <a
                  href="#sectors"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#e8c84a] hover:text-[#C9A227]"
                >
                  {t("cta_secondary")}
                  <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
                </a>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...viewAnim} className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C9A227]">
              {t("testimonials_kicker")}
            </p>
            <h2
              className="text-3xl font-bold text-[#C9A227] sm:text-4xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("testimonials_title")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <motion.blockquote
                key={item.q}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="flex flex-col rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.55)] p-5"
              >
                <Quote className="mb-3 size-8 text-[rgba(201,162,39,0.35)]" aria-hidden />
                <p className="mb-4 flex-1 text-sm leading-relaxed text-[#A8B5C8]">{t(item.q)}</p>
                <footer>
                  <cite className="not-italic">
                    <span className="block text-sm font-semibold text-[#C9A227]">{t(item.n)}</span>
                    <span className="text-xs text-[#6e7d93]">{t(item.r)}</span>
                  </cite>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 pt-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div {...viewAnim} className="flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[rgba(201,162,39,0.4)]" />
            <Sparkles className="size-4 text-[rgba(201,162,39,0.6)]" aria-hidden />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[rgba(201,162,39,0.4)]" />
          </motion.div>
          <motion.h2
            {...viewAnim}
            className="mb-4 mt-8 text-3xl font-bold text-[#C9A227] sm:text-4xl"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("cta_bottom_title")}
          </motion.h2>
          <motion.p {...viewAnim} className="mb-8 text-[#6e7d93]">
            {t("cta_bottom_sub")}
          </motion.p>
          <motion.div {...viewAnim}>
            <Link
              href={`/${locale}/auth/login`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#C9A227] px-10 text-sm font-semibold text-[#060f1e] shadow-[0_4px_24px_rgba(201,162,39,0.4)] transition-all hover:bg-[#e8c84a]"
            >
              {t("cta_bottom_button")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
