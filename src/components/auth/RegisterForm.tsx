"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mail, Lock, User } from "lucide-react";

export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("password_min"));
      return;
    }
    if (password !== confirm) {
      setError(t("password_mismatch"));
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) || t("register_error"));
        setPending(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("register_error"));
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-[#22c55e] text-sm">{t("register_success")}</p>
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex h-10 px-6 rounded-lg bg-[#C9A227] text-[#060f1e] font-semibold text-sm items-center justify-center"
        >
          {t("login_link")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <p className="text-sm text-[#9C2A2A] bg-[rgba(156,42,42,0.1)] border border-[rgba(156,42,42,0.25)] rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label className="block text-xs font-medium text-[#A8B5C8] mb-1.5">{t("full_name")}</label>
        <div className="relative">
          <User className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className="w-full h-11 ps-10 pe-4 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)]"
            placeholder={t("full_name")}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#A8B5C8] mb-1.5">{t("email")}</label>
        <div className="relative">
          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full h-11 ps-10 pe-4 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)]"
            placeholder={t("placeholder_email")}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#A8B5C8] mb-1.5">{t("password")}</label>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full h-11 ps-10 pe-4 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)]"
            placeholder={t("placeholder_password")}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#A8B5C8] mb-1.5">{t("password_confirm")}</label>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93]" aria-hidden />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full h-11 ps-10 pe-4 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)]"
            placeholder={t("placeholder_password")}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full h-11 rounded-lg bg-[#C9A227] text-[#060f1e] font-semibold text-sm hover:bg-[#e8c84a] disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {t("submit_register")}
      </button>
      <p className="text-center text-sm text-[#6e7d93]">
        {t("have_account")}{" "}
        <Link href={`/${locale}/auth/login`} className="text-[#C9A227] font-medium hover:text-[#e8c84a]">
          {t("login_link")}
        </Link>
      </p>
    </form>
  );
}
