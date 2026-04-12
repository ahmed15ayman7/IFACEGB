"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check, Megaphone } from "lucide-react";

export function EDirectiveComposer({ authorId }: { authorId: string }) {
  const t = useTranslations("dashboard.godView");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [priority, setPriority] = useState("normal");
  const [targetType, setTargetType] = useState("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const targetOptions = useMemo(
    () =>
      [
        { value: "all", labelKey: "targetAll" as const },
        { value: "sector", labelKey: "targetSector" as const },
        { value: "employee", labelKey: "targetEmployee" as const },
        { value: "agent", labelKey: "targetAgent" as const },
      ] as const,
    [],
  );

  async function send() {
    if (!titleEn.trim() || !bodyEn.trim()) return;
    setSending(true);

    await fetch("/api/directives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleEn, titleAr, bodyEn, priority, targetType, authorId }),
    });

    setSent(true);
    setSending(false);
    setTimeout(() => {
      setSent(false);
      setTitleEn("");
      setTitleAr("");
      setBodyEn("");
    }, 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4 h-full"
    >
      <h3
        className="text-[#C9A227] font-semibold mb-4 flex items-center gap-2"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.15)]">
          <Megaphone className="size-4" aria-hidden />
        </span>
        {t("directiveTitle")}
      </h3>

      <div className="space-y-3">
        <input
          type="text"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          placeholder={t("directiveTitleEnPh")}
          className="w-full h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.4)]"
        />
        <input
          type="text"
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
          placeholder={t("directiveTitleArPh")}
          dir="rtl"
          className="w-full h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.4)]"
        />
        <textarea
          value={bodyEn}
          onChange={(e) => setBodyEn(e.target.value)}
          placeholder={t("directiveBodyPh")}
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.4)] resize-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-xs focus:outline-none"
          >
            <option value="low">{t("priorityLow")}</option>
            <option value="normal">{t("priorityNormal")}</option>
            <option value="high">{t("priorityHigh")}</option>
            <option value="urgent">{t("priorityUrgent")}</option>
          </select>

          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.15)] text-[#A8B5C8] text-xs focus:outline-none"
          >
            {targetOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={send}
          disabled={sending || !titleEn.trim() || !bodyEn.trim()}
          className="w-full h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            background: sent ? "#16a34a" : "rgba(201,162,39,0.9)",
            color: "#060f1e",
          }}
        >
          {sent ? (
            <span className="inline-flex items-center justify-center gap-1">
              <Check className="size-3.5" aria-hidden />
              {t("directiveSent")}
            </span>
          ) : sending ? (
            t("directiveSending")
          ) : (
            t("directiveSend")
          )}
        </button>
      </div>
    </motion.div>
  );
}
