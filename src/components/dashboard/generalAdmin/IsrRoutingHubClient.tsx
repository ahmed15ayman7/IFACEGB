"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Inbox, ArrowRight, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { format } from "date-fns";

interface IsrItem {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  requester: { name: string | null; nameAr: string | null };
  fromSector: { nameEn: string; nameAr: string | null } | null;
  toSectorId: string | null;
}

interface Sector {
  id: string;
  nameEn: string;
  nameAr: string | null;
  code: string;
}

interface Props {
  isrs: IsrItem[];
  sectors: Sector[];
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending:     { bg: "#92400E20", text: "#FCD34D" },
  in_progress: { bg: "#1E40AF20", text: "#60A5FA" },
  resolved:    { bg: "#14532D20", text: "#4ADE80" },
  closed:      { bg: "#1E293B",   text: "#64748B" },
};

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  low:      { bg: "#1E293B", text: "#64748B" },
  normal:   { bg: "#1E40AF20", text: "#60A5FA" },
  high:     { bg: "#78350F20", text: "#FCD34D" },
  critical: { bg: "#7F1D1D20", text: "#F87171" },
};

export function IsrRoutingHubClient({ isrs: initialIsrs, sectors }: Props) {
  const t = useTranslations("dashboard.generalAdmin");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [isrs, setIsrs] = useState(initialIsrs);
  const [routingId, setRoutingId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<Record<string, string>>({});
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleRoute(isrId: string) {
    const targetSectorId = selectedSector[isrId];
    if (!targetSectorId) return;

    setLoadingRoute(isrId);
    try {
      const res = await fetch(`/api/isr/${isrId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toSectorId: targetSectorId, status: "in_progress" }),
      });

      if (res.ok) {
        setIsrs((prev) =>
          prev.map((isr) =>
            isr.id === isrId
              ? { ...isr, status: "in_progress", toSectorId: targetSectorId }
              : isr
          )
        );
        setRoutingId(null);
        showToast("success", t("isr_routed"));
      } else {
        showToast("error", t("isr_route_error"));
      }
    } catch {
      showToast("error", t("isr_route_error"));
    } finally {
      setLoadingRoute(null);
    }
  }

  return (
    <div className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-500/15 text-green-400 border border-green-500/30"
              : "bg-red-500/15 text-red-400 border border-red-500/30"
          }`}
        >
          {toast.message}
        </div>
      )}

      {isrs.length === 0 ? (
        <EmptyState icon={Inbox} title={isRtl ? "لا توجد طلبات بعد." : "No ISRs yet."} description="" />
      ) : (
        <div className="rounded-xl border border-[#1E293B] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#080D18]">
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{isRtl ? "الطلب" : "Request"}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{isRtl ? "مقدم الطلب" : "Requester"}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{isRtl ? "من قطاع" : "From Sector"}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{isRtl ? "الأولوية" : "Priority"}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{isRtl ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{isRtl ? "التاريخ" : "Date"}</th>
                <th className="px-4 py-3 text-[#64748B] font-medium text-left">{isRtl ? "توجيه" : "Route"}</th>
              </tr>
            </thead>
            <tbody>
              {isrs.map((isr, i) => {
                const statusStyle = STATUS_STYLE[isr.status] ?? STATUS_STYLE.pending;
                const priorityStyle = PRIORITY_STYLE[isr.priority] ?? PRIORITY_STYLE.normal;
                const requesterName = isRtl && isr.requester.nameAr
                  ? isr.requester.nameAr
                  : isr.requester.name ?? "—";
                const fromSectorName = isr.fromSector
                  ? (isRtl && isr.fromSector.nameAr ? isr.fromSector.nameAr : isr.fromSector.nameEn)
                  : "—";
                const isRouting = routingId === isr.id;

                return (
                  <tr
                    key={isr.id}
                    className={`border-b border-[#1E293B] last:border-0 ${i % 2 === 0 ? "bg-[#0A0F1A]" : "bg-[#080D18]"}`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-white font-medium truncate block max-w-[200px]">
                        {isr.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] text-xs">{requesterName}</td>
                    <td className="px-4 py-3 text-[#94A3B8] text-xs">{fromSectorName}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.text }}
                      >
                        {isr.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      >
                        {isr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">
                      {format(new Date(isr.createdAt), "d MMM yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      {isRouting ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="text-xs bg-[#0A0F1A] border border-[#1E293B] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                            value={selectedSector[isr.id] ?? ""}
                            onChange={(e) =>
                              setSelectedSector((prev) => ({ ...prev, [isr.id]: e.target.value }))
                            }
                          >
                            <option value="">{t("isr_select_sector")}</option>
                            {sectors.map((s) => (
                              <option key={s.id} value={s.id}>
                                {isRtl && s.nameAr ? s.nameAr : s.nameEn}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRoute(isr.id)}
                            disabled={!selectedSector[isr.id] || loadingRoute === isr.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#C9A227] text-black text-xs font-semibold hover:bg-[#E6B830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingRoute === isr.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ArrowRight size={12} />
                            )}
                            {loadingRoute === isr.id ? t("isr_routing") : isRtl ? "توجيه" : "Route"}
                          </button>
                          <button
                            onClick={() => setRoutingId(null)}
                            className="text-[#64748B] hover:text-white text-xs transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRoutingId(isr.id)}
                          className="flex items-center gap-1 text-xs text-[#C9A227] hover:text-[#E6B830] transition-colors"
                        >
                          <ArrowRight size={13} />
                          {t("isr_route_btn")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
