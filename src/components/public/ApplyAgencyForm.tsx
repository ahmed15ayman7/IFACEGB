"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";

const schema = z.object({
  applicantName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  countryCode: z.string().min(2),
  businessName: z.string().optional(),
  motivation: z.string().min(50),
});

export function ApplyAgencyForm() {
  const t = useTranslations("public.applyAgency");
  const [form, setForm] = useState({
    applicantName: "",
    email: "",
    phone: "",
    countryCode: "",
    businessName: "",
    motivation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as string] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("loading");
    const res = await fetch("/api/apply-agency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setStatus(res.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[12rem] items-center justify-center py-8">
        <div className="max-w-md space-y-4 text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-[#22c55e] mx-auto">
            <CheckCircle2 className="size-9" aria-hidden />
          </div>
          <h2
            className="text-2xl font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("success_title")}
          </h2>
          <p className="text-[#6e7d93] text-sm leading-relaxed">{t("success_body")}</p>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-[rgba(201,162,39,0.2)] bg-[rgba(6,15,30,0.8)] px-3 text-sm text-[#A8B5C8] focus:border-[rgba(201,162,39,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,162,39,0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060f1e]";

  return (
    <div className="w-full">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs text-[#A8B5C8] mb-1">{t("applicantName")}</label>
          <input
            type="text"
            name="applicantName"
            value={form.applicantName}
            onChange={handleChange}
            className={`${inputClass} h-10`}
          />
          {errors.applicantName && (
            <p className="text-[#9C2A2A] text-xs mt-1">{errors.applicantName}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-[#A8B5C8] mb-1">{t("email")}</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={`${inputClass} h-10`}
          />
          {errors.email && <p className="text-[#9C2A2A] text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-xs text-[#A8B5C8] mb-1">{t("phone")}</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={`${inputClass} h-10`}
          />
        </div>
        <div>
          <label className="block text-xs text-[#A8B5C8] mb-1">{t("businessName")}</label>
          <input
            type="text"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            className={`${inputClass} h-10`}
          />
        </div>
        <div>
          <label className="block text-xs text-[#A8B5C8] mb-1">{t("country")}</label>
          <input
            type="text"
            name="countryCode"
            value={form.countryCode}
            onChange={handleChange}
            placeholder={t("country_placeholder")}
            className={`${inputClass} h-10`}
          />
          {errors.countryCode && (
            <p className="text-[#9C2A2A] text-xs mt-1">{errors.countryCode}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-[#A8B5C8] mb-1">
            {t("motivation")}{" "}
            <span className="text-[#6e7d93]">({t("motivation_hint")})</span>
          </label>
          <textarea
            name="motivation"
            value={form.motivation}
            onChange={handleChange}
            rows={5}
            className={`${inputClass} resize-none px-3 py-2`}
          />
          {errors.motivation && (
            <p className="text-[#9C2A2A] text-xs mt-1">{errors.motivation}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,162,39,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060f1e] disabled:opacity-50"
          style={{ background: "rgba(201,162,39,0.9)", color: "#060f1e" }}
        >
          {status === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {status === "loading" ? t("submitting") : t("submit")}
        </button>

        {status === "error" && (
          <p className="text-[#9C2A2A] text-xs text-center">{t("error")}</p>
        )}
      </form>
    </div>
  );
}
