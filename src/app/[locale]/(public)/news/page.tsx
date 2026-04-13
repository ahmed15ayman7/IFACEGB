import { generateSEOMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Newspaper } from "lucide-react";
import { PublicShell, PublicPageHeader, PublicFadeIn, PublicGlowCard } from "@/components/public/motion";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("news", locale as "en" | "ar");
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export default async function NewsPage() {
  const locale = await getLocale();
  const t = await getTranslations("public.news");

  type NewsItem = {
    id: string;
    titleEn: string;
    titleAr: string | null;
    bodyEn: string;
    bodyAr: string | null;
    publishedAt: Date | null;
  };
  let news: NewsItem[] = [];
  try {
    news = await prisma.ifaceNews.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 20,
    });
  } catch {
    // DB not configured
  }

  return (
    <PublicShell className="py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <PublicPageHeader title={t("title")} subtitle={t("subtitle")}>
          <Newspaper className="size-7 sm:size-8" strokeWidth={1.25} aria-hidden />
        </PublicPageHeader>

        <div className="space-y-4">
          {news.length === 0 ? (
            <PublicFadeIn>
              <p className="py-16 text-center text-sm text-[#6e7d93]">{t("empty")}</p>
            </PublicFadeIn>
          ) : (
            news.map((item, i) => {
              const title = locale === "ar" ? (item.titleAr ?? item.titleEn) : item.titleEn;
              const bodyRaw = locale === "ar" ? (item.bodyAr ?? item.bodyEn) : item.bodyEn;
              const excerpt = stripHtml(bodyRaw).slice(0, 220);
              return (
                <PublicGlowCard key={item.id} delay={i * 0.04} className="group border-s-2 border-s-[rgba(201,162,39,0.35)] p-0">
                  <Link href={`/${locale}/news/${item.id}`} className="block">
                    <article className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                      <div className="min-w-0 flex-1">
                        <h2
                          className="mb-2 text-lg font-semibold text-[#C9A227] transition-colors group-hover:text-[#e8c84a] sm:text-xl"
                          style={{ fontFamily: "var(--font-eb-garamond)" }}
                        >
                          {title}
                        </h2>
                        <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-[#6e7d93]">
                          {excerpt}
                          {excerpt.length >= 220 ? "…" : ""}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C9A227] opacity-70 transition-opacity group-hover:opacity-100">
                          {t("read_article")}
                          <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
                        </span>
                      </div>
                      <time
                        dateTime={item.publishedAt?.toISOString()}
                        className="shrink-0 text-xs text-[#6e7d93] sm:pt-1 sm:text-end"
                      >
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString(
                              locale === "ar" ? "ar-EG" : "en-GB",
                              { day: "numeric", month: "short", year: "numeric" }
                            )
                          : "—"}
                      </time>
                    </article>
                  </Link>
                </PublicGlowCard>
              );
            })
          )}
        </div>
      </div>
    </PublicShell>
  );
}
