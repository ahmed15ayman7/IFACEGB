"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { MapPin, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface EventItem {
  id: string;
  titleEn: string;
  titleAr: string | null;
  location: string | null;
  startDate: string;
  eventType: string;
  coverUrl: string | null;
}

interface EventsSectionProps {
  events: EventItem[];
}

const EVENT_TYPE_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  conference: { bg: "#92400E20", text: "#C9A227" },
  workshop:   { bg: "#1E40AF20", text: "#60A5FA" },
  exhibition: { bg: "#6D28D920", text: "#A78BFA" },
  ceremony:   { bg: "#78350F20", text: "#FCD34D" },
  forum:      { bg: "#14532D20", text: "#4ADE80" },
  summit:     { bg: "#7F1D1D20", text: "#F87171" },
};

const FALLBACK_EVENT = { bg: "#1E293B", text: "#94A3B8" };

export function EventsSection({ events }: EventsSectionProps) {
  const t = useTranslations("landing.events");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const dateLocale = locale === "ar" ? ar : undefined;

  if (events.length === 0) return null;

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
            {t("kicker")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" dir={isRTL ? "rtl" : "ltr"}>
            {t("title")}
          </h2>
          <p className="text-[#64748B] max-w-2xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Events grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => {
            const typeStyle = EVENT_TYPE_COLOR_MAP[event.eventType] ?? FALLBACK_EVENT;
            const title = locale === "ar" && event.titleAr ? event.titleAr : event.titleEn;
            const date = new Date(event.startDate);
            const dayNum = format(date, "d");
            const monthName = format(date, locale === "ar" ? "MMM" : "MMM", { locale: dateLocale });

            let typeLabelKey = event.eventType as "conference" | "workshop" | "exhibition" | "ceremony" | "forum" | "summit";
            let typeLabel = event.eventType;
            try {
              typeLabel = t(typeLabelKey);
            } catch {
              typeLabel = event.eventType;
            }

            return (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group flex gap-4 p-5 rounded-xl border border-[#1E293B] bg-[#0A0F1A] hover:border-[#C9A227]/30 transition-all"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {/* Date pill */}
                <div
                  className="flex flex-col items-center justify-center min-w-[52px] h-16 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: typeStyle.bg, border: `1px solid ${typeStyle.text}40` }}
                >
                  <span className="text-2xl font-bold leading-none" style={{ color: typeStyle.text }}>{dayNum}</span>
                  <span className="text-[10px] font-medium uppercase" style={{ color: typeStyle.text }}>{monthName}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Type badge */}
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mb-2"
                    style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                  >
                    {typeLabel}
                  </span>

                  {/* Title */}
                  <h3 className="text-white text-sm font-semibold leading-snug mb-2 line-clamp-2">
                    {title}
                  </h3>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-center gap-1 text-[#64748B] text-xs">
                      <MapPin size={11} />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
