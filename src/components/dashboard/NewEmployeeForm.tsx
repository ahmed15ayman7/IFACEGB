"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion/dashboard";
import { UserPlus, ChevronDown } from "lucide-react";

type Sector = { id: string; nameEn: string; nameAr: string | null };

const ROLES = ["employee", "trainer", "sector_manager", "admin"] as const;
const CONTRACT_TYPES = ["full_time", "part_time", "contract", "intern"] as const;

export function NewEmployeeForm({ sectors }: { sectors: Sector[] }) {
  const t = useTranslations("dashboard.hrEmployees");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    name: "",
    nameAr: "",
    password: "",
    role: "employee" as typeof ROLES[number],
    sectorId: "",
    employeeCode: "",
    jobTitleEn: "",
    jobTitleAr: "",
    departmentEn: "",
    departmentAr: "",
    contractType: "full_time" as typeof CONTRACT_TYPES[number],
    salaryBase: "0",
    salaryCurrency: "EGP",
    profitSharePct: "0",
    hireDate: new Date().toISOString().split("T")[0],
    phone: "",
    nationalId: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salaryBase: Number(form.salaryBase),
          profitSharePct: Number(form.profitSharePct),
          sectorId: form.sectorId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "Email already in use") throw new Error(t("error_email"));
        if (data.error === "Employee code already in use") throw new Error(t("error_code"));
        throw new Error(t("error_generic"));
      }
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/admin/employees/${data.employeeId}`), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_generic"));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-[rgba(201,162,39,0.18)] bg-[rgba(6,15,30,0.7)] px-3 py-2 text-sm text-[#A8B5C8] placeholder-[#6e7d93] focus:outline-none focus:border-[rgba(201,162,39,0.55)] focus:ring-1 focus:ring-[rgba(201,162,39,0.2)] transition-colors";
  const labelCls = "block text-xs font-medium text-[#6e7d93] mb-1.5";
  const sectionCls = "rounded-2xl border border-[rgba(201,162,39,0.1)] bg-[rgba(6,15,30,0.5)] p-5 space-y-4";
  const sectionTitleCls = "text-sm font-semibold text-[#C9A227] mb-4 flex items-center gap-2";

  if (success) {
    return (
      <motion.div {...fadeInUp} className="py-20 text-center">
        <div className="size-16 rounded-full bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.3)] text-[#22c55e] flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <p className="text-[#22c55e] font-semibold">{t("success")}</p>
      </motion.div>
    );
  }

  return (
    <motion.form {...fadeInUp} onSubmit={handleSubmit} className="space-y-5 max-w-7xl">

      {/* Section 1: Account */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>
          <span className="size-5 rounded-full bg-[rgba(201,162,39,0.15)] text-[#C9A227] text-[10px] flex items-center justify-center font-bold">1</span>
          {t("section_account")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("field_email")} *</label>
            <input required type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_password")} *</label>
            <input required type="password" minLength={8} className={inputCls} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="min 8 characters" />
          </div>
          <div>
            <label className={labelCls}>{t("field_name")} *</label>
            <input required className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_name_ar")}</label>
            <input dir="rtl" className={inputCls} value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_role")} *</label>
            <div className="relative">
              <select required className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93] pointer-events-none" aria-hidden />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t("field_sector")}</label>
            <div className="relative">
              <select className={inputCls} value={form.sectorId} onChange={(e) => set("sectorId", e.target.value)}>
                <option value="">— None —</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isRtl ? (s.nameAr ?? s.nameEn) : s.nameEn}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93] pointer-events-none" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Profile */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>
          <span className="size-5 rounded-full bg-[rgba(201,162,39,0.15)] text-[#C9A227] text-[10px] flex items-center justify-center font-bold">2</span>
          {t("section_profile")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("field_code")} *</label>
            <input required className={inputCls} value={form.employeeCode} onChange={(e) => set("employeeCode", e.target.value)} placeholder="e.g. EMP-001" />
          </div>
          <div>
            <label className={labelCls}>{t("field_phone")}</label>
            <input type="tel" className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_job_en")}</label>
            <input className={inputCls} value={form.jobTitleEn} onChange={(e) => set("jobTitleEn", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_job_ar")}</label>
            <input dir="rtl" className={inputCls} value={form.jobTitleAr} onChange={(e) => set("jobTitleAr", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_dept_en")}</label>
            <input className={inputCls} value={form.departmentEn} onChange={(e) => set("departmentEn", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_dept_ar")}</label>
            <input dir="rtl" className={inputCls} value={form.departmentAr} onChange={(e) => set("departmentAr", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_national_id")}</label>
            <input className={inputCls} value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_address")}</label>
            <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Section 3: Contract */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>
          <span className="size-5 rounded-full bg-[rgba(201,162,39,0.15)] text-[#C9A227] text-[10px] flex items-center justify-center font-bold">3</span>
          {t("section_contract")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>{t("field_contract")}</label>
            <div className="relative">
              <select className={inputCls} value={form.contractType} onChange={(e) => set("contractType", e.target.value)}>
                {CONTRACT_TYPES.map((c) => (
                  <option key={c} value={c}>{t(`contract_${c}`)}</option>
                ))}
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 size-4 text-[#6e7d93] pointer-events-none" aria-hidden />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t("field_salary")}</label>
            <div className="flex gap-2">
              <input type="number" min={0} className={inputCls} value={form.salaryBase} onChange={(e) => set("salaryBase", e.target.value)} />
              <input className="w-20 rounded-lg border border-[rgba(201,162,39,0.18)] bg-[rgba(6,15,30,0.7)] px-2 py-2 text-xs text-[#A8B5C8] text-center" value={form.salaryCurrency} onChange={(e) => set("salaryCurrency", e.target.value)} maxLength={3} />
            </div>
          </div>
          <div>
            <label className={labelCls}>{t("field_profit")}</label>
            <input type="number" min={0} max={100} step={0.1} className={inputCls} value={form.profitSharePct} onChange={(e) => set("profitSharePct", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t("field_hire")} *</label>
            <input required type="date" className={inputCls} value={form.hireDate} onChange={(e) => set("hireDate", e.target.value)} />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 px-1">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[rgba(201,162,39,0.9)] px-8 text-sm font-semibold text-[#060f1e] hover:bg-[#C9A227] transition-all disabled:opacity-60"
      >
        <UserPlus className="size-4" aria-hidden />
        {loading ? t("saving") : t("save")}
      </button>
    </motion.form>
  );
}
