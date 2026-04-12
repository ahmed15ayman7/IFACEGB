import { generateSEOMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { PublicShell, PublicPageHeader, PublicFadeIn, PublicGlowCard } from "@/components/public/motion";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("events", locale as "en" | "ar");
}

export default async function EventsPage() {
  const locale = await getLocale();
  const t = await getTranslations("public.events");
  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";

  type EventItem = {
    id: string;
    titleEn: string;
    titleAr: string | null;
    startDate: Date;
    location: string | null;
    coverUrl: string | null;
    isMega: boolean;
  };
  let events: EventItem[] = [];
  try {
    events = await prisma.ifaceEvent.findMany({
      where: { isPublished: true },
      orderBy: { startDate: "asc" },
      take: 20,
    });
  } catch {
    // DB not configured yet
  }

  return (
    <PublicShell className="py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <PublicPageHeader title={t("title")} subtitle={t("subtitle")}>
          <CalendarDays className="size-7 sm:size-8" strokeWidth={1.25} aria-hidden />
        </PublicPageHeader>

        {events.length === 0 ? (
          <PublicFadeIn>
            <p className="py-20 text-center text-sm text-[#6e7d93]">{t("empty")}</p>
          </PublicFadeIn>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <PublicGlowCard key={event.id} delay={i * 0.05} className="group overflow-hidden p-0">
                {event.coverUrl ? (
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={event.coverUrl}
                      alt={locale === "ar" ? (event.titleAr ?? event.titleEn) : event.titleEn}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060f1e]/90 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-[rgba(201,162,39,0.12)] to-[rgba(10,31,61,0.6)]" />
                )}
                <div className="p-5">
                  {event.isMega && (
                    <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-[rgba(201,162,39,0.3)] bg-[rgba(201,162,39,0.12)] px-2 py-0.5 text-xs text-[#C9A227]">
                      <Sparkles className="size-3" aria-hidden />
                      {t("mega")}
                    </span>
                  )}
                  <h3
                    className="mb-2 font-semibold text-[#C9A227]"
                    style={{ fontFamily: "var(--font-eb-garamond)" }}
                  >
                    {locale === "ar" ? (event.titleAr ?? event.titleEn) : event.titleEn}
                  </h3>
                  <p className="flex flex-col gap-1.5 text-xs text-[#6e7d93]">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 shrink-0 text-[#C9A227]/80" aria-hidden />
                      {new Date(event.startDate).toLocaleDateString(dateLocale, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {event.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-[#C9A227]/80" aria-hidden />
                        {event.location}
                      </span>
                    )}
                  </p>
                </div>
              </PublicGlowCard>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
