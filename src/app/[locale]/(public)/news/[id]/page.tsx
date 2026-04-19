import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { PublicShell, PublicFadeIn } from "@/components/public/motion";

type Props = { params: Promise<{ id: string; locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  try {
    const article = await prisma.ifaceNews.findUnique({
      where: { id, isPublished: true },
      select: { titleEn: true, titleAr: true, bodyEn: true, bodyAr: true, imageUrl: true },
    });
    if (!article) return {};
    const title = locale === "ar" ? (article.titleAr ?? article.titleEn) : article.titleEn;
    const body = locale === "ar" ? (article.bodyAr ?? article.bodyEn) : article.bodyEn;
    const desc = body.replace(/<[^>]*>/g, "").slice(0, 155);
    return {
      title: `${title} | iFACE News`,
      description: desc,
      openGraph: article.imageUrl
        ? { images: [{ url: article.imageUrl }] }
        : undefined,
      alternates: {
        languages: {
          en: `/en/news/${id}`,
          ar: `/ar/news/${id}`,
        },
      },
    };
  } catch {
    return {};
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("public.news");
  const isRtl = locale === "ar";

  const article = await prisma.ifaceNews
    .findUnique({ where: { id, isPublished: true } })
    .catch(() => null);

  if (!article) notFound();

  const title = locale === "ar" ? (article.titleAr ?? article.titleEn) : article.titleEn;
  const body = locale === "ar" ? (article.bodyAr ?? article.bodyEn) : article.bodyEn;
  const dateLocale = locale === "ar" ? "ar-EG" : "en-GB";

  return (
    <PublicShell className="py-14 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <PublicFadeIn delay={0}>
          <Link
            href={`/${locale}/news`}
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

        {article.imageUrl && (
          <PublicFadeIn delay={0.04}>
            <div className="relative mb-10 aspect-[16/7] w-full overflow-hidden rounded-2xl border border-[rgba(201,162,39,0.15)] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
              <Image
                src={article.imageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060f1e]/60 via-transparent to-transparent" />
            </div>
          </PublicFadeIn>
        )}

        <PublicFadeIn delay={0.06}>
          <header className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.07)] px-3 py-1 text-xs font-medium text-[#C9A227]">
                <Newspaper className="size-3.5 shrink-0" aria-hidden />
                {t("title")}
              </span>
              {article.publishedAt && (
                <time
                  dateTime={article.publishedAt.toISOString()}
                  className="inline-flex items-center gap-1.5 text-xs text-[#6e7d93]"
                >
                  <CalendarDays className="size-3.5 shrink-0 text-[#C9A227]/70" aria-hidden />
                  {t("published")}{" "}
                  {new Date(article.publishedAt).toLocaleDateString(dateLocale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              )}
            </div>
            <h1
              className="text-2xl font-bold leading-tight text-[#C9A227] sm:text-3xl lg:text-4xl"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              {title}
            </h1>
          </header>
        </PublicFadeIn>

        <PublicFadeIn delay={0.1}>
          <div
            className="prose prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-[#e8c84a]
              prose-p:text-[#A8B5C8] prose-p:leading-relaxed
              prose-a:text-[#C9A227] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-[#e8c84a]
              prose-ul:text-[#A8B5C8] prose-ol:text-[#A8B5C8]
              prose-blockquote:border-l-[#C9A227] prose-blockquote:text-[#6e7d93]
              prose-hr:border-[rgba(201,162,39,0.15)]"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </PublicFadeIn>

        <PublicFadeIn delay={0.14}>
          <div className="mt-12 flex items-center justify-between border-t border-[rgba(201,162,39,0.1)] pt-8">
            <Link
              href={`/${locale}/news`}
              className="inline-flex items-center gap-2 rounded-lg border border-[rgba(201,162,39,0.25)] px-5 py-2.5 text-sm font-medium text-[#C9A227] transition-all hover:bg-[rgba(201,162,39,0.08)]"
            >
              {isRtl ? (
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              ) : (
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
              )}
              {t("back")}
            </Link>
          </div>
        </PublicFadeIn>
      </div>
    </PublicShell>
  );
}
