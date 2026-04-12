import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { UserPlus } from "lucide-react";
import { generateSEOMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata("register", locale as "en" | "ar");
}

export default async function RegisterPage() {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

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
          <Link href={`/${locale}`} className="inline-flex items-center justify-center mb-4">
            <Image
              src="/logo-dark.png"
              alt={tCommon("brand")}
              width={56}
              height={56}
              className="w-14 h-14 object-contain"
            />
          </Link>
          <div className="inline-flex items-center justify-center size-10 rounded-full bg-[rgba(201,162,39,0.12)] border border-[rgba(201,162,39,0.25)] text-[#C9A227] mb-3 mx-auto">
            <UserPlus className="size-5" aria-hidden />
          </div>
          <h1
            className="text-2xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("register_title")}
          </h1>
          <p className="text-[#6e7d93] text-sm mt-1">{t("register_subtitle")}</p>
        </div>

        <div className="rounded-2xl border border-[rgba(201,162,39,0.18)] bg-[rgba(10,31,61,0.6)] backdrop-blur-md p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
