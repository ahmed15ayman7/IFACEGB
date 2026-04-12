import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign-in error | iFACE",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  const key =
    error === "AccessDenied"
      ? "error_access_denied"
      : error === "Configuration"
        ? "error_configuration"
        : error === "Verification"
          ? "error_verification"
          : "error_default";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-md text-center">
        <Link href={`/${locale}`}>
          <Image
            src="/logo-dark.png"
            alt="iFACE"
            width={48}
            height={48}
            className="w-12 h-12 object-contain mx-auto mb-6"
          />
        </Link>
        <div className="inline-flex items-center justify-center size-14 rounded-full bg-[rgba(156,42,42,0.15)] border border-[rgba(156,42,42,0.35)] text-[#c43535] mb-4">
          <AlertTriangle className="size-7" aria-hidden />
        </div>
        <h1
          className="text-xl font-bold text-[#C9A227] mb-2"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          {t("error_title")}
        </h1>
        <p className="text-[#A8B5C8] text-sm mb-8 leading-relaxed">{t(key)}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-[#C9A227] text-[#060f1e] font-semibold text-sm"
          >
            {t("login_link")}
          </Link>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg border border-[rgba(201,162,39,0.3)] text-[#C9A227] text-sm"
          >
            <Home className="size-4" aria-hidden />
            {tCommon("back_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
