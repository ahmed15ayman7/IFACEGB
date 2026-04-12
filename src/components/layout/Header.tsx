"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Globe,
  LogIn,
  UserPlus,
  Newspaper,
  CalendarDays,
  Building2,
  ShieldCheck,
  Home,
  BookOpen,
} from "lucide-react";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  function switchLocale() {
    const next = locale === "en" ? "ar" : "en";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) segments[0] = next;
    router.push("/" + segments.join("/"));
  }

  const navLinks: { href: string; label: string; icon: typeof Home }[] = [
    { href: `/${locale}`, label: t("home"), icon: Home },
    { href: `/${locale}#sectors`, label: t("sectors"), icon: Building2 },
    { href: `/${locale}/about`, label: t("about"), icon: BookOpen },
    { href: `/${locale}/news`, label: t("news"), icon: Newspaper },
    { href: `/${locale}/events`, label: t("events"), icon: CalendarDays },
    { href: `/${locale}/verify`, label: t("verify"), icon: ShieldCheck },
    { href: `/${locale}/apply-agency`, label: t("apply_agency"), icon: UserPlus },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#060f1e]/95 backdrop-blur-md border-b border-[rgba(201,162,39,0.15)] shadow-[0_2px_20px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href={`/${locale}`} className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo-dark.png"
              alt="iFACE Global"
              width={40}
              height={40}
              className="w-auto h-9 object-contain"
              priority
            />
            <span
              className="hidden sm:block text-[#C9A227] font-semibold tracking-wide text-sm"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              iFACE Global
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 flex-wrap justify-end max-w-3xl">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-[#A8B5C8] hover:text-[#C9A227] transition-colors rounded-md hover:bg-[rgba(201,162,39,0.06)]"
                >
                  <Icon className="size-3.5 opacity-70 shrink-0" aria-hidden />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={switchLocale}
              className="h-8 px-2.5 sm:px-3 text-xs font-medium text-[#A8B5C8] hover:text-[#C9A227] border border-[rgba(201,162,39,0.2)] hover:border-[rgba(201,162,39,0.5)] rounded-md transition-all inline-flex items-center gap-1.5"
              aria-label={locale === "en" ? "العربية" : "English"}
            >
              <Globe className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">{locale === "en" ? "العربية" : "English"}</span>
            </button>

            <Link
              href={`/${locale}/auth/register`}
              className="hidden sm:inline-flex h-8 px-3 text-xs font-medium items-center justify-center rounded-md border border-[rgba(201,162,39,0.35)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.08)] gap-1.5"
            >
              <UserPlus className="size-3.5" aria-hidden />
              {t("register")}
            </Link>

            <Link
              href={`/${locale}/auth/login`}
              className="hidden sm:inline-flex h-8 px-4 text-xs font-semibold items-center justify-center rounded-md bg-[#C9A227] text-[#060f1e] hover:bg-[#e8c84a] transition-colors gap-1.5"
            >
              <LogIn className="size-3.5" aria-hidden />
              {t("login")}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md border border-[rgba(201,162,39,0.2)] text-[#A8B5C8]"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-4 border-t border-[rgba(201,162,39,0.1)] mt-1">
            <nav className="flex flex-col gap-0.5 pt-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#A8B5C8] hover:text-[#C9A227] rounded-md hover:bg-[rgba(201,162,39,0.06)]"
                  >
                    <Icon className="size-4 opacity-70" aria-hidden />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href={`/${locale}/auth/register`}
                onClick={() => setMobileOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-[#C9A227] border border-[rgba(201,162,39,0.3)] rounded-md"
              >
                <UserPlus className="size-4" aria-hidden />
                {t("register")}
              </Link>
              <Link
                href={`/${locale}/auth/login`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#060f1e] bg-[#C9A227] rounded-md"
              >
                <LogIn className="size-4" aria-hidden />
                {t("login")}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
