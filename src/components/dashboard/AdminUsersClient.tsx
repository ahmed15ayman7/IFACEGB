"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UserRole } from "@prisma/client";
import Link from "next/link";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "#C9A227",
  admin: "#60A5FA",
  sector_manager: "#A78BFA",
  employee: "#34D399",
  trainer: "#F472B6",
  agent: "#FB923C",
  center: "#22C55E",
  client: "#94A3B8",
  user: "#64748B",
};

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  isSuspended: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  sector: { nameEn: string; nameAr: string } | null;
};

type Props = {
  users: UserRow[];
  byRole: { role: string; count: number }[];
  byMonth: { month: string; count: number }[];
  bySector: { sector: string; count: number }[];
  statusMix: { name: string; value: number; color: string }[];
};

function patchStatus(userId: string, body: object) {
  return fetch(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function AdminUsersClient({ users, byRole, byMonth, bySector, statusMix }: Props) {
  const t = useTranslations("dashboard.adminUsers");
  const locale = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<"all" | UserRole | "suspended" | "inactive">("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (tab === "suspended") return u.isSuspended;
    if (tab === "inactive") return !u.isActive;
    if (tab === "all") return true;
    return u.role === tab;
  });

  async function toggleSuspend(u: UserRow) {
    setLoading(u.id);
    const next = !u.isSuspended;
    const r = await patchStatus(u.id, { isSuspended: next, suspendedReason: next ? "admin" : null });
    setLoading(null);
    if (r.ok) {
      router.refresh();
    }
  }

  async function toggleActive(u: UserRow) {
    setLoading(u.id);
    const r = await patchStatus(u.id, { isActive: !u.isActive });
    setLoading(null);
    if (r.ok) {
      router.refresh();
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1
        className="text-2xl font-bold text-[#C9A227]"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        {t("title")}
      </h1>
      <p className="text-sm text-[#64748B] max-w-2xl">{t("subtitle")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[220px]">
        <div className="rounded-xl border border-[rgba(201,162,39,0.12)] p-4 bg-[rgba(10,31,61,0.4)]">
          <h3 className="text-xs font-semibold text-[#94A3B8] mb-2">{t("chart_sectors")}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bySector} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="sector"
                width={100}
                tick={{ fill: "#94A3B8", fontSize: 9 }}
              />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Bar dataKey="count" fill="#60A5FA" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-[rgba(201,162,39,0.12)] p-4 bg-[rgba(10,31,61,0.4)]">
          <h3 className="text-xs font-semibold text-[#94A3B8] mb-2">{t("chart_roles")}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={byRole}
                dataKey="count"
                nameKey="role"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label
              >
                {byRole.map((entry) => (
                  <Cell
                    key={entry.role}
                    fill={ROLE_COLORS[entry.role] ?? "#64748B"}
                    name={entry.role}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-[rgba(201,162,39,0.12)] p-4 bg-[rgba(10,31,61,0.4)]">
          <h3 className="text-xs font-semibold text-[#94A3B8] mb-2">{t("chart_status")}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusMix}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Bar dataKey="value" name="Count">
                {statusMix.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {byMonth.length > 0 && (
        <div className="rounded-xl border border-[rgba(201,162,39,0.12)] p-4 bg-[rgba(10,31,61,0.4)] min-h-[240px]">
          <h3 className="text-xs font-semibold text-[#94A3B8] mb-2">{t("chart_signups")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="count" stroke="#C9A227" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "suspended", "inactive", "super_admin", "admin", "sector_manager", "employee", "trainer", "agent", "center", "client", "user"] as const).map(
          (k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                tab === k
                  ? "bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227]"
                  : "border-[#1e293b] text-[#94A3B8] hover:border-[#334155]"
              }`}
            >
              {k === "all" ? t("tab_all") : k === "suspended" ? t("tab_suspended") : k === "inactive" ? t("tab_inactive") : k}
            </button>
          )
        )}
      </div>

      <div className="rounded-xl border border-[rgba(201,162,39,0.12)] overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-[rgba(10,31,61,0.8)] border-b border-[rgba(201,162,39,0.1)]">
              <th className="px-4 py-3 text-left text-xs text-[#6e7d93]">{t("col_name")}</th>
              <th className="px-4 py-3 text-left text-xs text-[#6e7d93]">{t("col_email")}</th>
              <th className="px-4 py-3 text-left text-xs text-[#6e7d93]">{t("col_role")}</th>
              <th className="px-4 py-3 text-left text-xs text-[#6e7d93]">{t("col_sector")}</th>
              <th className="px-4 py-3 text-left text-xs text-[#6e7d93]">{t("col_status")}</th>
              <th className="px-4 py-3 text-left text-xs text-[#6e7d93]">{t("col_actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(201,162,39,0.06)]">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-[rgba(201,162,39,0.03)]">
                <td className="px-4 py-3 text-[#A8B5C8]">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-[#6e7d93] text-xs font-mono">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs text-[#C9A227] border border-[rgba(201,162,39,0.2)]">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#6e7d93]">
                  {locale === "ar" && u.sector?.nameAr ? u.sector.nameAr : (u.sector?.nameEn ?? "—")}
                </td>
                <td className="px-4 py-3 text-xs">
                  {!u.isActive ? (
                    <span className="text-red-400">{t("st_inactive")}</span>
                  ) : u.isSuspended ? (
                    <span className="text-amber-400">{t("st_suspended")}</span>
                  ) : (
                    <span className="text-emerald-400">{t("st_active")}</span>
                  )}
                </td>
                <td className="px-4 py-3 flex flex-wrap gap-2">
                  <Link
                    href={`/${locale}/admin/users/${u.id}/access`}
                    className="text-xs text-[#60A5FA] hover:underline"
                  >
                    {t("access")}
                  </Link>
                  <button
                    type="button"
                    disabled={loading === u.id}
                    onClick={() => void toggleActive(u)}
                    className="text-xs text-[#94A3B8] hover:underline"
                  >
                    {u.isActive ? t("btn_deactivate") : t("btn_activate")}
                  </button>
                  <button
                    type="button"
                    disabled={loading === u.id}
                    onClick={() => void toggleSuspend(u)}
                    className="text-xs text-amber-500/90 hover:underline"
                  >
                    {u.isSuspended ? t("btn_unsuspend") : t("btn_suspend")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
