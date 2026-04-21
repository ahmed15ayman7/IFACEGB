"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Users, Zap, DollarSign, Cpu, GraduationCap, Heart, Truck, Leaf,
  Building2, UtensilsCrossed, Megaphone, Scale, Factory, ShoppingCart,
  Brain, Dumbbell, Palette, Shield, ShieldAlert, Atom, Home, Briefcase,
  type LucideIcon,
} from "lucide-react";

interface Sector {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  color: string | null;
  iconUrl: string | null;
}

interface SectorsDirectoryProps {
  sectors: Sector[];
}

const SECTOR_ICON_MAP: Record<string, { Icon: LucideIcon; color: string }> = {
  hr:           { Icon: Users,          color: "#C9A227" },
  energy:       { Icon: Zap,            color: "#22C55E" },
  finance:      { Icon: DollarSign,     color: "#C9A227" },
  tech:         { Icon: Cpu,            color: "#60A5FA" },
  education:    { Icon: GraduationCap,  color: "#A78BFA" },
  healthcare:   { Icon: Heart,          color: "#F87171" },
  transport:    { Icon: Truck,          color: "#FB923C" },
  agriculture:  { Icon: Leaf,           color: "#4ADE80" },
  engineering:  { Icon: Building2,      color: "#94A3B8" },
  hospitality:  { Icon: UtensilsCrossed,color: "#F472B6" },
  marketing:    { Icon: Megaphone,      color: "#C9A227" },
  legal:        { Icon: Scale,          color: "#A8B5C8" },
  industry:     { Icon: Factory,        color: "#94A3B8" },
  ecommerce:    { Icon: ShoppingCart,   color: "#34D399" },
  "mental-health": { Icon: Brain,       color: "#C084FC" },
  sports:       { Icon: Dumbbell,       color: "#FB923C" },
  arts:         { Icon: Palette,        color: "#F472B6" },
  security:     { Icon: Shield,         color: "#F87171" },
  defense:      { Icon: ShieldAlert,    color: "#6B7280" },
  nuclear:      { Icon: Atom,           color: "#22D3EE" },
  "real-estate":{ Icon: Home,           color: "#C9A227" },
  consulting:   { Icon: Briefcase,      color: "#A8B5C8" },
  // fallbacks for existing sector codes
  training:     { Icon: GraduationCap,  color: "#A78BFA" },
  accreditation:{ Icon: ShieldAlert,    color: "#C9A227" },
  technology:   { Icon: Cpu,            color: "#60A5FA" },
  partnerships: { Icon: Users,          color: "#22C55E" },
  consultancy:  { Icon: Briefcase,      color: "#A8B5C8" },
};

const FALLBACK = { Icon: Briefcase, color: "#C9A227" };

export function SectorsDirectory({ sectors }: SectorsDirectoryProps) {
  const t = useTranslations("landing.sectors_dir");
  const tLanding = useTranslations("landing");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const displaySectors = sectors.length > 0 ? sectors : [];

  return (
    <section id="sectors" className="py-20 bg-[#020817]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#C9A227] text-xs font-semibold uppercase tracking-widest mb-3 block">
            {t("kicker")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" dir={isRTL ? "rtl" : "ltr"}>
            {t("title")}
          </h2>
          <p className="text-[#64748B] max-w-2xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Sectors grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-10">
          {displaySectors.map((sector, i) => {
            const { Icon, color } = SECTOR_ICON_MAP[sector.code] ?? FALLBACK;
            const sectorColor = sector.color ?? color;
            const name = locale === "ar" && sector.nameAr ? sector.nameAr : sector.nameEn;

            return (
              <motion.div
                key={sector.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.03 }}
                className="group relative flex flex-col items-center gap-3 p-4 rounded-xl border border-[#1E293B] bg-[#0A0F1A] hover:border-opacity-60 transition-all cursor-pointer overflow-hidden"
                style={{ "--sector-color": sectorColor } as React.CSSProperties}
              >
                {/* Glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                  style={{ boxShadow: `inset 0 0 20px ${sectorColor}30` }}
                />

                {/* Icon circle */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${sectorColor}20`, border: `1px solid ${sectorColor}40` }}
                >
                  <Icon size={22} style={{ color: sectorColor }} />
                </div>

                {/* Name */}
                <span
                  className="text-xs font-semibold text-center leading-tight"
                  style={{ color: sectorColor }}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {name}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-[#C9A227] hover:text-[#E6B830] font-medium transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
