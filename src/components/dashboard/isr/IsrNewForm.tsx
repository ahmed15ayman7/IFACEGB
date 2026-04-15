"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion/dashboard";
import { Send } from "lucide-react";

type Sector = { id: string; nameEn: string; nameAr: string | null };

type Props = {
  sectors: Sector[];
  /** Pre-set the sending sector (used when creating from inside a specific sector page) */
  fromSector?: Sector;
  /** Where to redirect after successful submission. Defaults to /isr */
  redirectTo?: string;
};

export function IsrNewForm({ sectors, fromSector, redirectTo }: Props) {
  const t = useTranslations("dashboard.isr");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();

  const [form, setForm] = useState({
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    type: "service",
    priority: "normal",
    toSectorId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const SLA_MAP: Record<string, string> = {
    urgent: "4 hours",
    high: "24 hours",
    normal: "72 hours",
    low: "7 days",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        ...(fromSector ? { fromSectorId: fromSector.id } : {}),
      };
      const res = await fetch("/api/isr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error");
      }
      setSuccess(true);
      const destination = redirectTo ?? `/${locale}/isr`;
      setTimeout(() => router.push(destination), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form_error"));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[rgba(201,162,39,0.18)] bg-[rgba(6,15,30,0.7)] px-3 py-2 text-sm text-[#A8B5C8] placeholder-[#6e7d93] focus:outline-none focus:border-[rgba(201,162,39,0.55)] focus:ring-1 focus:ring-[rgba(201,162,39,0.3)]";
  const labelCls = "block text-xs font-medium text-[#6e7d93] mb-1";

  if (success) {
    return (
      <motion.div {...fadeInUp} className="py-16 text-center">
        <p className="text-[#22c55e] font-semibold">{t("form_success")}</p>
      </motion.div>
    );
  }

  const fromSectorLabel = fromSector
    ? (isRtl ? (fromSector.nameAr ?? fromSector.nameEn) : fromSector.nameEn)
    : null;

  return (
    <motion.form {...fadeInUp} onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {fromSectorLabel && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-[rgba(201,162,39,0.15)] bg-[rgba(201,162,39,0.05)] text-[#6e7d93]">
          <span className="text-[#C9A227] font-medium">{t("detail_from")}:</span>
          <span className="text-[#A8B5C8] font-semibold">{fromSectorLabel}</span>
          <span className="ms-auto text-[10px] text-[#6e7d93] opacity-60">auto-filled</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t("form_title_en")} *</label>
          <input
            required
            className={inputCls}
            value={form.titleEn}
            onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelCls}>{t("form_title_ar")}</label>
          <input
            dir="rtl"
            className={inputCls}
            value={form.titleAr}
            onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>{t("form_desc_en")} *</label>
        <textarea
          required
          rows={4}
          className={inputCls}
          value={form.descriptionEn}
          onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelCls}>{t("form_desc_ar")}</label>
        <textarea
          dir="rtl"
          rows={3}
          className={inputCls}
          value={form.descriptionAr}
          onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>{t("form_type")} *</label>
          <select
            required
            className={inputCls}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            {["service", "support", "data_request", "collaboration", "compliance"].map((v) => (
              <option key={v} value={v}>{v.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("form_priority")}</label>
          <select
            className={inputCls}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          >
            {["urgent", "high", "normal", "low"].map((v) => (
              <option key={v} value={v}>{t(`priority_${v as "urgent" | "high" | "normal" | "low"}`)}</option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-[#6e7d93]">SLA: {SLA_MAP[form.priority]}</p>
        </div>
        <div>
          <label className={labelCls}>{t("form_target_sector")} *</label>
          <select
            required
            className={inputCls}
            value={form.toSectorId}
            onChange={(e) => setForm((f) => ({ ...f, toSectorId: e.target.value }))}
          >
            <option value="">—</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {isRtl ? (s.nameAr ?? s.nameEn) : s.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[rgba(201,162,39,0.9)] px-8 text-sm font-semibold text-[#060f1e] transition-all hover:bg-[#C9A227] disabled:opacity-60"
      >
        <Send className="size-4" aria-hidden />
        {loading ? t("form_submitting") : t("form_submit")}
      </button>
    </motion.form>
  );
}
