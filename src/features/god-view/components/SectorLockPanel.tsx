"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, Lock, Unlock, ChevronDown } from "lucide-react";

type Sector = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  color: string;
  isActive: boolean;
};

type SectorLockState = "idle" | "confirming" | "loading";

type SectorRowState = {
  locked: boolean;
  uiState: SectorLockState;
  reason: string;
  expanded: boolean;
};

export function SectorLockPanel({
  sectors,
  adminId,
}: {
  sectors: Sector[];
  adminId: string;
}) {
  const t = useTranslations("dashboard.godView");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [rows, setRows] = useState<Record<string, SectorRowState>>(() =>
    Object.fromEntries(
      sectors.map((s) => [
        s.code,
        { locked: false, uiState: "idle", reason: "", expanded: false },
      ])
    )
  );

  // Fetch current lock states from the API once on mount
  const fetchLockStates = useCallback(async () => {
    try {
      const res = await fetch("/api/kill-switch");
      if (!res.ok) return;
      const data: { lockedSectors?: string[] } = await res.json();
      const locked = new Set(data.lockedSectors ?? []);
      setRows((prev) => {
        const next = { ...prev };
        for (const code of Object.keys(next)) {
          next[code] = { ...next[code], locked: locked.has(code) };
        }
        return next;
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchLockStates();
  }, [fetchLockStates]);

  const setRow = (code: string, patch: Partial<SectorRowState>) =>
    setRows((prev) => ({ ...prev, [code]: { ...prev[code], ...patch } }));

  const toggleExpand = (code: string) =>
    setRow(code, { expanded: !rows[code].expanded, uiState: "idle" });

  async function confirmLock(code: string) {
    setRow(code, { uiState: "loading" });
    const res = await fetch("/api/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "sector",
        action: "lock",
        sectorCode: code,
        reason: rows[code].reason,
        adminId,
      }),
    });
    if (res.ok) {
      setRow(code, { locked: true, uiState: "idle", reason: "", expanded: false });
    } else {
      setRow(code, { uiState: "idle" });
    }
  }

  async function unlock(code: string) {
    setRow(code, { uiState: "loading" });
    const res = await fetch("/api/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "sector",
        action: "unlock",
        sectorCode: code,
        adminId,
      }),
    });
    if (res.ok) {
      setRow(code, { locked: false, uiState: "idle", reason: "", expanded: false });
    } else {
      setRow(code, { uiState: "idle" });
    }
  }

  const lockedCount = Object.values(rows).filter((r) => r.locked).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-[rgba(201,162,39,0.18)] bg-[rgba(6,15,30,0.7)] backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[rgba(201,162,39,0.12)]">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg flex items-center justify-center bg-[rgba(201,162,39,0.08)] border border-[rgba(201,162,39,0.2)]">
            <ShieldAlert className="size-5 text-[#C9A227]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[#C9A227] font-semibold text-sm">{t("sectorLockTitle")}</h3>
            <p className="text-[#6e7d93] text-xs mt-0.5 max-w-lg">{t("sectorLockSubtitle")}</p>
          </div>
        </div>

        {lockedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(156,42,42,0.15)] border border-[rgba(156,42,42,0.4)] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9C2A2A] animate-pulse" />
            <span className="text-[#9C2A2A] text-xs font-semibold">
              {lockedCount} locked
            </span>
          </div>
        )}
      </div>

      {/* Sector rows */}
      <div className="divide-y divide-[rgba(201,162,39,0.06)]">
        {sectors.map((sector) => {
          const row = rows[sector.code];
          if (!row) return null;
          const name = isRtl ? sector.nameAr : sector.nameEn;

          return (
            <div key={sector.code}>
              {/* Row main */}
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                {/* Left: color dot + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sector.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{name}</p>
                    <p className="text-[#6e7d93] text-xs font-mono">{sector.code}</p>
                  </div>
                </div>

                {/* Right: status + action */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status badge */}
                  {row.locked ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[rgba(156,42,42,0.15)] text-[#9C2A2A] border border-[rgba(156,42,42,0.35)]">
                      <Lock className="size-3" />
                      {t("sectorLockBadge")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[rgba(34,197,94,0.08)] text-green-400 border border-[rgba(34,197,94,0.25)]">
                      <ShieldCheck className="size-3" />
                      {t("sectorUnlockBadge")}
                    </span>
                  )}

                  {/* Toggle button */}
                  {row.locked ? (
                    <button
                      onClick={() => unlock(sector.code)}
                      disabled={row.uiState === "loading"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[rgba(201,162,39,0.3)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.08)] disabled:opacity-50 transition-all"
                    >
                      <Unlock className="size-3" />
                      {row.uiState === "loading" ? t("sectorUnlocking") : t("sectorUnlockBtn")}
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleExpand(sector.code)}
                      disabled={row.uiState === "loading"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(156,42,42,0.15)] text-[#9C2A2A] hover:bg-[rgba(156,42,42,0.25)] border border-[rgba(156,42,42,0.35)] disabled:opacity-50 transition-all"
                    >
                      <Lock className="size-3" />
                      {t("sectorLockBtn")}
                      <ChevronDown
                        className={`size-3 transition-transform ${row.expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* Confirm lock panel */}
              <AnimatePresence>
                {row.expanded && !row.locked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 bg-[rgba(156,42,42,0.04)] border-t border-[rgba(156,42,42,0.12)] space-y-3">
                      <div>
                        <label className="block text-xs text-[#A8B5C8] mb-1">
                          {t("sectorLockReason")}
                        </label>
                        <input
                          type="text"
                          value={row.reason}
                          onChange={(e) => setRow(sector.code, { reason: e.target.value })}
                          placeholder={t("sectorLockReasonPh")}
                          className="w-full h-9 px-3 rounded-lg bg-[rgba(6,15,30,0.8)] border border-[rgba(201,162,39,0.2)] text-[#A8B5C8] text-sm focus:outline-none focus:border-[rgba(201,162,39,0.5)] placeholder:text-white/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmLock(sector.code)}
                          disabled={row.uiState === "loading"}
                          className="flex-1 h-9 text-xs font-semibold rounded-lg bg-[#9C2A2A] text-white hover:bg-[#c43535] disabled:opacity-50 transition-colors"
                        >
                          {row.uiState === "loading" ? t("sectorLocking") : t("sectorLockConfirm")}
                        </button>
                        <button
                          onClick={() => setRow(sector.code, { expanded: false, reason: "" })}
                          className="px-4 h-9 text-xs rounded-lg border border-[rgba(201,162,39,0.2)] text-[#6e7d93] hover:text-[#A8B5C8]"
                        >
                          {t("killCancel")}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
