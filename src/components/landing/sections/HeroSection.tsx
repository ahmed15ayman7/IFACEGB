"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

interface HeroStats {
  employees: number;
  certificates: number;
  agents: number;
  countries: number;
}

interface HeroSectionProps {
  stats: HeroStats;
}

function formatStat(value: number): string {
  if (value >= 1000) return `+${(value / 1000).toFixed(1)}K`;
  return value > 0 ? `+${value}` : "—";
}

export function HeroSection({ stats }: HeroSectionProps) {
  const t = useTranslations("landing.hero");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const statItems = [
    { key: "stat_employees", value: formatStat(stats.employees) },
    { key: "stat_certificates", value: formatStat(stats.certificates) },
    { key: "stat_agents", value: formatStat(stats.agents) },
    { key: "stat_countries", value: stats.countries > 0 ? `${stats.countries}` : "22" },
  ];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#020817]">
      {/* Animated background glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201,162,39,0.15) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201,162,39,0.05) 0%, transparent 60%)" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,162,39,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 text-[#C9A227] text-xs font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#C9A227] animate-pulse" />
          {t("badge")}
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <span className="text-[#C9A227]">{t("headline")}</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-[#94A3B8] text-base md:text-lg max-w-3xl mx-auto mb-10 leading-relaxed"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {t("subheadline")}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link
            href="/register"
            className="px-8 py-3 rounded-lg bg-[#C9A227] text-black font-semibold text-sm hover:bg-[#E6B830] transition-colors"
          >
            {t("cta_start")}
          </Link>
          <a
            href="#sectors"
            className="px-8 py-3 rounded-lg border border-[#C9A227]/40 text-[#C9A227] font-semibold text-sm hover:bg-[#C9A227]/10 transition-colors"
          >
            {t("cta_explore")}
          </a>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {statItems.map((stat) => (
            <div
              key={stat.key}
              className="flex flex-col items-center p-4 rounded-xl border border-[#1E293B] bg-[#0A0F1A]/80 backdrop-blur-sm"
            >
              <span className="text-2xl md:text-3xl font-bold text-[#C9A227] mb-1">{stat.value}</span>
              <span className="text-[#64748B] text-xs md:text-sm text-center">{t(stat.key as "stat_employees" | "stat_certificates" | "stat_agents" | "stat_countries")}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-[#C9A227]/40 flex items-start justify-center pt-2">
          <div className="w-1 h-3 rounded-full bg-[#C9A227]/60" />
        </div>
      </motion.div>
    </section>
  );
}
