import { generateSEOMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Newspaper } from "lucide-react";

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
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-12 rounded-full bg-[rgba(201,162,39,0.1)] border border-[rgba(201,162,39,0.2)] text-[#C9A227] mb-4">
          <Newspaper className="size-6" aria-hidden />
        </div>
        <h1 className="text-4xl font-bold text-[#C9A227] mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("title")}
        </h1>
        <p className="text-[#6e7d93] max-w-xl mx-auto text-sm">{t("subtitle")}</p>
      </div>

      <div className="space-y-4">
        {news.length === 0 ? (
          <p className="text-center text-[#6e7d93] py-16">{t("empty")}</p>
        ) : (
          news.map((item) => {
            const title = locale === "ar" ? (item.titleAr ?? item.titleEn) : item.titleEn;
            const bodyRaw =
              locale === "ar"
                ? (item.bodyAr ?? item.bodyEn)
                : item.bodyEn;
            const excerpt = stripHtml(bodyRaw).slice(0, 200);
            return (
              <article
                key={item.id}
                className="rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(10,31,61,0.4)] p-6 hover:border-[rgba(201,162,39,0.25)] transition-all"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-[#C9A227] font-semibold text-lg mb-2"
                      style={{ fontFamily: "var(--font-eb-garamond)" }}
                    >
                      {title}
                    </h2>
                    <p className="text-[#6e7d93] text-sm line-clamp-2">
                      {excerpt}
                      {excerpt.length >= 200 ? "…" : ""}
                    </p>
                  </div>
                  <span className="text-[#6e7d93] text-xs whitespace-nowrap">
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString(
                          locale === "ar" ? "ar-EG" : "en-GB",
                        )
                      : "—"}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
