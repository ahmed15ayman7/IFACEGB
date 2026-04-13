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
  ShieldCheck,
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
  Target,
  Eye,
  Boxes,
  Compass,
  UserCheck,
  ClipboardList,
  BadgeCheck,
  BookOpen,
  Newspaper,
  CalendarDays,
  Mail,
  UserPlus,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TiltCard } from "./TiltCard";

type SectorKey = "training" | "accreditation" | "consultancy" | "tech" | "partnerships";
type StatKey = "countries" | "certificates" | "centers" | "professionals";

export type LandingSuccessStory = {
  id: string;
  quoteEn: string;
  quoteAr: string | null;
  nameEn: string;
  nameAr: string | null;
  role: string;
  avatarUrl: string | null;
};

export type LandingPartner = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
};

export type LandingProps = {
  statsOverride?: Partial<Record<StatKey, string>>;
  successStories?: LandingSuccessStory[];
  partners?: LandingPartner[];
};

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
const STORY_IMAGE =
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=960&q=80";

const viewAnim = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export function PublicLanding({ statsOverride, successStories, partners }: LandingProps = {}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tSectors = useTranslations("sectors");
  const tStats = useTranslations("landing.stats");

  const { scrollYProgress } = useScroll();
  const scrollSpring = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.15 });

  const resolvedStats = useMemo(
    () =>
      STATS.map((s) =>
        statsOverride?.[s.key] ? { ...s, value: statsOverride[s.key]! } : s
      ),
    [statsOverride]
  );

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

  const journeySteps = useMemo(
    () =>
      [
        { icon: Compass, titleKey: "journey_step1_title", descKey: "journey_step1_desc" },
        { icon: UserCheck, titleKey: "journey_step2_title", descKey: "journey_step2_desc" },
        { icon: ClipboardList, titleKey: "journey_step3_title", descKey: "journey_step3_desc" },
        { icon: BadgeCheck, titleKey: "journey_step4_title", descKey: "journey_step4_desc" },
      ] as const,
    []
  );

  const trustItems = useMemo(
    () =>
      [
        { icon: BookOpen, titleKey: "trust_1_title", descKey: "trust_1_desc" },
        { icon: ShieldCheck, titleKey: "trust_2_title", descKey: "trust_2_desc" },
        { icon: Languages, titleKey: "trust_3_title", descKey: "trust_3_desc" },
        { icon: BarChart3, titleKey: "trust_4_title", descKey: "trust_4_desc" },
      ] as const,
    []
  );

  const hubLinks = useMemo(
    () =>
      [
        { href: `/${locale}/about`, title: tNav("about"), descKey: "hub_about_desc" as const, icon: BookOpen },
        { href: `/${locale}/news`, title: tNav("news"), descKey: "hub_news_desc" as const, icon: Newspaper },
        { href: `/${locale}/events`, title: tNav("events"), descKey: "hub_events_desc" as const, icon: CalendarDays },
        { href: `/${locale}/verify`, title: tNav("verify"), descKey: "hub_verify_desc" as const, icon: ShieldCheck },
        { href: `/${locale}/contact`, title: t("hub_contact_title"), descKey: "hub_contact_desc" as const, icon: Mail },
        {
          href: `/${locale}/apply-agency`,
          title: tNav("apply_agency"),
          descKey: "hub_apply_desc" as const,
          icon: UserPlus,
        },
      ] as const,
    [locale, t, tNav]
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
              transition={{ delay: 0.22, duration: 0.45 }}
              className="mt-4 flex justify-center lg:justify-start"
            >
              <a
                href="#story"
                className="group inline-flex items-center gap-2 text-xs font-medium text-[#6e7d93] transition-colors hover:text-[#C9A227]"
              >
                <span className="border-b border-dashed border-current pb-px">{t("cta_story")}</span>
                <ArrowRight className="size-3.5 opacity-70 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.5 }}
              className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-[rgba(201,162,39,0.15)] bg-[rgba(201,162,39,0.15)] sm:mx-0 sm:max-w-lg sm:grid-cols-4"
            >
              {resolvedStats.map((stat, i) => (
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
        id="story"
        className="scroll-mt-24 border-t border-[rgba(201,162,39,0.08)] px-4 py-20 sm:py-24"
        style={{
          background:
            "linear-gradient(165deg, rgba(10,31,61,0.55) 0%, rgba(6,15,30,0.92) 45%, rgba(6,15,30,1) 100%)",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-14">
            <motion.div
              {...viewAnim}
              className="lg:col-span-7"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C9A227]">
                {t("story_kicker")}
              </p>
              <h2
                className="mb-6 text-3xl font-bold leading-tight text-[#e8c84a] sm:text-4xl lg:text-[2.35rem]"
                style={{ fontFamily: "var(--font-eb-garamond)" }}
              >
                {t("story_title")}
              </h2>
              <p className="mb-5 text-lg leading-relaxed text-[#A8B5C8] sm:text-xl">{t("story_lead")}</p>
              <p className="mb-4 text-sm leading-relaxed text-[#6e7d93] sm:text-base">{t("story_p1")}</p>
              <p className="text-sm leading-relaxed text-[#6e7d93] sm:text-base">{t("story_p2")}</p>
            </motion.div>

            <div className="flex flex-col gap-5 lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl border border-[rgba(201,162,39,0.18)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              >
                <div className="relative aspect-[5/4] w-full sm:aspect-[16/11]">
                  <Image
                    src={STORY_IMAGE}
                    alt={t("story_image_alt")}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060f1e] via-[#060f1e]/40 to-transparent" />
                </div>
              </motion.div>

              {(
                [
                  { icon: Target, titleKey: "mv_mission_title", bodyKey: "mv_mission_text" },
                  { icon: Eye, titleKey: "mv_vision_title", bodyKey: "mv_vision_text" },
                  { icon: Boxes, titleKey: "mv_model_title", bodyKey: "mv_model_text" },
                ] as const
              ).map((card, i) => {
                const CardIcon = card.icon;
                return (
                  <motion.div
                    key={card.titleKey}
                    initial={{ opacity: 0, x: isRtl ? 24 : -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ delay: 0.06 + i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative overflow-hidden rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.65)] p-5 backdrop-blur-sm transition-colors hover:border-[rgba(201,162,39,0.28)]"
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(201,162,39,0.07)] to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                    />
                    <div className="relative flex gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,162,39,0.2)] bg-[rgba(201,162,39,0.06)] text-[#C9A227]">
                        <CardIcon className="size-5" strokeWidth={1.4} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="mb-1.5 text-base font-semibold text-[#C9A227]"
                          style={{ fontFamily: "var(--font-eb-garamond)" }}
                        >
                          {t(card.titleKey)}
                        </h3>
                        <p className="text-sm leading-relaxed text-[#6e7d93]">{t(card.bodyKey)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
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

      <section id="journey" className="scroll-mt-24 px-4 py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl">
          <motion.div {...viewAnim} className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C9A227]">
              {t("journey_kicker")}
            </p>
            <h2
              className="mb-3 text-3xl font-bold text-[#C9A227] sm:text-4xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("journey_title")}
            </h2>
            <p className="text-sm leading-relaxed text-[#6e7d93] sm:text-base">{t("journey_subtitle")}</p>
            <div className="mx-auto mt-4 h-px w-28 bg-gradient-to-r from-transparent via-[rgba(201,162,39,0.5)] to-transparent" />
          </motion.div>

          <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {journeySteps.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <motion.li
                  key={step.titleKey}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-[rgba(201,162,39,0.14)] bg-[rgba(6,15,30,0.55)] p-5 shadow-[0_14px_44px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-all duration-300 hover:border-[rgba(201,162,39,0.32)] hover:shadow-[0_18px_50px_rgba(201,162,39,0.08)]">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(201,162,39,0.06)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <div className="relative mb-4 flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.1)] text-[11px] font-bold tabular-nums text-[#e8c84a]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <motion.div
                        className="flex size-12 items-center justify-center rounded-xl border border-[rgba(201,162,39,0.22)] bg-[rgba(6,15,30,0.85)] text-[#C9A227]"
                        whileHover={{ scale: 1.06 }}
                        transition={{ type: "spring", stiffness: 420, damping: 20 }}
                      >
                        <StepIcon className="size-5" strokeWidth={1.35} aria-hidden />
                      </motion.div>
                    </div>
                    <h3
                      className="relative mb-2 text-lg font-semibold text-[#e8c84a]"
                      style={{ fontFamily: "var(--font-eb-garamond)" }}
                    >
                      {t(step.titleKey)}
                    </h3>
                    <p className="relative text-sm leading-relaxed text-[#6e7d93]">{t(step.descKey)}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
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

      <section
        id="trust"
        className="scroll-mt-24 border-t border-[rgba(201,162,39,0.08)] px-4 py-20 sm:py-24"
        style={{
          background: "linear-gradient(180deg, rgba(6,15,30,0.2) 0%, rgba(10,31,61,0.35) 50%, rgba(6,15,30,0.5) 100%)",
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <motion.div {...viewAnim} className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C9A227]">
              {t("trust_kicker")}
            </p>
            <h2
              className="mb-3 text-3xl font-bold text-[#C9A227] sm:text-4xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("trust_title")}
            </h2>
            <p className="text-sm leading-relaxed text-[#6e7d93] sm:text-base">{t("trust_subtitle")}</p>
            <div className="mx-auto mt-4 h-px w-28 bg-gradient-to-r from-transparent via-[rgba(201,162,39,0.5)] to-transparent" />
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item, i) => {
              const TrustIcon = item.icon;
              return (
                <motion.div
                  key={item.titleKey}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.5)] p-5 transition-transform duration-300 hover:-translate-y-0.5 hover:border-[rgba(201,162,39,0.28)]"
                >
                  <TrustIcon className="mb-3 size-8 text-[#C9A227]" strokeWidth={1.35} aria-hidden />
                  <h3
                    className="mb-2 text-base font-semibold text-[#e8c84a]"
                    style={{ fontFamily: "var(--font-eb-garamond)" }}
                  >
                    {t(item.titleKey)}
                  </h3>
                  <p className="flex-1 text-sm leading-relaxed text-[#6e7d93]">{t(item.descKey)}</p>
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
            {successStories && successStories.length > 0
              ? successStories.map((story, i) => (
                  <motion.blockquote
                    key={story.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.45 }}
                    className="flex flex-col rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.55)] p-5"
                  >
                    <Quote className="mb-3 size-8 text-[rgba(201,162,39,0.35)]" aria-hidden />
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-[#A8B5C8]">
                      {isRtl ? (story.quoteAr ?? story.quoteEn) : story.quoteEn}
                    </p>
                    <footer className="flex items-center gap-3">
                      {story.avatarUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={story.avatarUrl}
                          alt=""
                          className="size-9 shrink-0 rounded-full object-cover opacity-90"
                          aria-hidden
                        />
                      )}
                      <cite className="not-italic">
                        <span className="block text-sm font-semibold text-[#C9A227]">
                          {isRtl ? (story.nameAr ?? story.nameEn) : story.nameEn}
                        </span>
                        <span className="text-xs text-[#6e7d93]">{story.role}</span>
                      </cite>
                    </footer>
                  </motion.blockquote>
                ))
              : testimonials.map((item, i) => (
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

      {partners && partners.length > 0 && (
        <section className="border-t border-[rgba(201,162,39,0.08)] px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <motion.div {...viewAnim} className="mx-auto mb-10 max-w-xl text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#C9A227]">
                {t("partners_kicker")}
              </p>
              <h2
                className="text-2xl font-bold text-[#C9A227] sm:text-3xl"
                style={{ fontFamily: "var(--font-eb-garamond)" }}
              >
                {t("partners_title")}
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 sm:gap-8"
            >
              {partners.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                >
                  {p.websiteUrl ? (
                    <a
                      href={p.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={isRtl ? (p.nameAr ?? p.nameEn) : p.nameEn}
                      className="flex h-14 items-center justify-center rounded-lg border border-[rgba(201,162,39,0.1)] bg-[rgba(6,15,30,0.4)] px-4 transition-all hover:border-[rgba(201,162,39,0.3)]"
                    >
                      {p.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.logoUrl}
                          alt={isRtl ? (p.nameAr ?? p.nameEn) : p.nameEn}
                          className="h-8 max-w-[110px] object-contain opacity-75 transition-opacity hover:opacity-100"
                        />
                      ) : (
                        <span className="text-sm font-medium text-[#A8B5C8]">
                          {isRtl ? (p.nameAr ?? p.nameEn) : p.nameEn}
                        </span>
                      )}
                    </a>
                  ) : (
                    <div
                      className="flex h-14 items-center justify-center rounded-lg border border-[rgba(201,162,39,0.1)] bg-[rgba(6,15,30,0.4)] px-4"
                      title={isRtl ? (p.nameAr ?? p.nameEn) : p.nameEn}
                    >
                      {p.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.logoUrl}
                          alt={isRtl ? (p.nameAr ?? p.nameEn) : p.nameEn}
                          className="h-8 max-w-[110px] object-contain opacity-75"
                        />
                      ) : (
                        <span className="text-sm font-medium text-[#A8B5C8]">
                          {isRtl ? (p.nameAr ?? p.nameEn) : p.nameEn}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      <section
        id="explore"
        className="scroll-mt-24 border-t border-[rgba(201,162,39,0.08)] bg-[rgba(6,15,30,0.25)] px-4 py-20 sm:py-24"
      >
        <div className="container mx-auto max-w-6xl">
          <motion.div {...viewAnim} className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#C9A227]">
              {t("hub_kicker")}
            </p>
            <h2
              className="mb-3 text-3xl font-bold text-[#C9A227] sm:text-4xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {t("hub_title")}
            </h2>
            <p className="text-sm leading-relaxed text-[#6e7d93] sm:text-base">{t("hub_subtitle")}</p>
            <div className="mx-auto mt-4 h-px w-28 bg-gradient-to-r from-transparent via-[rgba(201,162,39,0.5)] to-transparent" />
          </motion.div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubLinks.map((item, i) => {
              const HubIcon = item.icon;
              return (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.05, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    className="group flex h-full flex-col rounded-xl border border-[rgba(201,162,39,0.14)] bg-[rgba(10,31,61,0.35)] p-5 text-start transition-all duration-300 hover:border-[rgba(201,162,39,0.4)] hover:bg-[rgba(10,31,61,0.55)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(201,162,39,0.2)] bg-[rgba(201,162,39,0.07)] text-[#C9A227] transition-colors group-hover:border-[rgba(201,162,39,0.35)]">
                        <HubIcon className="size-5" strokeWidth={1.35} aria-hidden />
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-[rgba(201,162,39,0.45)] transition-transform group-hover:translate-x-0.5 group-hover:text-[#C9A227] rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                        aria-hidden
                      />
                    </div>
                    <h3
                      className="mb-2 text-lg font-semibold text-[#e8c84a]"
                      style={{ fontFamily: "var(--font-eb-garamond)" }}
                    >
                      {item.title}
                    </h3>
                    <p className="flex-1 text-sm leading-relaxed text-[#6e7d93]">{t(item.descKey)}</p>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
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
