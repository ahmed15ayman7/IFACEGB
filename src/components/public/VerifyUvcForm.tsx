"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, ArrowRight } from "lucide-react";

export function VerifyUvcForm() {
  const t = useTranslations("public.verify");
  const locale = useLocale();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uvc = code.trim();
    if (!uvc) {
      setErr(true);
      return;
    }
    setErr(false);
    router.push(`/${locale}/verify/${encodeURIComponent(uvc)}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label htmlFor="uvc" className="block text-xs font-medium text-[#A8B5C8] mb-2">
          {t("label")}
        </label>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            id="uvc"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-12 ps-10 pe-4 rounded-xl bg-[rgba(6,15,30,0.85)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)] font-mono"
            placeholder={t("placeholder")}
            autoComplete="off"
          />
        </div>
        {err && <p className="text-xs text-[#9C2A2A] mt-1">{t("required")}</p>}
      </div>
      <button
        type="submit"
        className="w-full h-12 rounded-xl bg-[#C9A227] text-[#060f1e] font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-[#e8c84a] transition-colors"
      >
        {t("cta")}
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
      </button>
      <p className="text-[#6e7d93] text-xs text-center leading-relaxed">{t("hint")}</p>
    </form>
  );
}
