import type { Metadata } from "next";
import { Tajawal, EB_Garamond, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth/auth.config";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import "../globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | iFACE Global",
    default: "iFACE Global — International Accreditation & Training",
  },
  description:
    "iFACE International Board for Accreditation and Certification Enterprises — empowering professionals worldwide.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://iface.global"),
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const session = await auth();

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${tajawal.variable} ${ebGaramond.variable} ${inter.variable} dark`}
    >
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider messages={messages}>
          <AuthSessionProvider>
            {session?.user ? (
              <SocketProvider
                userId={session.user.id}
                role={session.user.role}
                sectorId={session.user.sectorId}
              >
                {children}
              </SocketProvider>
            ) : (
              children
            )}
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
