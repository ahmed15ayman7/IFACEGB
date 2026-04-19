import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Sparkles, Mail } from "lucide-react";
import { PublicShell, PublicFadeIn } from "@/components/public/motion";

type Props = { params: Promise<{ id: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  try {
    const event = await prisma.ifaceEvent.findUnique({
      where: { id, isPublished: true },
      select: { titleEn: true, titleAr: true, descriptionEn: true, descriptionAr: true, coverUrl: true },
    });
    if (!event) return {};
    const title = locale === "ar" ? (event.titleAr ?? event.titleEn) : event.titleEn;
    const desc =
      locale === "ar"
        ? (event.descriptionAr ?? event.descriptionEn ?? "")
        : (event.descriptionEn ?? "");
    return {
      title: `${title} | iFACE Events`,
      description: desc.slice(0, 155),
      openGraph: event.coverUrl ? { images: [{ url: event.coverUrl }] } : undefined,
      alternates: {
        languages: { en: `/en/events/${id}`, ar: `/ar/events/${id}` },
      },
    };
  } catch {
    return {};
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("public.events");
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";

  const event = await prisma.ifaceEvent
    .findUnique({ where: { id, isPublished: true } })
    .catch(() => null);

  if (!event) notFound();

  const title = locale === "ar" ? (event.titleAr ?? event.titleEn) : event.titleEn;
  const description =
    locale === "ar"
      ? (event.descriptionAr ?? event.descriptionEn)
      : event.descriptionEn;

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString(dateLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <PublicShell className="py-14 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <PublicFadeIn delay={0}>
          <Link
            href={`/${locale}/events`}
            className="mb-8 inline-flex items-center gap-2 text-xs font-medium text-[#6e7d93] transition-colors hover:text-[#C9A227]"
          >
            {isRtl ? (
              <ArrowRight className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
            )}
            {t("back")}
          </Link>
        </PublicFadeIn>

        {event.coverUrl && (
          <PublicFadeIn delay={0.04}>
            <div className="relative mb-10 aspect-[16/7] w-full overflow-hidden rounded-2xl border border-[rgba(201,162,39,0.15)] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <Image
                src={event.coverUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060f1e]/70 via-transparent to-transparent" />
            </div>
          </PublicFadeIn>
        )}

        <PublicFadeIn delay={0.06}>
          <header className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {event.isMega && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(201,162,39,0.3)] bg-[rgba(201,162,39,0.12)] px-2.5 py-1 text-xs font-medium text-[#C9A227]">
                  <Sparkles className="size-3.5 shrink-0" aria-hidden />
                  {t("mega")}
                </span>
              )}
            </div>
            <h1
              className="mb-5 text-2xl font-bold leading-tight text-[#C9A227] sm:text-3xl lg:text-4xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {title}
            </h1>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-[rgba(201,162,39,0.14)] bg-[rgba(10,31,61,0.4)] p-5 backdrop-blur-sm sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#C9A227]" aria-hidden />
                <div>
                  <p className="mb-0.5 text-xs font-semibold text-[#C9A227]">{t("date_label")}</p>
                  <p className="text-sm text-[#A8B5C8]">{formatDate(event.startDate)}</p>
                  {event.endDate && (
                    <p className="text-xs text-[#6e7d93]">
                      {t("date_to")} {formatDate(event.endDate)}
                    </p>
                  )}
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[#C9A227]" aria-hidden />
                  <div>
                    <p className="mb-0.5 text-xs font-semibold text-[#C9A227]">{t("location_label")}</p>
                    <p className="text-sm text-[#A8B5C8]">{event.location}</p>
                  </div>
                </div>
              )}
            </div>
          </header>
        </PublicFadeIn>

        {description && (
          <PublicFadeIn delay={0.1}>
            <div className="prose prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-[#e8c84a]
              prose-p:text-[#A8B5C8] prose-p:leading-relaxed
              prose-a:text-[#C9A227] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[#e8c84a]
              prose-ul:text-[#A8B5C8] prose-ol:text-[#A8B5C8]
              prose-blockquote:border-l-[#C9A227] prose-blockquote:text-[#6e7d93]
              prose-hr:border-[rgba(201,162,39,0.15)]"
            >
              <p>{description}</p>
            </div>
          </PublicFadeIn>
        )}

        <PublicFadeIn delay={0.14}>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(201,162,39,0.1)] pt-8">
            <Link
              href={`/${locale}/events`}
              className="inline-flex items-center gap-2 rounded-lg border border-[rgba(201,162,39,0.25)] px-5 py-2.5 text-sm font-medium text-[#C9A227] transition-all hover:bg-[rgba(201,162,39,0.08)]"
            >
              {isRtl ? (
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              ) : (
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
              )}
              {t("back")}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[rgba(201,162,39,0.9)] px-7 text-sm font-semibold text-[#060f1e] shadow-[0_6px_24px_rgba(201,162,39,0.25)] transition-all hover:bg-[#C9A227]"
            >
              <Mail className="size-4 shrink-0" aria-hidden />
              {t("contact_cta")}
            </Link>
          </div>
        </PublicFadeIn>
      </div>
    </PublicShell>
  );
}
