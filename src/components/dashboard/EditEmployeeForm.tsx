"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Camera, Loader2, CheckCircle2, AlertCircle, User } from "lucide-react";
import Image from "next/image";

type Sector = { id: string; nameEn: string; nameAr: string | null };

type EmployeeData = {
  id: string;
  employeeCode: string;
  jobTitleEn: string | null;
  jobTitleAr: string | null;
  departmentEn: string | null;
  departmentAr: string | null;
  contractType: string;
  salaryBase: number;
  salaryCurrency: string;
  profitSharePct: number;
  hireDate: string;
  phone: string | null;
  nationalId: string | null;
  passportNo: string | null;
  address: string | null;
  emergencyContact: string | null;
  user: {
    id: string;
    name: string | null;
    nameAr: string | null;
    email: string;
    role: string;
    sectorId: string | null;
    isActive: boolean;
    avatarUrl: string | null;
  };
};

const ROLES = ["employee", "trainer", "sector_manager", "admin"] as const;
const CONTRACT_TYPES = ["full_time", "part_time", "contract", "intern"] as const;

export function EditEmployeeForm({
  employee,
  sectors,
}: {
  employee: EmployeeData;
  sectors: Sector[];
}) {
  const t = useTranslations("dashboard.hrEmployees");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string>(employee.user.avatarUrl ?? "");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Form state
  const [form, setForm] = useState({
    name: employee.user.name ?? "",
    nameAr: employee.user.nameAr ?? "",
    role: employee.user.role,
    sectorId: employee.user.sectorId ?? "",
    isActive: employee.user.isActive,
    jobTitleEn: employee.jobTitleEn ?? "",
    jobTitleAr: employee.jobTitleAr ?? "",
    departmentEn: employee.departmentEn ?? "",
    departmentAr: employee.departmentAr ?? "",
    contractType: employee.contractType,
    salaryBase: employee.salaryBase.toString(),
    salaryCurrency: employee.salaryCurrency,
    profitSharePct: employee.profitSharePct.toString(),
    hireDate: employee.hireDate.slice(0, 10),
    phone: employee.phone ?? "",
    nationalId: employee.nationalId ?? "",
    passportNo: employee.passportNo ?? "",
    address: employee.address ?? "",
    emergencyContact: employee.emergencyContact ?? "",
  });

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  // ─── Avatar upload ──────────────────────────────────────────────────────
  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Instant local preview
      const localUrl = URL.createObjectURL(file);
      setAvatarUrl(localUrl);
      setAvatarError("");
      setAvatarLoading(true);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", employee.user.id);

      try {
        const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setAvatarError(t("avatar_error"));
          setAvatarUrl(employee.user.avatarUrl ?? "");
        } else {
          setAvatarUrl(data.avatarUrl);
        }
      } catch {
        setAvatarError(t("avatar_error"));
        setAvatarUrl(employee.user.avatarUrl ?? "");
      } finally {
        setAvatarLoading(false);
        URL.revokeObjectURL(localUrl);
      }
    },
    [employee.user.id, employee.user.avatarUrl, t]
  );

  // ─── Form submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          nameAr: form.nameAr || null,
          role: form.role,
          sectorId: form.sectorId || null,
          isActive: form.isActive,
          jobTitleEn: form.jobTitleEn || null,
          jobTitleAr: form.jobTitleAr || null,
          departmentEn: form.departmentEn || null,
          departmentAr: form.departmentAr || null,
          contractType: form.contractType,
          salaryBase: parseFloat(form.salaryBase) || 0,
          salaryCurrency: form.salaryCurrency,
          profitSharePct: parseFloat(form.profitSharePct) || 0,
          hireDate: form.hireDate,
          phone: form.phone || null,
          nationalId: form.nationalId || null,
          passportNo: form.passportNo || null,
          address: form.address || null,
          emergencyContact: form.emergencyContact || null,
        }),
      });

      if (!res.ok) {
        setErrorMsg(t("edit_error"));
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        router.push(`/${locale}/admin/employees/${employee.id}`);
        router.refresh();
      }, 1200);
    } catch {
      setErrorMsg(t("edit_error"));
      setStatus("error");
    }
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#C9A227]/50 transition-colors";

  const labelClass = "block text-xs text-[#A8B5C8] mb-1.5 font-medium";

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Avatar ────────────────────────────────────────────────────── */}
      <section className="bg-[#0d1929] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-sm mb-5">{t("section_avatar")}</h2>
        <div className="flex items-center gap-5 flex-wrap">
          {/* Avatar preview */}
          <div className="relative group">
            <div className="size-24 rounded-full border-2 border-[rgba(201,162,39,0.4)] overflow-hidden bg-[rgba(201,162,39,0.06)] flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized={avatarUrl.startsWith("blob:")}
                />
              ) : (
                <User className="size-10 text-[#C9A227]/50" strokeWidth={1.5} />
              )}
              {avatarLoading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <Loader2 className="size-6 text-[#C9A227] animate-spin" />
                </div>
              )}
            </div>

            {/* Camera overlay on hover */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              aria-label={t("avatar_upload_btn")}
            >
              <Camera className="size-6 text-white" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-[#C9A227]/10 hover:border-[#C9A227]/30 text-white/70 hover:text-[#C9A227] transition-all disabled:opacity-50"
            >
              {avatarLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" /> {t("avatar_uploading")}
                </span>
              ) : (
                t("avatar_upload_btn")
              )}
            </button>
            <p className="text-xs text-white/30 mt-2">{t("avatar_hint")}</p>
            {avatarError && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3" /> {avatarError}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Account info ────────────────────────────────────────────────── */}
      <section className="bg-[#0d1929] border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold text-sm">{t("section_account")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("field_name")}</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("field_name_ar")}</label>
            <input
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("field_role")}</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={inputClass}
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#0d1929]">
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("field_sector")}</label>
            <select
              value={form.sectorId}
              onChange={(e) => set("sectorId", e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-[#0d1929]">— None —</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0d1929]">
                  {isRtl ? (s.nameAr ?? s.nameEn) : s.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
          <div
            role="switch"
            aria-checked={form.isActive}
            onClick={() => set("isActive", !form.isActive)}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.isActive ? "bg-[#C9A227]" : "bg-white/20"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0"}`}
            />
          </div>
          <span className="text-sm text-[#A8B5C8]">{t("field_active")}</span>
        </label>
      </section>

      {/* ── Employee profile ─────────────────────────────────────────────── */}
      <section className="bg-[#0d1929] border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold text-sm">{t("section_profile")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ["field_job_en", "jobTitleEn"],
              ["field_job_ar", "jobTitleAr"],
              ["field_dept_en", "departmentEn"],
              ["field_dept_ar", "departmentAr"],
              ["field_phone", "phone"],
              ["field_national_id", "nationalId"],
              ["field_passport", "passportNo"],
            ] as [string, keyof typeof form][]
          ).map(([labelKey, fieldKey]) => (
            <div key={fieldKey}>
              <label className={labelClass}>{t(labelKey)}</label>
              <input
                value={form[fieldKey] as string}
                onChange={(e) => set(fieldKey, e.target.value)}
                dir={
                  fieldKey === "jobTitleAr" || fieldKey === "departmentAr" ? "rtl" : undefined
                }
                className={inputClass}
              />
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className={labelClass}>{t("field_address")}</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>{t("field_emergency")}</label>
            <input
              value={form.emergencyContact}
              onChange={(e) => set("emergencyContact", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Contract & Compensation ──────────────────────────────────────── */}
      <section className="bg-[#0d1929] border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold text-sm">{t("section_contract")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("field_contract")}</label>
            <select
              value={form.contractType}
              onChange={(e) => set("contractType", e.target.value)}
              className={inputClass}
            >
              {CONTRACT_TYPES.map((c) => (
                <option key={c} value={c} className="bg-[#0d1929]">
                  {t(`contract_${c}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("field_hire")}</label>
            <input
              type="date"
              value={form.hireDate}
              onChange={(e) => set("hireDate", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("field_salary")}</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.salaryBase}
              onChange={(e) => set("salaryBase", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("field_currency")}</label>
            <input
              value={form.salaryCurrency}
              onChange={(e) => set("salaryCurrency", e.target.value)}
              maxLength={5}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("field_profit")}</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={form.profitSharePct}
              onChange={(e) => set("profitSharePct", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Feedback */}
      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
          <AlertCircle className="size-4 shrink-0" />
          {errorMsg}
        </div>
      )}
      {status === "success" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 rounded-xl px-4 py-3 border border-green-500/20"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          {t("edit_success")}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
        >
          {t("edit_cancel")}
        </button>
        <button
          type="submit"
          disabled={status === "saving" || status === "success"}
          className="px-7 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#C9A227] to-[#e8c547] text-[#060f1e] hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {status === "saving" && <Loader2 className="size-3.5 animate-spin" />}
          {status === "saving" ? t("edit_saving") : t("edit_save")}
        </button>
      </div>
    </motion.form>
  );
}
