"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

interface Partner {
  id: string;
  nameEn: string;
  nameAr: string | null;
  logoUrl: string | null;
}

interface PartnersSectionProps {
  partners: Partner[];
}

export function PartnersSection({ partners }: PartnersSectionProps) {
  const t = useTranslations("landing");
  const locale = useLocale();
  const isRTL = locale === "ar";

  if (partners.length === 0) return null;

  return (
    <section className="py-20 bg-[#020817]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#C9A227] text-xs font-semibold uppercase tracking-widest mb-3 block">
            {t("partners_kicker")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" dir={isRTL ? "rtl" : "ltr"}>
            {t("partners_title")}
          </h2>
          <p className="text-[#64748B] max-w-2xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
            {t("partners_subtitle")}
          </p>
        </motion.div>

        {/* Partners grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {partners.map((partner, i) => {
            const name = locale === "ar" && partner.nameAr ? partner.nameAr : partner.nameEn;
            const initial = name.charAt(0).toUpperCase();

            return (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#1E293B] bg-[#0A0F1A] hover:border-[#C9A227]/30 transition-all group"
              >
                {/* Logo or initial */}
                {partner.logoUrl ? (
                  <div className="w-12 h-12 relative">
                    <Image
                      src={partner.logoUrl}
                      alt={name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#C9A227]/15 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227] text-xl font-bold group-hover:bg-[#C9A227]/20 transition-colors">
                    {initial}
                  </div>
                )}
                <span className="text-[#94A3B8] text-[10px] text-center leading-tight line-clamp-2" dir={isRTL ? "rtl" : "ltr"}>
                  {name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
