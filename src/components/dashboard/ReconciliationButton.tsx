"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

export function ReconciliationButton() {
  const t = useTranslations("dashboard.finance");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function run() {
    if (!window.confirm(t("reconciliation_confirm"))) return;
    setLoading(true);
    try {
      await fetch("/api/reconciliation", { method: "POST" });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={loading || done}
      className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-[rgba(201,162,39,0.3)] text-[#C9A227] bg-[rgba(201,162,39,0.08)] hover:bg-[rgba(201,162,39,0.14)] transition-all disabled:opacity-50"
    >
      <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
      {loading ? t("reconciliation_running") : done ? t("reconciliation_success") : t("reconciliation_run")}
    </button>
  );
}
