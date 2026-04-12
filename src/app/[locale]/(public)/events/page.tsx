import { generateSEOMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";

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
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center">
        <h1
          className="text-4xl font-bold text-[#C9A227] mb-3"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          {t("title")}
        </h1>
        <p className="text-[#6e7d93] max-w-xl mx-auto text-sm">{t("subtitle")}</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#6e7d93]">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(10,31,61,0.4)] overflow-hidden hover:border-[rgba(201,162,39,0.3)] transition-all"
            >
              {event.coverUrl && (
                <div className="h-40 overflow-hidden">
                  <Image
                    src={event.coverUrl}
                    alt={event.titleEn}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                {event.isMega && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(201,162,39,0.15)] text-[#C9A227] border border-[rgba(201,162,39,0.3)] mb-2 inline-flex items-center gap-1">
                    <Sparkles className="size-3" aria-hidden />
                    {t("mega")}
                  </span>
                )}
                <h3
                  className="text-[#C9A227] font-semibold mb-1"
                  style={{ fontFamily: "var(--font-eb-garamond)" }}
                >
                  {locale === "ar" ? (event.titleAr ?? event.titleEn) : event.titleEn}
                </h3>
                <p className="text-[#6e7d93] text-xs flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 shrink-0 text-[#C9A227]/80" aria-hidden />
                    {new Date(event.startDate).toLocaleDateString(dateLocale)}
                  </span>
                  {event.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0 text-[#C9A227]/80" aria-hidden />
                      {event.location}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
