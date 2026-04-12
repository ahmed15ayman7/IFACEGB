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
  Layers,
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
    { href: `/${locale}#features`, label: t("features"), icon: Layers },
    { href: `/${locale}/about`, label: t("about"), icon: BookOpen },
    { href: `/${locale}/news`, label: t("news"), icon: Newspaper },
    { href: `/${locale}/events`, label: t("events"), icon: CalendarDays },
    { href: `/${locale}/verify`, label: t("verify"), icon: ShieldCheck },
    { href: `/${locale}/apply-agency`, label: t("apply_agency"), icon: UserPlus },
  ];

  const linkClass =
    "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] leading-none text-[#A8B5C8] transition-colors hover:bg-[rgba(201,162,39,0.08)] hover:text-[#C9A227]";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#060f1e]/95 backdrop-blur-md border-b border-[rgba(201,162,39,0.15)] shadow-[0_2px_20px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid h-16 grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] items-center gap-3 lg:gap-4">
          <Link href={`/${locale}`} className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Image
              src="/logo-dark.png"
              alt="iFACE Global"
              width={40}
              height={40}
              className="h-8 w-auto shrink-0 object-contain sm:h-9"
              priority
            />
            <span
              className="hidden min-w-0 truncate text-sm font-semibold tracking-wide text-[#C9A227] sm:block"
              style={{ fontFamily: "var(--font-eb-garamond)" }}
            >
              iFACE Global
            </span>
          </Link>

          <nav
            className="hidden min-w-0 justify-self-center lg:block"
            aria-label="Primary"
          >
            <div className="flex max-w-[52rem] items-center justify-center gap-0.5 overflow-x-auto overflow-y-visible py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className={linkClass}>
                    <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={switchLocale}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[rgba(201,162,39,0.22)] px-2.5 text-xs font-medium text-[#A8B5C8] transition-all hover:border-[rgba(201,162,39,0.45)] hover:text-[#C9A227]"
              aria-label={locale === "en" ? "العربية" : "English"}
            >
              <Globe className="size-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{locale === "en" ? "العربية" : "English"}</span>
            </button>

            <Link
              href={`/${locale}/auth/register`}
              className="hidden h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[rgba(201,162,39,0.35)] px-3 text-xs font-medium text-[#C9A227] transition-colors hover:bg-[rgba(201,162,39,0.08)] sm:inline-flex"
            >
              <UserPlus className="size-3.5 shrink-0" aria-hidden />
              {t("register")}
            </Link>

            <Link
              href={`/${locale}/auth/login`}
              className="hidden h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#C9A227] px-4 text-xs font-semibold text-[#060f1e] transition-colors hover:bg-[#e8c84a] sm:inline-flex"
            >
              <LogIn className="size-3.5 shrink-0" aria-hidden />
              {t("login")}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-[rgba(201,162,39,0.1)] pb-4 lg:hidden">
            <nav className="flex flex-col gap-0.5 pt-3" aria-label="Mobile primary">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm text-[#A8B5C8] hover:bg-[rgba(201,162,39,0.06)] hover:text-[#C9A227]"
                  >
                    <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href={`/${locale}/auth/register`}
                onClick={() => setMobileOpen(false)}
                className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-md border border-[rgba(201,162,39,0.3)] px-3 py-2 text-sm font-medium text-[#C9A227]"
              >
                <UserPlus className="size-4 shrink-0" aria-hidden />
                {t("register")}
              </Link>
              <Link
                href={`/${locale}/auth/login`}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#C9A227] px-3 py-2 text-sm font-semibold text-[#060f1e]"
              >
                <LogIn className="size-4 shrink-0" aria-hidden />
                {t("login")}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
