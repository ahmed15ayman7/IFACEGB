"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Circle } from "lucide-react";

type KillSwitchStatus = "idle" | "confirming" | "loading" | "active";

export function GodViewKillSwitch({ adminId }: { adminId: string }) {
  const t = useTranslations("dashboard.godView");
  const [status, setStatus] = useState<KillSwitchStatus>("idle");
  const [cosignerEmail, setCosignerEmail] = useState("");
  const [reason, setReason] = useState("");

  async function activate() {
    if (!reason.trim()) return;
    setStatus("loading");

    const res = await fetch("/api/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, cosignerEmail, action: "activate", adminId }),
    });

    if (res.ok) setStatus("active");
    else setStatus("idle");
  }

  async function deactivate() {
    setStatus("loading");
    const res = await fetch("/api/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate", adminId }),
    });
    if (res.ok) setStatus("idle");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-[rgba(156,42,42,0.3)] bg-[rgba(156,42,42,0.05)] p-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center shrink-0" aria-hidden>
            <Circle className="size-7 fill-[#9C2A2A] text-[#9C2A2A]" strokeWidth={1.5} />
          </span>
          <div>
            <h3 className="text-[#C9A227] font-semibold text-sm">{t("killTitle")}</h3>
            <p className="text-[#6e7d93] text-xs">{t("killSubtitle")}</p>
          </div>
        </div>

        {status === "idle" && (
          <button
            type="button"
            onClick={() => setStatus("confirming")}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[rgba(156,42,42,0.8)] text-white hover:bg-[#9C2A2A] transition-colors border border-[rgba(156,42,42,0.5)]"
          >
            {t("killActivate")}
          </button>
        )}

        {status === "active" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(156,42,42,0.2)] border border-[rgba(156,42,42,0.5)]">
              <span className="w-2 h-2 rounded-full bg-[#9C2A2A] animate-pulse" />
              <span className="text-[#9C2A2A] text-xs font-medium">{t("killActive")}</span>
            </div>
            <button
              type="button"
              onClick={deactivate}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[rgba(201,162,39,0.3)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.1)]"
            >
              {t("killDeactivate")}
            </button>
          </div>
        )}
      </div>

      {status === "confirming" && (
        <div className="mt-4 space-y-3 border-t border-[rgba(156,42,42,0.2)] pt-4">
          <div>
            <label className="block text-xs text-[#A8B5C8] mb-1">{t("killReasonLabel")}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={t("killReasonPlaceholder")}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A8B5C8] mb-1">{t("killCosignerLabel")}</label>
            <input
              type="email"
              value={cosignerEmail}
              onChange={(e) => setCosignerEmail(e.target.value)}
              placeholder={t("killCosignerPlaceholder")}
              className="w-full h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={activate}
              disabled={!reason.trim() || (status as string) === "loading"}
              className="flex-1 h-9 text-xs font-semibold rounded-lg bg-[#9C2A2A] text-white hover:bg-[#c43535] disabled:opacity-50 transition-colors"
            >
              {(status as string) === "loading" ? t("killActivating") : t("killConfirm")}
            </button>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="px-4 h-9 text-xs rounded-lg border border-[rgba(201,162,39,0.2)] text-[#6e7d93] hover:text-[#A8B5C8]"
            >
              {t("killCancel")}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
