"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Loader2, CheckCircle2, AlertCircle,
  FileText, Clock, BadgeCheck, FileX,
} from "lucide-react";

const TEMPLATE_TYPES = [
  "employment_contract",
  "non_disclosure",
  "offer_letter",
  "salary_amendment",
  "termination",
  "other",
] as const;

const CONTRACT_STATUSES = ["draft", "pending", "signed", "expired"] as const;

type TmplType = typeof TEMPLATE_TYPES[number];
type ContractStatus = typeof CONTRACT_STATUSES[number];

export type AdminContract = {
  id: string;
  templateType: string;
  status: string;
  signedAt: string | null;
  createdAt: string;
  content: string;
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: FileText,
  pending: Clock,
  signed: BadgeCheck,
  expired: FileX,
};

const STATUS_COLORS: Record<string, string> = {
  draft:   "#A8B5C8",
  pending: "#C9A227",
  signed:  "#22c55e",
  expired: "#ef4444",
};

type SalarySummary = {
  contractType: string;
  salaryBase: number;
  salaryCurrency: string;
  profitSharePct: number;
};

export function AdminContractsPanel({
  employeeId,
  initialContracts,
  salary,
}: {
  employeeId: string;
  initialContracts: AdminContract[];
  salary: SalarySummary;
}) {
  const t = useTranslations("dashboard.hrEmployees");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [contracts, setContracts] = useState(initialContracts);
  const [showForm, setShowForm] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [expanded, setExpanded] = useState<string | null>(null);

  const [form, setForm] = useState<{
    templateType: TmplType;
    status: ContractStatus;
    content: string;
  }>({
    templateType: "employment_contract",
    status: "pending",
    content: "",
  });

  const reload = async () => {
    const r = await fetch(`/api/contracts/admin?employeeId=${employeeId}`);
    if (r.ok) setContracts(await r.json());
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("saving");
    const res = await fetch("/api/contracts/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, ...form }),
    });
    if (res.ok) {
      setState("success");
      setForm({ templateType: "employment_contract", status: "pending", content: "" });
      await reload();
      setTimeout(() => { setShowForm(false); setState("idle"); }, 1400);
    } else {
      setState("error");
    }
  };

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A227]/50 placeholder:text-white/20";

  return (
    <div className="space-y-5">
      {/* ── Salary summary card ───────────────────────────────── */}
      <div className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[rgba(6,15,30,0.6)] p-5">
        <h2 className="text-sm font-semibold text-[#C9A227] mb-4">
          {t("salary_section")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t("salary_contract_type"), value: salary.contractType.replace("_", " ") },
            { label: t("salary_base"),          value: salary.salaryBase.toLocaleString() },
            { label: t("salary_currency"),      value: salary.salaryCurrency },
            { label: t("salary_profit"),        value: `${salary.profitSharePct}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-[#6e7d93] mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-white capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contracts section ─────────────────────────────────── */}
      <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.5)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#C9A227]">{t("contract_section")}</h2>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg border border-[rgba(201,162,39,0.3)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.08)] transition-colors"
          >
            <Plus className="size-3.5" />
            {t("contract_add_btn")}
          </button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 bg-[#0d1929] border border-[rgba(201,162,39,0.2)] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-white">{t("contract_form_title")}</h3>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60">
                  <X className="size-4" />
                </button>
              </div>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#A8B5C8] mb-1">{t("contract_type")}</label>
                    <select
                      value={form.templateType}
                      onChange={(e) => setForm((p) => ({ ...p, templateType: e.target.value as TmplType }))}
                      className={inp}
                    >
                      {TEMPLATE_TYPES.map((tmpl) => (
                        <option key={tmpl} value={tmpl} className="bg-[#0d1929]">
                          {t(`contract_tmpl_${tmpl}` as Parameters<typeof t>[0])}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#A8B5C8] mb-1">{t("contract_status")}</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ContractStatus }))}
                      className={inp}
                    >
                      {CONTRACT_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-[#0d1929]">
                          {t(`contract_st_${st}` as Parameters<typeof t>[0])}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#A8B5C8] mb-1">{t("contract_content")} *</label>
                  <textarea
                    required
                    rows={6}
                    value={form.content}
                    onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                    placeholder={t("contract_content_ph")}
                    className={`${inp} resize-y`}
                  />
                </div>

                {state === "error" && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="size-3" />{t("contract_error")}
                  </p>
                )}
                {state === "success" && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" />{t("contract_success")}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-xs border border-white/10 text-white/50 hover:text-white"
                  >
                    {t("edit_cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={state === "saving" || !form.content}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] hover:opacity-90 disabled:opacity-50"
                  >
                    {state === "saving" && <Loader2 className="size-3 animate-spin" />}
                    {state === "saving" ? t("contract_saving") : t("contract_save")}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contract list */}
        {contracts.length === 0 ? (
          <p className="text-center py-6 text-xs text-[#6e7d93]">{t("contract_empty")}</p>
        ) : (
          <div className="space-y-2">
            {contracts.map((c) => {
              const StatusIcon = STATUS_ICONS[c.status] ?? FileText;
              const color = STATUS_COLORS[c.status] ?? "#A8B5C8";
              const isOpen = expanded === c.id;

              return (
                <div key={c.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between gap-3 p-3 text-start"
                    onClick={() => setExpanded(isOpen ? null : c.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                        <StatusIcon className="size-3.5" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-xs text-white font-medium capitalize">
                          {t(`contract_tmpl_${c.templateType}` as Parameters<typeof t>[0])}
                        </p>
                        <p className="text-[10px] text-[#6e7d93]">
                          {new Date(c.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                      style={{ color, background: `${color}10`, border: `1px solid ${color}25` }}
                    >
                      {t(`contract_st_${c.status}` as Parameters<typeof t>[0])}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/[0.07]"
                      >
                        <pre className="p-3 text-[11px] text-[#A8B5C8] whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                          {c.content}
                        </pre>
                        {c.signedAt && (
                          <p className="px-3 pb-2.5 text-[10px] text-green-400">
                            ✓ {t("contract_col_signed")}: {new Date(c.signedAt).toLocaleString(isRtl ? "ar-EG" : "en-GB")}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
