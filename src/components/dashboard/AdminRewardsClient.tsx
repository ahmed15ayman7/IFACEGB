"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Loader2, CheckCircle2, AlertCircle,
  Coins, Target, Trophy, Star, ChevronDown,
  CheckCheck, XCircle, Banknote, Pencil,
} from "lucide-react";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────

type EmpOption = {
  id: string;               // employee.id
  userId: string;
  name: string;
  code: string;
  sector: string;
  kineticPoints: number;
  avatarUrl: string | null;
};

type Bonus = {
  id: string;
  type: string;
  amountCoins: number;
  reason: string | null;
  status: string;
  issuedAt: string;
  employee: {
    id: string;
    employeeCode: string;
    user: { name: string | null; nameAr: string | null; avatarUrl: string | null };
    sector: { nameEn: string; nameAr: string | null } | null;
  };
};

type PTarget = {
  id: string;
  period: string;
  targetValue: number;
  achievedValue: number;
  bonusPerUnit: number;
  isAchieved: boolean;
  createdAt: string;
  employee: {
    id: string;
    employeeCode: string;
    user: { name: string | null; nameAr: string | null; avatarUrl: string | null };
    sector: { nameEn: string; nameAr: string | null } | null;
  };
};

const BONUS_TYPES = ["performance", "referral", "project", "kpi", "other"] as const;

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  pending:  { color: "#C9A227", label: "Pending" },
  approved: { color: "#A8B5C8", label: "Approved" },
  paid:     { color: "#22c55e", label: "Paid" },
  rejected: { color: "#ef4444", label: "Rejected" },
};

const LEVELS = [
  { key: "bronze",   min: 0,    color: "#cd7f32" },
  { key: "silver",   min: 500,  color: "#A8B5C8" },
  { key: "gold",     min: 1500, color: "#C9A227" },
  { key: "platinum", min: 4000, color: "#e5e4e2" },
  { key: "legend",   min: 10000,color: "#b9f" },
];
function getLevel(pts: number) {
  return [...LEVELS].reverse().find((l) => pts >= l.min) ?? LEVELS[0];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function EmpSelect({
  employees,
  value,
  onChange,
  label,
}: {
  employees: EmpOption[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div>
      <label className="block text-xs text-[#A8B5C8] mb-1.5">{label} *</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A227]/50"
      >
        <option value="" className="bg-[#0d1929]">— Select —</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id} className="bg-[#0d1929]">
            {e.name} ({e.code}) — {e.sector}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AdminRewardsClient({
  initialBonuses,
  initialTargets,
  employees,
}: {
  initialBonuses: Bonus[];
  initialTargets: PTarget[];
  employees: EmpOption[];
}) {
  const t = useTranslations("dashboard.adminRewards");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [tab, setTab] = useState<"bonuses" | "targets" | "kinetic">("bonuses");
  const [bonuses, setBonuses] = useState(initialBonuses);
  const [targets, setTargets] = useState(initialTargets);
  const [processing, setProcessing] = useState<string | null>(null);

  // ── Reload helpers ──────────────────────────────────────────────────────
  const reloadBonuses = useCallback(async () => {
    const r = await fetch("/api/bonuses");
    if (r.ok) setBonuses(await r.json());
  }, []);

  const reloadTargets = useCallback(async () => {
    const r = await fetch("/api/performance-targets");
    if (r.ok) setTargets(await r.json());
  }, []);

  // ── Bonus actions ───────────────────────────────────────────────────────
  const bonusAction = async (id: string, action: "approve" | "pay" | "reject") => {
    setProcessing(id + action);
    const res = await fetch(`/api/bonuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) await reloadBonuses();
    setProcessing(null);
  };

  // ── Target actions ──────────────────────────────────────────────────────
  const markAchieved = async (id: string) => {
    setProcessing(id);
    const res = await fetch(`/api/performance-targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAchieved: true }),
    });
    if (res.ok) await reloadTargets();
    setProcessing(null);
  };

  const deleteTarget = async (id: string) => {
    setProcessing(id + "del");
    const res = await fetch(`/api/performance-targets/${id}`, { method: "DELETE" });
    if (res.ok) await reloadTargets();
    setProcessing(null);
  };

  // ── Tab content ─────────────────────────────────────────────────────────
  const tabs = [
    { key: "bonuses",  label: t("tab_bonuses"),  icon: Coins },
    { key: "targets",  label: t("tab_targets"),  icon: Target },
    { key: "kinetic",  label: t("tab_kinetic"),  icon: Trophy },
  ] as const;

  const empName = (e: Bonus["employee"] | PTarget["employee"]) =>
    isRtl ? (e.user.nameAr ?? e.user.name ?? "—") : (e.user.name ?? "—");

  const sectorName = (e: Bonus["employee"] | PTarget["employee"]) =>
    e.sector ? (isRtl ? (e.sector.nameAr ?? e.sector.nameEn) : e.sector.nameEn) : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{t("title")}</h1>
          <p className="text-sm text-[#6e7d93] mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-[rgba(201,162,39,0.18)] text-[#C9A227]"
                : "text-[#6e7d93] hover:text-white"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── BONUSES TAB ──────────────────────────────────────────────── */}
      {tab === "bonuses" && (
        <BonusesTab
          bonuses={bonuses}
          employees={employees}
          onAction={bonusAction}
          processing={processing}
          onRefresh={reloadBonuses}
          empName={empName}
          sectorName={sectorName}
          isRtl={isRtl}
          t={t}
        />
      )}

      {/* ── TARGETS TAB ──────────────────────────────────────────────── */}
      {tab === "targets" && (
        <TargetsTab
          targets={targets}
          employees={employees}
          onMarkAchieved={markAchieved}
          onDelete={deleteTarget}
          processing={processing}
          onRefresh={reloadTargets}
          empName={empName}
          sectorName={sectorName}
          isRtl={isRtl}
          t={t}
        />
      )}

      {/* ── KINETIC TAB ──────────────────────────────────────────────── */}
      {tab === "kinetic" && (
        <KineticTab employees={employees} isRtl={isRtl} t={t} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BONUSES TAB
// ─────────────────────────────────────────────────────────────────────────────

function BonusesTab({
  bonuses, employees, onAction, processing, onRefresh, empName, sectorName, isRtl, t,
}: {
  bonuses: Bonus[];
  employees: EmpOption[];
  onAction: (id: string, a: "approve" | "pay" | "reject") => void;
  processing: string | null;
  onRefresh: () => void;
  empName: (e: Bonus["employee"]) => string;
  sectorName: (e: Bonus["employee"]) => string;
  isRtl: boolean;
  t: ReturnType<typeof useTranslations<"dashboard.adminRewards">>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", type: "performance", amountCoins: "", reason: "" });
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("saving");
    const res = await fetch("/api/bonuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amountCoins: parseFloat(form.amountCoins) || 0 }),
    });
    if (res.ok) {
      setState("success");
      setForm({ employeeId: "", type: "performance", amountCoins: "", reason: "" });
      await onRefresh();
      setTimeout(() => { setShowForm(false); setState("idle"); }, 1200);
    } else {
      setState("error");
    }
  };

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A227]/50";

  return (
    <div className="space-y-5">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] font-semibold text-sm hover:opacity-90 transition"
        >
          <Plus className="size-4" /> {t("add_bonus")}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-[#0d1929] border border-[rgba(201,162,39,0.2)] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-sm">{t("bonus_form_title")}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/70">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <EmpSelect employees={employees} value={form.employeeId} onChange={(v) => setForm((p) => ({ ...p, employeeId: v }))} label={t("bonus_employee")} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("bonus_type")} *</label>
                  <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className={inp}>
                    {BONUS_TYPES.map((tp) => (
                      <option key={tp} value={tp} className="bg-[#0d1929]">{tp.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("bonus_amount")} *</label>
                  <input type="number" min={1} required value={form.amountCoins} onChange={(e) => setForm((p) => ({ ...p, amountCoins: e.target.value }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("bonus_reason")}</label>
                <input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder={t("bonus_reason_ph")} className={inp} />
              </div>
              {state === "error" && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="size-3" />{t("bonus_error")}</p>}
              {state === "success" && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="size-3" />{t("bonus_success")}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs border border-white/10 text-white/50 hover:text-white">Cancel</button>
                <button type="submit" disabled={state === "saving" || state === "success" || !form.employeeId} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] hover:opacity-90 disabled:opacity-50">
                  {state === "saving" && <Loader2 className="size-3 animate-spin" />}
                  {state === "saving" ? t("bonus_saving") : t("bonus_save")}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {bonuses.length === 0 ? (
        <p className="text-center py-12 text-white/30 text-sm">{t("empty_bonuses")}</p>
      ) : (
        <div className="space-y-2">
          {bonuses.map((b) => {
            const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
            return (
              <div key={b.id} className="bg-[#0d1929] border border-white/[0.07] rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                {/* Left */}
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-[rgba(201,162,39,0.08)] border border-[rgba(201,162,39,0.2)] overflow-hidden flex items-center justify-center shrink-0">
                    {b.employee.user.avatarUrl
                      ? <Image src={b.employee.user.avatarUrl} alt="" width={36} height={36} className="object-cover" />
                      : <span className="text-[#C9A227] text-xs font-bold">{(empName(b.employee)[0] ?? "?").toUpperCase()}</span>}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{empName(b.employee)}</p>
                    <p className="text-xs text-[#6e7d93]">{sectorName(b.employee)} · <span className="font-mono">{b.employee.employeeCode}</span></p>
                  </div>
                </div>

                {/* Center */}
                <div className="text-center">
                  <p className="text-[#C9A227] font-bold font-mono">+{b.amountCoins.toLocaleString()} <span className="text-xs text-white/30">coins</span></p>
                  <p className="text-xs text-white/40 capitalize">{b.type.replace("_", " ")}</p>
                  {b.reason && <p className="text-[11px] text-white/25 truncate max-w-[180px]">{b.reason}</p>}
                </div>

                {/* Right: status + actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                    {cfg.label}
                  </span>
                  {b.status === "pending" && (
                    <>
                      <button onClick={() => onAction(b.id, "approve")} disabled={processing === b.id + "approve"} className="h-8 px-3 text-xs rounded-lg bg-[rgba(168,181,200,0.12)] text-[#A8B5C8] hover:text-white border border-[rgba(168,181,200,0.2)] disabled:opacity-50 flex items-center gap-1">
                        {processing === b.id + "approve" ? <Loader2 className="size-3 animate-spin" /> : <CheckCheck className="size-3" />}{t("approve_bonus")}
                      </button>
                      <button onClick={() => onAction(b.id, "reject")} disabled={!!processing} className="h-8 px-3 text-xs rounded-lg bg-[rgba(239,68,68,0.08)] text-red-400 border border-[rgba(239,68,68,0.2)] disabled:opacity-50 flex items-center gap-1">
                        <XCircle className="size-3" />{t("reject_bonus")}
                      </button>
                    </>
                  )}
                  {b.status === "approved" && (
                    <button onClick={() => onAction(b.id, "pay")} disabled={processing === b.id + "pay"} className="h-8 px-3 text-xs rounded-lg bg-[rgba(34,197,94,0.12)] text-green-400 border border-[rgba(34,197,94,0.25)] disabled:opacity-50 flex items-center gap-1">
                      {processing === b.id + "pay" ? <Loader2 className="size-3 animate-spin" /> : <Banknote className="size-3" />}{t("pay_bonus")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TARGETS TAB
// ─────────────────────────────────────────────────────────────────────────────

function TargetsTab({
  targets, employees, onMarkAchieved, onDelete, processing, onRefresh, empName, sectorName, isRtl, t,
}: {
  targets: PTarget[];
  employees: EmpOption[];
  onMarkAchieved: (id: string) => void;
  onDelete: (id: string) => void;
  processing: string | null;
  onRefresh: () => void;
  empName: (e: PTarget["employee"]) => string;
  sectorName: (e: PTarget["employee"]) => string;
  isRtl: boolean;
  t: ReturnType<typeof useTranslations<"dashboard.adminRewards">>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", period: "", targetValue: "", achievedValue: "0", bonusPerUnit: "0" });
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("saving");
    const res = await fetch("/api/performance-targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: form.employeeId,
        period: form.period,
        targetValue: parseFloat(form.targetValue) || 0,
        achievedValue: parseFloat(form.achievedValue) || 0,
        bonusPerUnit: parseFloat(form.bonusPerUnit) || 0,
      }),
    });
    if (res.ok) {
      setState("success");
      setForm({ employeeId: "", period: "", targetValue: "", achievedValue: "0", bonusPerUnit: "0" });
      await onRefresh();
      setTimeout(() => { setShowForm(false); setState("idle"); }, 1000);
    } else setState("error");
  };

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A227]/50";

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] font-semibold text-sm hover:opacity-90 transition">
          <Plus className="size-4" />{t("add_target")}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-[#0d1929] border border-[rgba(201,162,39,0.2)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-sm">{t("target_form_title")}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/70"><X className="size-4" /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <EmpSelect employees={employees} value={form.employeeId} onChange={(v) => setForm((p) => ({ ...p, employeeId: v }))} label={t("target_employee")} />
              <div>
                <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("target_period")} *</label>
                <input required value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))} placeholder="Q1 2026" className={inp} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t("target_value"), key: "targetValue" },
                  { label: t("target_achieved_value"), key: "achievedValue" },
                  { label: t("target_bonus_per_unit"), key: "bonusPerUnit" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs text-[#A8B5C8] mb-1.5">{label}</label>
                    <input type="number" min={0} value={form[key as keyof typeof form]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} className={inp} />
                  </div>
                ))}
              </div>
              {state === "error" && <p className="text-xs text-red-400">{t("target_error")}</p>}
              {state === "success" && <p className="text-xs text-green-400">{t("target_success")}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs border border-white/10 text-white/50 hover:text-white">Cancel</button>
                <button type="submit" disabled={state === "saving" || !form.employeeId || !form.period || !form.targetValue} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] hover:opacity-90 disabled:opacity-50">
                  {state === "saving" && <Loader2 className="size-3 animate-spin" />}
                  {state === "saving" ? t("target_saving") : t("target_save")}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {targets.length === 0 ? (
        <p className="text-center py-12 text-white/30 text-sm">{t("empty_targets")}</p>
      ) : (
        <div className="space-y-3">
          {targets.map((tgt) => {
            const pct = tgt.targetValue > 0 ? Math.min(100, (tgt.achievedValue / tgt.targetValue) * 100) : 0;
            return (
              <div key={tgt.id} className="bg-[#0d1929] border border-white/[0.07] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-[rgba(201,162,39,0.08)] border border-[rgba(201,162,39,0.15)] flex items-center justify-center shrink-0">
                      <span className="text-[#C9A227] text-xs font-bold">{(empName(tgt.employee)[0] ?? "?").toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{empName(tgt.employee)}</p>
                      <p className="text-xs text-[#6e7d93]">{sectorName(tgt.employee)} · {tgt.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tgt.isAchieved
                      ? <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[rgba(34,197,94,0.12)] text-green-400 border border-[rgba(34,197,94,0.25)]">{t("target_achieved_badge")}</span>
                      : <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.2)]">{t("target_in_progress")}</span>
                    }
                    {!tgt.isAchieved && (
                      <button onClick={() => onMarkAchieved(tgt.id)} disabled={processing === tgt.id} className="h-7 px-3 text-xs rounded-lg border border-[rgba(34,197,94,0.3)] text-green-400 hover:bg-[rgba(34,197,94,0.1)] disabled:opacity-50 flex items-center gap-1">
                        {processing === tgt.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}{t("target_mark_achieved")}
                      </button>
                    )}
                    <button onClick={() => onDelete(tgt.id)} disabled={processing === tgt.id + "del"} className="h-7 w-7 rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 flex items-center justify-center disabled:opacity-50">
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: tgt.isAchieved ? "#22c55e" : "#C9A227" }} />
                  </div>
                  <span className="text-xs text-white/40 tabular-nums">{tgt.achievedValue} / {tgt.targetValue}</span>
                  <span className="text-xs text-[#C9A227]">{tgt.bonusPerUnit} coins/unit</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KINETIC POINTS TAB
// ─────────────────────────────────────────────────────────────────────────────

function KineticTab({
  employees, isRtl, t,
}: {
  employees: EmpOption[];
  isRtl: boolean;
  t: ReturnType<typeof useTranslations<"dashboard.adminRewards">>;
}) {
  const [selected, setSelected] = useState<EmpOption | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [empList, setEmpList] = useState(employees);
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [search, setSearch] = useState("");

  const filtered = search
    ? empList.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.code.includes(search))
    : empList;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setState("saving");
    const res = await fetch("/api/kinetic-points", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: selected.id, delta: parseInt(delta) || 0, reason }),
    });
    if (res.ok) {
      const data = await res.json();
      setEmpList((p) => p.map((e) => e.id === selected.id ? { ...e, kineticPoints: data.kineticPoints } : e));
      setSelected((p) => p ? { ...p, kineticPoints: data.kineticPoints } : p);
      setState("success");
      setDelta(""); setReason("");
      setTimeout(() => setState("idle"), 1800);
    } else setState("error");
  };

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A227]/50";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Left: employee list */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("employee_search")}
          className={inp}
        />
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {filtered.length === 0
            ? <p className="text-center py-8 text-white/30 text-sm">{t("empty_kinetic")}</p>
            : filtered.map((emp) => {
              const lv = getLevel(emp.kineticPoints);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => { setSelected(emp); setState("idle"); }}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-start transition-all ${
                    selected?.id === emp.id
                      ? "border-[rgba(201,162,39,0.4)] bg-[rgba(201,162,39,0.06)]"
                      : "border-white/[0.07] hover:border-white/20 bg-[#0d1929]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-[rgba(201,162,39,0.08)] border border-[rgba(201,162,39,0.2)] flex items-center justify-center text-xs font-bold text-[#C9A227]">
                      {(emp.name[0] ?? "?").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">{emp.name}</p>
                      <p className="text-[10px] text-[#6e7d93]">{emp.sector} · {emp.code}</p>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="font-bold text-sm" style={{ color: lv.color }}>{emp.kineticPoints.toLocaleString()}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="size-2.5" style={{ color: lv.color }} fill={lv.color} />
                      <span className="text-[10px]" style={{ color: lv.color }}>{lv.key}</span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Right: adjust form */}
      <div>
        {selected ? (
          <div className="bg-[#0d1929] border border-[rgba(201,162,39,0.2)] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-[rgba(201,162,39,0.08)] border border-[rgba(201,162,39,0.2)] flex items-center justify-center text-lg font-bold text-[#C9A227]">
                {(selected.name[0] ?? "?").toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{selected.name}</p>
                <p className="text-xs text-[#6e7d93]">{t("kinetic_current")}: <span className="text-[#C9A227] font-bold">{selected.kineticPoints.toLocaleString()}</span></p>
              </div>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("kinetic_delta")} *</label>
                <input type="number" required value={delta} onChange={(e) => setDelta(e.target.value)} placeholder={t("kinetic_delta_ph")} className={inp} />
              </div>
              <div>
                <label className="block text-xs text-[#A8B5C8] mb-1.5">{t("kinetic_reason")}</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("kinetic_reason_ph")} className={inp} />
              </div>
              {state === "error" && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="size-3" />{t("kinetic_error")}</p>}
              {state === "success" && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="size-3" />{t("kinetic_success")}</p>}
              {delta && !isNaN(parseInt(delta)) && (
                <div className="text-xs text-[#6e7d93] bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                  {selected.kineticPoints} {parseInt(delta) >= 0 ? "+" : ""}{parseInt(delta)} = <strong className="text-white">{Math.max(0, selected.kineticPoints + parseInt(delta))}</strong>
                </div>
              )}
              <button type="submit" disabled={state === "saving" || !delta} className="w-full h-10 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {state === "saving" && <Loader2 className="size-4 animate-spin" />}
                {state === "saving" ? t("kinetic_saving") : t("kinetic_save")}
              </button>
            </form>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[#6e7d93] text-sm text-center py-16 border border-white/[0.07] rounded-2xl bg-[#0d1929]">
            <div><Trophy className="size-8 mx-auto mb-3 text-[#C9A227]/30" strokeWidth={1.5} />Select an employee to adjust points</div>
          </div>
        )}
      </div>
    </div>
  );
}
