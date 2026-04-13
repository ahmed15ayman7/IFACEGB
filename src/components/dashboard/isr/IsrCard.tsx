"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { staggerItem } from "@/lib/motion/dashboard";
import { Clock, AlertTriangle, CheckCircle2, XCircle, ArrowUpCircle, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

type IsrCardProps = {
  id: string;
  titleEn: string;
  titleAr: string | null;
  priority: string;
  status: string;
  slaDeadline: string | null;
  createdAt: string;
  requester: { name: string | null; nameAr: string | null };
  sector: { nameEn: string; nameAr: string | null } | null;
  direction: "inbox" | "sent";
  onAction?: (id: string, status: string) => Promise<void>;
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  normal: "#C9A227",
  low: "#A8B5C8",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  resolved: CheckCircle2,
  rejected: XCircle,
  escalated: ArrowUpCircle,
};

export function IsrCard({
  id,
  titleEn,
  titleAr,
  priority,
  status,
  slaDeadline,
  createdAt,
  requester,
  sector,
  direction,
  onAction,
}: IsrCardProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard.isr");
  const [loading, setLoading] = useState<string | null>(null);
  const isRtl = locale === "ar";

  const title = isRtl ? (titleAr ?? titleEn) : titleEn;
  const priorityColor = PRIORITY_COLORS[priority] ?? "#A8B5C8";
  const StatusIcon = STATUS_ICONS[status];

  const now = Date.now();
  const deadline = slaDeadline ? new Date(slaDeadline).getTime() : null;
  const msLeft = deadline ? deadline - now : null;
  const isOverdue = msLeft !== null && msLeft < 0;
  const hLeft = msLeft !== null && msLeft > 0 ? Math.floor(msLeft / 3600000) : 0;
  const mLeft = msLeft !== null && msLeft > 0 ? Math.floor((msLeft % 3600000) / 60000) : 0;

  const slaText = isOverdue
    ? t("sla_overdue")
    : msLeft !== null
      ? t("sla_remaining", { h: hLeft, m: mLeft })
      : null;

  async function handleAction(newStatus: string) {
    if (!onAction) return;
    setLoading(newStatus);
    try {
      await onAction(id, newStatus);
    } finally {
      setLoading(null);
    }
  }

  const canAct = direction === "inbox" && !["resolved", "rejected"].includes(status);

  return (
    <motion.div
      {...staggerItem}
      className="rounded-xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.6)] p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
              style={{ color: priorityColor, borderColor: `${priorityColor}40`, background: `${priorityColor}12` }}
            >
              {t(`priority_${priority as "urgent" | "high" | "normal" | "low"}`)}
            </span>
            <span className="text-[10px] text-[#6e7d93] uppercase tracking-wide px-2 py-0.5 rounded-full border border-[rgba(168,181,200,0.15)]">
              {t(`status_${status.replace("_", "") as keyof typeof t}`)}
            </span>
            {StatusIcon && <StatusIcon className="size-3.5 text-[#C9A227]" aria-hidden />}
          </div>
          <Link
            href={`/${locale}/isr/${id}`}
            className="text-sm font-semibold text-[#C9A227] hover:text-[#e8c84a] transition-colors line-clamp-2"
          >
            {title}
          </Link>
        </div>
        <Link href={`/${locale}/isr/${id}`} className="shrink-0 text-[#6e7d93] hover:text-[#C9A227]">
          <LinkIcon className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-[#6e7d93]">
        {sector && (
          <span>{direction === "inbox" ? t("detail_from") : t("detail_to")}: {isRtl ? (sector.nameAr ?? sector.nameEn) : sector.nameEn}</span>
        )}
        {slaText && (
          <span className={`inline-flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-[#C9A227]/80"}`}>
            {isOverdue ? <AlertTriangle className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
            {slaText}
          </span>
        )}
        <span>{new Date(createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })}</span>
      </div>

      {canAct && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[rgba(201,162,39,0.08)]">
          {["accepted", "rejected", "in_progress", "resolved"].map((s) => {
            const isLoading = loading === s;
            const label = t(`action_${s === "accepted" ? "accept" : s === "rejected" ? "reject" : s === "in_progress" ? "accept" : "resolve"}` as Parameters<typeof t>[0]);
            const color =
              s === "accepted" || s === "in_progress" ? "#22c55e"
                : s === "rejected" ? "#ef4444"
                : "#C9A227";
            return (
              <button
                key={s}
                onClick={() => handleAction(s)}
                disabled={!!loading}
                className="text-[11px] font-semibold px-3 py-1 rounded-lg border transition-all disabled:opacity-50"
                style={{ color, borderColor: `${color}40`, background: isLoading ? `${color}18` : `${color}0a` }}
              >
                {isLoading ? t("action_processing") : label}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
