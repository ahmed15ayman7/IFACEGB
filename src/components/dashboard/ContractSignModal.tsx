"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FileSignature, X, CheckCircle2 } from "lucide-react";

type Props = {
  contractId: string;
  contractTitle: string;
  onClose: () => void;
};

export function ContractSignModal({ contractId, contractTitle, onClose }: Props) {
  const t = useTranslations("dashboard.employeeContracts");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sign() {
    setLoading(true);
    setError(null);
    try {
      const ip = await fetch("https://api.ipify.org?format=json").then((r) => r.json()).then((d) => d.ip).catch(() => null);
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, ipAddress: ip }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? t("sign_error"));
      }
      setDone(true);
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sign_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          className="w-full max-w-md rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[#060f1e] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 text-[#C9A227]">
              <FileSignature className="size-5" aria-hidden />
              <h2 className="text-base font-semibold">{t("sign_confirm_title")}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#6e7d93] hover:text-[#A8B5C8] transition-colors"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <p className="text-sm text-[#A8B5C8] mb-2 font-medium">{contractTitle}</p>
          <p className="text-xs text-[#6e7d93] mb-5 leading-relaxed">{t("sign_confirm_body")}</p>

          {done && (
            <div className="flex items-center gap-2 text-[#22c55e] text-sm mb-4">
              <CheckCircle2 className="size-4" aria-hidden />
              {t("sign_success")}
            </div>
          )}

          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-[rgba(168,181,200,0.2)] text-sm text-[#6e7d93] hover:text-[#A8B5C8] transition-colors"
            >
              {t("sign_cancel")}
            </button>
            <button
              onClick={sign}
              disabled={loading || done}
              className="flex-1 h-10 rounded-lg bg-[rgba(201,162,39,0.9)] text-sm font-semibold text-[#060f1e] hover:bg-[#C9A227] transition-all disabled:opacity-60"
            >
              {loading ? "Signing…" : t("sign_confirm")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
