"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { AuditSeverity } from "@prisma/client";
import { staggerContainer, staggerItem } from "@/lib/motion/dashboard";

type Entry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  severity: AuditSeverity;
  createdAt: Date;
  user: { name: string | null; email: string; role: string } | null;
};

const SEVERITY_STYLE: Record<AuditSeverity, { color: string; dot: string }> = {
  info: { color: "#A8B5C8", dot: "#6e7d93" },
  warning: { color: "#e8c84a", dot: "#C9A227" },
  critical: { color: "#c43535", dot: "#9C2A2A" },
};

export function AuditTrailFeed({ entries }: { entries: Entry[] }) {
  const t = useTranslations("dashboard.godView");

  return (
    <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5">
      <h3
        className="text-[#C9A227] font-semibold mb-4 flex items-center gap-2"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.15)]">
          <Search className="size-4" aria-hidden />
        </span>
        {t("auditTrail")}
      </h3>

      <motion.div {...staggerContainer} className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <p className="text-[#6e7d93] text-sm">{t("auditEmpty")}</p>
        ) : (
          entries.map((entry) => {
            const style = SEVERITY_STYLE[entry.severity];
            return (
              <motion.div
                key={entry.id}
                {...staggerItem}
                className="flex items-start gap-3 py-2 border-b border-[rgba(201,162,39,0.06)] last:border-0"
              >
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: style.dot }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: style.color }}>
                    {entry.action}
                    <span className="text-[#6e7d93] font-normal ms-2">· {entry.entityType}</span>
                  </p>
                  <p className="text-[#6e7d93] text-xs mt-0.5">
                    {entry.user?.name ?? entry.user?.email ?? t("auditSystem")} ·{" "}
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
