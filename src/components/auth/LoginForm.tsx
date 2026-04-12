"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Loader2, Mail, Lock } from "lucide-react";

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res && !res.ok) {
        setError(t("error_default"));
        setPending(false);
        return;
      }
      window.location.assign(`/${locale}/dashboard`);
    } catch {
      setError(t("error_default"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <p className="text-sm text-[#9C2A2A] bg-[rgba(156,42,42,0.1)] border border-[rgba(156,42,42,0.25)] rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label className="block text-xs font-medium text-[#A8B5C8] mb-1.5">{t("email")}</label>
        <div className="relative">
          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full h-11 ps-10 pe-4 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] placeholder:text-[#6e7d93] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)] focus:ring-1 focus:ring-[rgba(201,162,39,0.3)] transition-all"
            placeholder={t("placeholder_email")}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-[#A8B5C8]">{t("password")}</label>
          <Link
            href={`/${locale}/auth/forgot-password`}
            className="text-xs text-[#C9A227] hover:text-[#e8c84a] transition-colors"
          >
            {t("forgot")}
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full h-11 ps-10 pe-4 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] placeholder:text-[#6e7d93] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)] focus:ring-1 focus:ring-[rgba(201,162,39,0.3)] transition-all"
            placeholder={t("placeholder_password")}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full h-11 rounded-lg bg-[#C9A227] text-[#060f1e] font-semibold text-sm hover:bg-[#e8c84a] active:scale-[0.98] transition-all shadow-[0_2px_16px_rgba(201,162,39,0.3)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {t("submit")}
      </button>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(201,162,39,0.1)]" />
        <span className="text-[#6e7d93] text-xs">{t("or")}</span>
        <div className="h-px flex-1 bg-[rgba(201,162,39,0.1)]" />
      </div>
      <p className="text-center text-sm text-[#6e7d93]">
        {t("no_account")}{" "}
        <Link href={`/${locale}/auth/register`} className="text-[#C9A227] hover:text-[#e8c84a] font-medium transition-colors">
          {t("register_link")}
        </Link>
      </p>
    </form>
  );
}
