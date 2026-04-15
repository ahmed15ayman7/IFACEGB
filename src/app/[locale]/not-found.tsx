import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { Home, LayoutDashboard, Headset } from "lucide-react";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "not_found" });

  return (
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center px-6">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,162,39,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orb */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06] blur-3xl bg-[#C9A227]" />

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Code number */}
        <p
          className="text-[7rem] sm:text-[9rem] font-extrabold leading-none select-none"
          style={{
            background: "linear-gradient(135deg, #C9A227 30%, #e8c547 70%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t("code")}
        </p>

        {/* Divider line */}
        <div className="mx-auto w-24 h-px bg-gradient-to-r from-transparent via-[#C9A227]/50 to-transparent my-6" />

        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t("title")}</h1>
        <p className="text-[#6e7d93] text-sm sm:text-base leading-relaxed mb-10">
          {t("description")}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            {t("back_home")}
          </Link>

          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 font-medium text-sm transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            {t("go_dashboard")}
          </Link>

          <Link
            href={`mailto:support@ifacegb.com`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 font-medium text-sm transition-all"
          >
            <Headset className="w-4 h-4" />
            {t("contact_support")}
          </Link>
        </div>

        {/* iFACE brand */}
        <p className="mt-14 text-xs text-white/20 tracking-widest uppercase">
          iFACE Global OS
        </p>
      </div>
    </div>
  );
}
