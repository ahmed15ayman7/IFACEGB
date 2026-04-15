"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { RotateCcw, Home, AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: ErrorPageProps) {
  const t = useTranslations("error");
  const locale = useLocale();

  useEffect(() => {
    // Log to an error reporting service if integrated
    console.error("[iFACE OS Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#060f1e] flex items-center justify-center px-6">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,162,39,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Red glow for error feel */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.05] blur-3xl bg-red-500" />

      <motion.div
        className="relative z-10 text-center max-w-lg w-full"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center border border-red-500/20 bg-red-500/10">
          <AlertTriangle className="w-9 h-9 text-red-400" strokeWidth={1.5} />
        </div>

        {/* Code */}
        <p
          className="text-[5rem] font-extrabold leading-none select-none mb-2"
          style={{
            background: "linear-gradient(135deg, #ef4444 30%, #f97316 70%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t("code")}
        </p>

        {/* Divider */}
        <div className="mx-auto w-24 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent my-5" />

        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t("title")}</h1>
        <p className="text-[#6e7d93] text-sm sm:text-base leading-relaxed mb-2">
          {t("description")}
        </p>

        {/* Error digest (for debugging in production) */}
        {error.digest && (
          <p className="text-xs text-white/20 mt-1 mb-8 font-mono">
            {t("error_id")}: {error.digest}
          </p>
        )}

        {!error.digest && <div className="mb-8" />}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" />
            {t("try_again")}
          </button>

          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 font-medium text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            {t("back_home")}
          </Link>
        </div>

        {/* Brand */}
        <p className="mt-14 text-xs text-white/20 tracking-widest uppercase">
          iFACE Global OS
        </p>
      </motion.div>
    </div>
  );
}
