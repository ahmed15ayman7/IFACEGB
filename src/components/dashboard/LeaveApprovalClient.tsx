"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCheck, XCircle, Clock, Ban, CalendarRange, ChevronDown,
  Loader2, User, Filter,
} from "lucide-react";
import Image from "next/image";

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
  requester: { name: string | null; nameAr: string | null; email: string; avatarUrl: string | null };
  employee: {
    employeeCode: string;
    jobTitleEn: string | null;
    sector: { nameEn: string; nameAr: string | null } | null;
  } | null;
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  pending:   { color: "#C9A227", bg: "rgba(201,162,39,0.12)",  icon: Clock },
  approved:  { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   icon: CheckCheck },
  rejected:  { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: XCircle },
  cancelled: { color: "#6e7d93", bg: "rgba(110,125,147,0.12)", icon: Ban },
};

const LEAVE_TYPES: HrRequestType[] = [
  "annual_leave", "casual_leave", "sick_leave", "unpaid_leave",
  "remote_work", "absence_justification", "grievance", "other",
];

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}

export function LeaveApprovalClient({ initial }: { initial: Request[] }) {
  const t = useTranslations("dashboard.leave");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [requests, setRequests] = useState(initial);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [processing, setProcessing] = useState<{ id: string; action: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const reload = useCallback(async (status: string, type: string) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    const res = await fetch(`/api/hr-requests?${params}`);
    if (res.ok) setRequests(await res.json());
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing({ id, action });
    const res = await fetch(`/api/hr-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: notes[id] ?? "" }),
    });
    if (res.ok) {
      setExpanded(null);
      await reload(statusFilter, typeFilter);
    }
    setProcessing(null);
  };

  const changeFilter = async (newStatus: string, newType: string) => {
    setStatusFilter(newStatus);
    setTypeFilter(newType);
    await reload(newStatus, newType);
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {t("admin_title")}
            {pendingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(201,162,39,0.15)] text-[#C9A227] border border-[rgba(201,162,39,0.3)] font-semibold">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-[#6e7d93] mt-0.5">{t("admin_subtitle")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="size-4 text-[#6e7d93]" />

        {/* Status tabs */}
        <div className="flex items-center bg-white/5 rounded-xl p-1 gap-0.5">
          {["pending", "approved", "rejected", "all"].map((s) => (
            <button
              key={s}
              onClick={() => changeFilter(s, typeFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-[rgba(201,162,39,0.18)] text-[#C9A227]"
                  : "text-[#6e7d93] hover:text-white"
              }`}
            >
              {s === "all" ? t("filter_status_all") : t(`status_${s}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => changeFilter(statusFilter, e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#A8B5C8] focus:outline-none focus:border-[#C9A227]/40"
        >
          <option value="all" className="bg-[#0d1929]">{t("filter_all")}</option>
          {LEAVE_TYPES.map((tp) => (
            <option key={tp} value={tp} className="bg-[#0d1929]">
              {t(`type_${tp}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="text-center py-16 text-[#6e7d93] text-sm">{t("admin_empty")}</div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const name = isRtl
              ? (req.requester.nameAr ?? req.requester.name ?? req.requester.email)
              : (req.requester.name ?? req.requester.email);
            const sectorName = req.employee?.sector
              ? (isRtl ? (req.employee.sector.nameAr ?? req.employee.sector.nameEn) : req.employee.sector.nameEn)
              : "—";
            const isOpen = expanded === req.id;

            return (
              <motion.div
                key={req.id}
                layout
                className="bg-[#0d1929] border border-white/[0.07] rounded-2xl overflow-hidden"
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer select-none"
                  onClick={() => setExpanded(isOpen ? null : req.id)}
                >
                  {/* Avatar */}
                  <div className="size-10 rounded-full border border-[rgba(201,162,39,0.2)] overflow-hidden bg-[rgba(201,162,39,0.06)] flex items-center justify-center shrink-0">
                    {req.requester.avatarUrl ? (
                      <Image src={req.requester.avatarUrl} alt={name ?? ""} width={40} height={40} className="object-cover" />
                    ) : (
                      <User className="size-5 text-[#C9A227]/50" strokeWidth={1.5} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-medium truncate">{name}</p>
                      <span className="text-[10px] text-white/30 font-mono">{req.employee?.employeeCode}</span>
                      <span className="text-[10px] text-white/25">{sectorName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <p className="text-xs text-[#6e7d93]">
                        {t(`type_${req.type}` as Parameters<typeof t>[0])}
                      </p>
                      {req.startDate && req.endDate && (
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <CalendarRange className="size-3" />
                          {new Date(req.startDate).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })}
                          {" – "}
                          {new Date(req.endDate).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })}
                          <span className="text-[#C9A227] font-medium">
                            ({daysBetween(req.startDate, req.endDate)}d)
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}25` }}
                    >
                      <StatusIcon className="size-3" />
                      {t(`status_${req.status}` as Parameters<typeof t>[0])}
                    </span>
                    <ChevronDown
                      className={`size-4 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {/* Expanded action panel */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-4">
                        {/* Employee note */}
                        {req.details && (
                          <div className="bg-white/[0.03] rounded-xl px-4 py-3">
                            <p className="text-xs text-[#6e7d93] mb-1">{t("details")}</p>
                            <p className="text-sm text-white/70">{req.details}</p>
                          </div>
                        )}

                        {req.status === "pending" && (
                          <>
                            {/* Note input */}
                            <div>
                              <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("note_label")}</label>
                              <input
                                type="text"
                                value={notes[req.id] ?? ""}
                                onChange={(e) =>
                                  setNotes((p) => ({ ...p, [req.id]: e.target.value }))
                                }
                                placeholder={t("note_ph")}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#C9A227]/40"
                              />
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction(req.id, "approve")}
                                disabled={!!processing}
                                className="flex-1 h-9 text-xs font-semibold rounded-xl bg-[rgba(34,197,94,0.15)] text-green-400 border border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.25)] disabled:opacity-50 transition inline-flex items-center justify-center gap-2"
                              >
                                {processing?.id === req.id && processing.action === "approve" ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <CheckCheck className="size-3.5" />
                                )}
                                {t("approve_btn")}
                              </button>
                              <button
                                onClick={() => handleAction(req.id, "reject")}
                                disabled={!!processing}
                                className="flex-1 h-9 text-xs font-semibold rounded-xl bg-[rgba(239,68,68,0.1)] text-red-400 border border-[rgba(239,68,68,0.25)] hover:bg-[rgba(239,68,68,0.2)] disabled:opacity-50 transition inline-flex items-center justify-center gap-2"
                              >
                                {processing?.id === req.id && processing.action === "reject" ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="size-3.5" />
                                )}
                                {t("reject_btn")}
                              </button>
                            </div>
                          </>
                        )}

                        {req.status !== "pending" && (
                          <p className="text-xs text-white/30 text-center py-2">
                            {t(`status_${req.status}` as Parameters<typeof t>[0])}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
