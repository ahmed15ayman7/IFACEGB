"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Image from "next/image";

interface NewsItem {
  id: string;
  titleEn: string;
  titleAr: string | null;
  imageUrl: string | null;
  category: string;
  publishedAt: string;
}

interface NewsSectionProps {
  news: NewsItem[];
}

const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  expansion:    { bg: "#1E40AF20", text: "#60A5FA" },
  partnership:  { bg: "#6D28D920", text: "#A78BFA" },
  announcement: { bg: "#92400E20", text: "#C9A227" },
  award:        { bg: "#78350F20", text: "#FCD34D" },
  event:        { bg: "#14532D20", text: "#4ADE80" },
  report:       { bg: "#1E293B",   text: "#94A3B8" },
  news:         { bg: "#1E293B",   text: "#94A3B8" },
};

const FALLBACK_COLOR = { bg: "#1E293B", text: "#94A3B8" };

export function NewsSection({ news }: NewsSectionProps) {
  const t = useTranslations("landing.news");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const dateLocale = locale === "ar" ? ar : undefined;

  if (news.length === 0) return null;

  return (
    <section className="py-20 bg-[#030B15]">
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

        {/* News grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, i) => {
            const categoryStyle = CATEGORY_COLOR_MAP[item.category] ?? FALLBACK_COLOR;
            const title = locale === "ar" && item.titleAr ? item.titleAr : item.titleEn;
            const date = format(new Date(item.publishedAt), "d MMM yyyy", { locale: dateLocale });

            // Translate category label
            let categoryLabel = item.category;
            try {
              categoryLabel = t(item.category as "expansion" | "partnership" | "announcement" | "award" | "event_badge" | "report");
            } catch {
              categoryLabel = item.category;
            }

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative flex flex-col rounded-xl border border-[#1E293B] bg-[#0A0F1A] overflow-hidden hover:border-[#C9A227]/30 transition-all"
              >
                {/* Image or gradient placeholder */}
                {item.imageUrl ? (
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1A] to-transparent" />
                  </div>
                ) : (
                  <div className="h-2" style={{ background: `linear-gradient(90deg, ${categoryStyle.text}40, transparent)` }} />
                )}

                <div className="p-5 flex flex-col flex-1">
                  {/* Date + category row */}
                  <div className="flex items-center gap-2 mb-3" dir={isRTL ? "rtl" : "ltr"}>
                    <span className="text-[#64748B] text-xs">{date}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                    >
                      {categoryLabel}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-white font-semibold text-sm leading-snug mb-4 flex-1"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    {title}
                  </h3>

                  {/* Read more */}
                  <Link
                    href={`/news/${item.id}`}
                    className="text-[#C9A227] text-xs font-medium hover:text-[#E6B830] transition-colors"
                  >
                    {t("read_more")} →
                  </Link>
                </div>

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ boxShadow: "inset 0 0 30px rgba(201,162,39,0.05)" }} />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
