"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setSent(true);
    setPending(false);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center py-2">
        <p className="text-[#A8B5C8] text-sm leading-relaxed">{t("forgot_sent")}</p>
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center gap-2 text-sm text-[#C9A227] hover:text-[#e8c84a]"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("login_link")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-[#A8B5C8] mb-1.5">{t("email")}</label>
        <div className="relative">
          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-11 ps-10 pe-4 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)]"
            placeholder={t("placeholder_email")}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full h-11 rounded-lg bg-[#C9A227] text-[#060f1e] font-semibold text-sm hover:bg-[#e8c84a] disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {t("submit_forgot")}
      </button>
      <Link
        href={`/${locale}/auth/login`}
        className="flex items-center justify-center gap-2 text-sm text-[#6e7d93] hover:text-[#C9A227]"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t("login_link")}
      </Link>
    </form>
  );
}
