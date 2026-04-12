"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Settings, User, Globe, Lock, Loader2 } from "lucide-react";

const TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
] as const;

export type AccountSettingsInitial = {
  email: string;
  name: string | null;
  nameAr: string | null;
  locale: string;
  timezone: string;
};

export function AccountSettingsForm({ initial }: { initial: AccountSettingsInitial }) {
  const t = useTranslations("dashboard.settings");
  const localeUi = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { update } = useSession();

  const timezoneOptions = useMemo(() => {
    const list = [...TIMEZONES];
    if (initial.timezone && !list.includes(initial.timezone as (typeof TIMEZONES)[number])) {
      return [initial.timezone, ...list];
    }
    return list;
  }, [initial.timezone]);

  const [name, setName] = useState(initial.name ?? "");
  const [nameAr, setNameAr] = useState(initial.nameAr ?? "");
  const [localePref, setLocalePref] = useState(initial.locale === "ar" ? "ar" : "en");
  const [timezone, setTimezone] = useState(initial.timezone || "UTC");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setStatus("err");
        setMessage(t("password_mismatch"));
        return;
      }
    }

    setStatus("saving");
    try {
      const body: Record<string, string> = {
        name: name.trim(),
        nameAr: nameAr.trim(),
        locale: localePref,
        timezone,
      };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setStatus("err");
        setMessage(json.error === "Current password is incorrect" ? t("wrong_password") : t("save_error"));
        return;
      }

      await update({
        name: name.trim() || null,
        nameAr: nameAr.trim() || null,
        locale: localePref,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("ok");
      setMessage(t("saved"));

      if (localePref !== localeUi) {
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length > 0) segments[0] = localePref;
        router.push("/" + segments.join("/"));
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setStatus("err");
      setMessage(t("save_error"));
    }
  }

  const field =
    "w-full rounded-lg border border-[rgba(201,162,39,0.2)] bg-[rgba(6,15,30,0.6)] px-3 py-2 text-sm text-[#A8B5C8] placeholder:text-[#6e7d93] focus:border-[rgba(201,162,39,0.45)] focus:outline-none focus:ring-1 focus:ring-[rgba(201,162,39,0.25)]";
  const label = "block text-xs font-medium text-[#6e7d93] mb-1.5";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-8">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[rgba(201,162,39,0.1)] border border-[rgba(201,162,39,0.2)] text-[#C9A227]">
          <Settings className="size-6" aria-hidden />
        </span>
        <div>
          <h1
            className="text-2xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("title")}
          </h1>
          <p className="text-sm text-[#6e7d93]">{t("subtitle")}</p>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.4)] p-5">
        <div className="flex items-center gap-2 text-[#C9A227] text-sm font-semibold">
          <User className="size-4" aria-hidden />
          {t("section_profile")}
        </div>
        <div>
          <label className={label} htmlFor="email">
            {t("email")}
          </label>
          <input id="email" type="email" className={field} value={initial.email} disabled readOnly />
          <p className="mt-1 text-[11px] text-[#6e7d93]">{t("email_hint")}</p>
        </div>
        <div>
          <label className={label} htmlFor="name">
            {t("name_en")}
          </label>
          <input
            id="name"
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            minLength={1}
          />
        </div>
        <div>
          <label className={label} htmlFor="nameAr">
            {t("name_ar")}
          </label>
          <input
            id="nameAr"
            className={field}
            dir="rtl"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            autoComplete="off"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.4)] p-5">
        <div className="flex items-center gap-2 text-[#C9A227] text-sm font-semibold">
          <Globe className="size-4" aria-hidden />
          {t("section_language")}
        </div>
        <div>
          <label className={label} htmlFor="locale">
            {t("interface_language")}
          </label>
          <select
            id="locale"
            className={field}
            value={localePref}
            onChange={(e) => setLocalePref(e.target.value)}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
          <p className="mt-1 text-[11px] text-[#6e7d93]">{t("language_hint")}</p>
        </div>
        <div>
          <label className={label} htmlFor="timezone">
            {t("timezone")}
          </label>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              id="timezone"
              className={`${field} flex-1 min-w-[200px]`}
              value={timezoneOptions.includes(timezone) ? timezone : timezoneOptions[0]}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.4)] p-5">
        <div className="flex items-center gap-2 text-[#C9A227] text-sm font-semibold">
          <Lock className="size-4" aria-hidden />
          {t("section_security")}
        </div>
        <div>
          <label className={label} htmlFor="currentPassword">
            {t("current_password")}
          </label>
          <input
            id="currentPassword"
            type="password"
            className={field}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className={label} htmlFor="newPassword">
            {t("new_password")}
          </label>
          <input
            id="newPassword"
            type="password"
            className={field}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        <div>
          <label className={label} htmlFor="confirmPassword">
            {t("confirm_password")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={field}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p className="mt-1 text-[11px] text-[#6e7d93]">{t("password_optional")}</p>
        </div>
      </section>

      {message && (
        <p
          className={`text-sm ${status === "ok" ? "text-emerald-400" : status === "err" ? "text-red-400" : "text-[#6e7d93]"}`}
          role="status"
        >
          {message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex items-center gap-2 rounded-lg bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-[#060f1e] hover:bg-[#e8c84a] disabled:opacity-60 transition-colors"
        >
          {status === "saving" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {status === "saving" ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
