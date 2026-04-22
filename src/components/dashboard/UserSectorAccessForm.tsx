"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { SectorAccessLevel } from "@prisma/client";
import Link from "next/link";

type Sector = { id: string; code: string; nameEn: string; nameAr: string };

export function UserSectorAccessForm({
  userId,
  sectors,
  initial,
  locale: localeProp,
}: {
  userId: string;
  sectors: Sector[];
  initial: { sectorId: string; accessLevel: SectorAccessLevel }[];
  locale: string;
}) {
  const t = useTranslations("dashboard.adminUsers");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const [state, setState] = useState<Record<string, SectorAccessLevel | "">>(() => {
    const m: Record<string, SectorAccessLevel | ""> = {};
    for (const s of sectors) m[s.id] = "";
    for (const e of initial) m[e.sectorId] = e.accessLevel;
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    const list = Object.entries(state)
      .filter(([, v]) => v === "manager" || v === "read_only")
      .map(([sectorId, accessLevel]) => ({
        sectorId,
        accessLevel: accessLevel as "manager" | "read_only",
      }));
    const r = await fetch(`/api/admin/users/${userId}/sector-access`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectors: list }),
    });
    setSaving(false);
    if (!r.ok) {
      setErr("Save failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <div className="rounded-xl border border-[#1E293B] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0A0F1A] text-[#94A3B8] text-xs">
              <th className="px-3 py-2 text-left">{t("col_sector")}</th>
              <th className="px-3 py-2 text-left">{t("access_level")}</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s) => (
              <tr key={s.id} className="border-t border-[#1E293B]">
                <td className="px-3 py-2 text-white">
                  {isRtl && s.nameAr ? s.nameAr : s.nameEn}{" "}
                  <span className="text-[#64748B] text-xs">({s.code})</span>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={state[s.id] || ""}
                    onChange={(e) =>
                      setState((p) => ({
                        ...p,
                        [s.id]: (e.target.value as SectorAccessLevel | "") || "",
                      }))
                    }
                    className="bg-[#0A0F1A] border border-[#1E293B] rounded px-2 py-1 text-xs text-[#A8B5C8] w-full max-w-xs"
                  >
                    <option value="">{t("access_none")}</option>
                    <option value="manager">{t("access_manager")}</option>
                    <option value="read_only">{t("access_read")}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="px-4 py-2 rounded-lg bg-[#C9A227] text-black text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "…" : t("save_access")}
        </button>
        <Link
          href={`/${localeProp}/admin/users`}
          className="px-4 py-2 rounded-lg border border-[#1E293B] text-sm text-[#94A3B8]"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
