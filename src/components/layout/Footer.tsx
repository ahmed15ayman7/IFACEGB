import Image from "next/image";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { FileText, Mail, Shield, Newspaper, CalendarDays, Info, Handshake } from "lucide-react";

export async function Footer() {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const currentYear = new Date().getFullYear();

  const explore = [
    { href: `/${locale}/about`, label: t("links.about"), icon: Info },
    { href: `/${locale}/news`, label: t("links.news"), icon: Newspaper },
    { href: `/${locale}/events`, label: t("links.events"), icon: CalendarDays },
    { href: `/${locale}/verify`, label: t("links.verify"), icon: Shield },
    { href: `/${locale}/apply-agency`, label: t("links.agency"), icon: Handshake },
  ] as const;

  const legal = [
    { href: `/${locale}/privacy`, label: t("links.privacy"), icon: FileText },
    { href: `/${locale}/terms`, label: t("links.terms"), icon: FileText },
    { href: `/${locale}/contact`, label: t("links.contact"), icon: Mail },
  ] as const;

  return (
    <footer className="border-t border-[rgba(201,162,39,0.12)] mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 flex flex-col gap-3 max-w-md">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-dark.png"
                alt="iFACE Global"
                width={36}
                height={36}
                className="w-auto h-8 object-contain"
              />
              <span
                className="text-[#C9A227] font-semibold"
                style={{ fontFamily: "var(--font-eb-garamond)" }}
              >
                iFACE Global
              </span>
            </div>
            <p className="text-[#6e7d93] text-sm leading-relaxed">{t("tagline")}</p>
          </div>

          <div className="md:col-span-3">
            <p className="text-[#C9A227] text-xs font-semibold uppercase tracking-wider mb-3">
              {t("explore")}
            </p>
            <ul className="space-y-2">
              {explore.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 text-sm text-[#6e7d93] hover:text-[#C9A227] transition-colors"
                  >
                    <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-[#C9A227] text-xs font-semibold uppercase tracking-wider mb-3">
              {t("legal_section")}
            </p>
            <ul className="space-y-2">
              {legal.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 text-sm text-[#6e7d93] hover:text-[#C9A227] transition-colors"
                  >
                    <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[rgba(201,162,39,0.08)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[#6e7d93] text-xs text-center sm:text-start">
            © {currentYear} iFACE International Board. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
