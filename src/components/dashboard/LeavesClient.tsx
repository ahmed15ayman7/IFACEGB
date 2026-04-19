"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Loader2, CheckCircle2, AlertCircle,
  CalendarRange, Clock, CheckCheck, XCircle, Ban,
} from "lucide-react";

type HrRequestType =
  | "annual_leave" | "casual_leave" | "sick_leave" | "unpaid_leave"
  | "absence_justification" | "grievance" | "remote_work" | "other";

type Request = {
  id: string;
  type: HrRequestType;
  status: string;
  startDate: string | null;
  endDate: string | null;
  details: string | null;
  createdAt: string;
};

const TYPES: HrRequestType[] = [
  "annual_leave", "casual_leave", "sick_leave", "unpaid_leave",
  "remote_work", "absence_justification", "grievance", "other",
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  pending:   { color: "#C9A227", bg: "rgba(201,162,39,0.12)",  icon: Clock },
  approved:  { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   icon: CheckCheck },
  rejected:  { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: XCircle },
  cancelled: { color: "#6e7d93", bg: "rgba(110,125,147,0.12)", icon: Ban },
};

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export function LeavesClient({ initial }: { initial: Request[] }) {
  const t = useTranslations("dashboard.leave");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [requests, setRequests] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    type: "annual_leave" as HrRequestType,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    details: "",
  });
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const reload = useCallback(async () => {
    const res = await fetch("/api/hr-requests");
    if (res.ok) setRequests(await res.json());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("loading");
    setSubmitError("");
    try {
      const res = await fetch("/api/hr-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { setSubmitState("error"); setSubmitError(t("error")); return; }
      setSubmitState("success");
      setForm({ type: "annual_leave", startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), details: "" });
      await reload();
      setTimeout(() => { setShowForm(false); setSubmitState("idle"); }, 1500);
    } catch { setSubmitState("error"); setSubmitError(t("error")); }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    const res = await fetch(`/api/hr-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    if (res.ok) await reload();
    setCancelling(null);
  };

  const days =
    form.startDate && form.endDate ? daysBetween(form.startDate, form.endDate) : 0;

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#C9A227]/50 transition-colors";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{t("title")}</h1>
          <p className="text-sm text-[#6e7d93] mt-0.5">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setSubmitState("idle"); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] font-semibold text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          {t("new_request")}
        </button>
      </div>

      {/* New Request Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-[#0d1929] border border-[rgba(201,162,39,0.2)] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-sm">{t("new_request")}</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("type_label")} *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as HrRequestType }))}
                  className={inputClass}
                >
                  {TYPES.map((tp) => (
                    <option key={tp} value={tp} className="bg-[#0d1929]">
                      {t(`type_${tp}` as Parameters<typeof t>[0])}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("start_date")} *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("end_date")} *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Days badge */}
              {days > 0 && (
                <p className="text-xs text-[#C9A227] flex items-center gap-1.5">
                  <CalendarRange className="size-3.5" />
                  {t("days_count", { count: days })}
                </p>
              )}

              {/* Details */}
              <div>
                <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("details")}</label>
                <textarea
                  rows={2}
                  value={form.details}
                  onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                  placeholder={t("details_ph")}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Feedback */}
              {submitState === "error" && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="size-3.5" /> {submitError}
                </div>
              )}
              {submitState === "success" && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle2 className="size-3.5" /> {t("success")}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-xs border border-white/10 text-white/50 hover:text-white transition"
                >
                  {t("cancel_btn")}
                </button>
                <button
                  type="submit"
                  disabled={submitState === "loading" || submitState === "success"}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] hover:opacity-90 disabled:opacity-50 transition"
                >
                  {submitState === "loading" && <Loader2 className="size-3 animate-spin" />}
                  {submitState === "loading" ? t("submitting") : t("submit")}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request History */}
      <div>
        <h2 className="text-sm font-semibold text-[#C9A227] mb-4">{t("history_title")}</h2>

        {requests.length === 0 ? (
          <div className="text-center py-14 text-[#6e7d93] text-sm">{t("empty")}</div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const typeKey = `type_${req.type}` as Parameters<typeof t>[0];

              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0d1929] border border-white/[0.07] rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    {/* Left */}
                    <div className="flex items-start gap-3">
                      <div
                        className="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: cfg.bg }}
                      >
                        <StatusIcon className="size-4" style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {t(typeKey)}
                        </p>
                        {req.startDate && req.endDate && (
                          <p className="text-xs text-[#6e7d93] mt-0.5 flex items-center gap-1">
                            <CalendarRange className="size-3" />
                            {new Date(req.startDate).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })}
                            {" → "}
                            {new Date(req.endDate).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })}
                            <span className="text-[#C9A227] font-medium ms-1">
                              ({daysBetween(req.startDate, req.endDate)} {isRtl ? "أيام" : "days"})
                            </span>
                          </p>
                        )}
                        {req.details && (
                          <p className="text-xs text-white/30 mt-1 line-clamp-1">{req.details}</p>
                        )}
                        <p className="text-[10px] text-white/20 mt-1">
                          {new Date(req.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    {/* Right: status + cancel */}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
                      >
                        {t(`status_${req.status}` as Parameters<typeof t>[0])}
                      </span>
                      {req.status === "pending" && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          disabled={cancelling === req.id}
                          className="text-xs px-3 py-1 rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 transition disabled:opacity-50"
                        >
                          {cancelling === req.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            t("cancel_btn")
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
