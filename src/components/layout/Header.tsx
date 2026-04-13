"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Globe,
  LogIn,
  Newspaper,
  CalendarDays,
  Building2,
  ShieldCheck,
  Home,
  BookOpen,
  UserPlus,
} from "lucide-react";

const SECTORS: { key: string; href: string; labelEn: string; labelAr: string }[] = [
  { key: "training", href: "training", labelEn: "Training & Development", labelAr: "التدريب والتطوير" },
  { key: "accreditation", href: "accreditation", labelEn: "International Accreditation", labelAr: "الاعتماد الدولي" },
  { key: "consultancy", href: "consultancy", labelEn: "Consultancy & Excellence", labelAr: "الاستشارات والتميز" },
  { key: "tech", href: "tech", labelEn: "Tech Engine", labelAr: "محرك التقنية" },
  { key: "partnerships", href: "partnerships", labelEn: "Global Partnerships", labelAr: "الشراكات العالمية" },
];

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sectorsOpen, setSectorsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSectorsOpen(false);
  }, [pathname]);

  function switchLocale() {
    const next = locale === "en" ? "ar" : "en";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) segments[0] = next;
    router.push("/" + segments.join("/"));
  }

  const navLinks: { href: string; label: string; icon: typeof Home }[] = [
    { href: `/${locale}`, label: t("home"), icon: Home },
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
          ? "border-b border-[rgba(201,162,39,0.15)] bg-[#060f1e]/95 shadow-[0_2px_20px_rgba(0,0,0,0.4)] backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid h-16 grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] items-center gap-3 lg:gap-4">
          <Link href={`/${locale}`} className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Image
              src="/logo-dark.png"
              alt="iFACE Global"
              width={70}
              height={70}
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

          <nav className="hidden min-w-0 justify-self-center lg:block" aria-label="Primary">
            <div className="flex max-w-[54rem] items-center justify-center gap-0.5 overflow-x-auto overflow-y-visible py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className={linkClass}>
                    <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSectorsOpen((prev) => !prev)}
                  onBlur={() => setTimeout(() => setSectorsOpen(false), 150)}
                  className={`${linkClass} gap-1`}
                  aria-expanded={sectorsOpen}
                  aria-haspopup="true"
                >
                  <Building2 className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span>{t("sectors")}</span>
                  <svg
                    className={`size-3 shrink-0 transition-transform ${sectorsOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <AnimatePresence>
                  {sectorsOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute start-0 top-full mt-1.5 min-w-[200px] rounded-xl border border-[rgba(201,162,39,0.18)] bg-[#060f1e]/98 py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md"
                      role="menu"
                    >
                      {SECTORS.map((s) => (
                        <li key={s.key} role="none">
                          <Link
                            href={`/${locale}/sectors/${s.href}`}
                            role="menuitem"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#A8B5C8] transition-colors hover:bg-[rgba(201,162,39,0.06)] hover:text-[#C9A227]"
                          >
                            {locale === "ar" ? s.labelAr : s.labelEn}
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
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
              <span className="hidden sm:inline">{locale === "en" ? "ar" : "en"}</span>
            </button>

            <Link
              href={`/${locale}/auth/login`}
              className="hidden h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#C9A227] px-4 text-xs font-semibold text-[#060f1e] transition-colors hover:bg-[#e8c84a] sm:inline-flex"
            >
              <LogIn className="size-3.5 shrink-0" aria-hidden />
              {t("login")}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <AnimatePresence initial={false} mode="wait">
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -45, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 45, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="size-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ rotate: 45, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -45, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="size-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-[rgba(201,162,39,0.1)] lg:hidden"
            >
              <nav className="flex flex-col gap-0.5 py-3" aria-label="Mobile primary">
                {navLinks.map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <Link
                        href={link.href}
                        className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm text-[#A8B5C8] hover:bg-[rgba(201,162,39,0.06)] hover:text-[#C9A227]"
                      >
                        <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.04, duration: 0.2 }}
                  className="px-3 pt-1"
                >
                  <p className="mb-1 text-xs font-semibold text-[#C9A227]">{t("sectors")}</p>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((s) => (
                      <Link
                        key={s.key}
                        href={`/${locale}/sectors/${s.href}`}
                        className="rounded-lg border border-[rgba(201,162,39,0.18)] px-3 py-1.5 text-xs text-[#A8B5C8] hover:border-[rgba(201,162,39,0.38)] hover:text-[#C9A227]"
                      >
                        {locale === "ar" ? s.labelAr : s.labelEn}
                      </Link>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navLinks.length + 1) * 0.04, duration: 0.2 }}
                  className="mt-2 px-3"
                >
                  <Link
                    href={`/${locale}/auth/login`}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#C9A227] px-3 py-2 text-sm font-semibold text-[#060f1e]"
                  >
                    <LogIn className="size-4 shrink-0" aria-hidden />
                    {t("login")}
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
