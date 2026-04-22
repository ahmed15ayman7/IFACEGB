import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { Sparkles } from "lucide-react";
import { generateSEOMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("login", locale as "en" | "ar");
}

type LoginProps = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: LoginProps) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const sp = await searchParams;
  const showDisabled = sp.error === "disabled";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(201,162,39,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-block">
            <Image
              src="/logo-dark.png"
              alt={tCommon("brand")}
              width={64}
              height={64}
              className="w-16 h-16 object-contain mx-auto mb-4"
            />
          </Link>
          <h1
            className="text-2xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("login_title")}
          </h1>
          <p className="text-[#6e7d93] text-sm mt-1">{t("login_subtitle")}</p>
        </div>

        {showDisabled && (
          <p className="mb-4 text-center text-sm text-amber-400/95 px-2">{t("login_error_disabled")}</p>
        )}
        <div className="rounded-2xl border border-[rgba(201,162,39,0.18)] bg-[rgba(10,31,61,0.6)] backdrop-blur-md p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <LoginForm />
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[rgba(201,162,39,0.35)] text-xs tracking-widest">
          <Sparkles className="size-3.5" aria-hidden />
          <span>iFACE GLOBAL</span>
          <Sparkles className="size-3.5" aria-hidden />
        </div>
      </div>
    </div>
  );
}
