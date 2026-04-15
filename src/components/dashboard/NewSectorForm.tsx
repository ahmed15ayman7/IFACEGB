"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const COLORS = [
  "#C9A227",
  "#1A6FA8",
  "#0D9488",
  "#7C3AED",
  "#DC2626",
  "#16A34A",
  "#EA580C",
  "#0891B2",
];

export default function NewSectorForm() {
  const t = useTranslations("dashboard.sectors");
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState({
    code: "",
    nameEn: "",
    nameAr: "",
    description: "",
    color: "#C9A227",
    sortOrder: 0,
    targetRevPct: 0,
    isActive: true,
    createWallet: true,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/sectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder),
          targetRevPct: Number(form.targetRevPct),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setErrorMsg(t("error_code"));
        } else {
          setErrorMsg(t("error_generic"));
        }
        setStatus("error");
        return;
      }
      setStatus("success");
      setTimeout(() => {
        router.push(`/${locale}/sector/${data.code}`);
        router.refresh();
      }, 1200);
    } catch {
      setErrorMsg(t("error_generic"));
      setStatus("error");
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Basic Info */}
      <section className="bg-[#0d1929] border border-white/10 rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold text-base">{t("new_title")}</h2>

        {/* Code */}
        <div>
          <label className="block text-sm text-[#A8B5C8] mb-1">{t("field_code")} *</label>
          <input
            type="text"
            required
            value={form.code}
            onChange={(e) => set("code", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="e.g. training"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#C9A227]/60"
          />
          <p className="text-xs text-white/30 mt-1">{t("field_code_hint")}</p>
        </div>

        {/* Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#A8B5C8] mb-1">{t("field_name_en")} *</label>
            <input
              type="text"
              required
              value={form.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#C9A227]/60"
            />
          </div>
          <div>
            <label className="block text-sm text-[#A8B5C8] mb-1">{t("field_name_ar")} *</label>
            <input
              type="text"
              required
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#C9A227]/60"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-[#A8B5C8] mb-1">{t("field_description")}</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#C9A227]/60 resize-none"
          />
        </div>
      </section>

      {/* Appearance & Settings */}
      <section className="bg-[#0d1929] border border-white/10 rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold text-base">Appearance & Settings</h2>

        {/* Color picker */}
        <div>
          <label className="block text-sm text-[#A8B5C8] mb-2">{t("field_color")}</label>
          <div className="flex flex-wrap gap-3 items-center">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: form.color === c ? "#fff" : "transparent",
                  transform: form.color === c ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
            {/* Custom hex input */}
            <input
              type="text"
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
              maxLength={7}
              className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#C9A227]/60"
            />
            <span
              className="w-7 h-7 rounded-lg border border-white/20"
              style={{ backgroundColor: form.color }}
            />
          </div>
        </div>

        {/* Sort order & target rev */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#A8B5C8] mb-1">{t("field_sort")}</label>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.valueAsNumber || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A227]/60"
            />
          </div>
          <div>
            <label className="block text-sm text-[#A8B5C8] mb-1">
              {t("field_target_rev")}
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={form.targetRevPct}
              onChange={(e) => set("targetRevPct", e.target.valueAsNumber || 0)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A227]/60"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set("isActive", !form.isActive)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.isActive ? "bg-[#C9A227]" : "bg-white/20"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0"}`}
              />
            </div>
            <span className="text-sm text-[#A8B5C8]">{t("field_active")}</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set("createWallet", !form.createWallet)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.createWallet ? "bg-[#C9A227]" : "bg-white/20"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.createWallet ? "translate-x-5" : "translate-x-0"}`}
              />
            </div>
            <span className="text-sm text-[#A8B5C8]">{t("field_wallet")}</span>
          </label>
        </div>
      </section>

      {/* Feedback */}
      {status === "error" && (
        <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{errorMsg}</p>
      )}
      {status === "success" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-green-400 text-sm bg-green-500/10 rounded-xl px-4 py-3"
        >
          {t("success")}
        </motion.p>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="px-8 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {status === "loading" ? t("saving") : t("save")}
        </button>
      </div>
    </motion.form>
  );
}
