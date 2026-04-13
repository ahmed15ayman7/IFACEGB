"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  id: string;
  locale: string;
  statuses: string[];
};

export function IsrDetailClient({ id, locale, statuses }: Props) {
  const t = useTranslations("dashboard.isr");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  const STATUS_COLORS: Record<string, string> = {
    accepted: "#22c55e",
    rejected: "#ef4444",
    in_progress: "#3b82f6",
    resolved: "#C9A227",
    escalated: "#f97316",
  };

  async function handleAction(status: string) {
    setLoading(status);
    try {
      await fetch(`/api/isr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(resolution ? { resolution } : {}) }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.5)] p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#6e7d93] mb-1">{t("detail_resolution")}</label>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-[rgba(201,162,39,0.18)] bg-[rgba(6,15,30,0.7)] px-3 py-2 text-sm text-[#A8B5C8] placeholder-[#6e7d93] focus:outline-none focus:border-[rgba(201,162,39,0.55)]"
          placeholder="Optional resolution notes…"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const color = STATUS_COLORS[s] ?? "#A8B5C8";
          const isLoading = loading === s;
          const labelKey = `action_${s === "accepted" ? "accept" : s === "rejected" ? "reject" : s === "in_progress" ? "accept" : s === "resolved" ? "resolve" : "escalate"}` as Parameters<typeof t>[0];
          return (
            <button
              key={s}
              onClick={() => handleAction(s)}
              disabled={!!loading}
              className="text-xs font-semibold px-4 py-2 rounded-lg border transition-all disabled:opacity-50"
              style={{ color, borderColor: `${color}40`, background: isLoading ? `${color}18` : `${color}0a` }}
            >
              {isLoading ? t("action_processing") : t(labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
