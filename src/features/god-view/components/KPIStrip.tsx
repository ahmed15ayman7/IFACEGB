"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Coins,
  Globe,
  Megaphone,
  Award,
  ClipboardList,
  BadgeCheck,
  GraduationCap,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion/dashboard";

export type GodViewKPIs = {
  certsToday: number;
  financialFlow: number;
  activeExams: number;
  activeAgents: number;
  pendingDirectives: number;
  successfulDirectives: number;
  trainers: number;
  centers: number;
  criticalAlerts: number;
};

type CardDef = {
  dataKey: keyof GodViewKPIs;
  labelKey: string;
  path: string;
  Icon: LucideIcon;
  color: string;
  format?: "coins";
};

const KPI_CARDS: CardDef[] = [
  { dataKey: "criticalAlerts", labelKey: "kpiCriticalAlerts", path: "critical-alerts", Icon: AlertTriangle, color: "#9C2A2A" },
  { dataKey: "pendingDirectives", labelKey: "kpiPendingDirectives", path: "pending-directives", Icon: Megaphone, color: "#e8c84a" },
  { dataKey: "successfulDirectives", labelKey: "kpiSuccessfulDirectives", path: "successful-directives", Icon: BadgeCheck, color: "#4ade80" },
  { dataKey: "activeAgents", labelKey: "kpiActiveAgents", path: "agents", Icon: Globe, color: "#A8B5C8" },
  { dataKey: "activeExams", labelKey: "kpiActiveExams", path: "exams", Icon: ClipboardList, color: "#A8B5C8" },
  { dataKey: "financialFlow", labelKey: "kpiFinancialFlow", path: "financial", Icon: Coins, color: "#e8c84a", format: "coins" },
  { dataKey: "certsToday", labelKey: "kpiCertsToday", path: "certificates", Icon: Award, color: "#C9A227" },
  { dataKey: "trainers", labelKey: "kpiTrainers", path: "trainers", Icon: GraduationCap, color: "#67e8f9" },
  { dataKey: "centers", labelKey: "kpiCenters", path: "centers", Icon: Building2, color: "#a78bfa" },
];

export function GodViewKPIStrip({ kpis }: { kpis: GodViewKPIs }) {
  const t = useTranslations("dashboard.godView");
  const locale = useLocale();

  return (
    <motion.div
      {...staggerContainer}
      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {KPI_CARDS.map((card) => {
        const value = kpis[card.dataKey];
        const display =
          card.format === "coins"
            ? value.toLocaleString("en-US", { maximumFractionDigits: 0 })
            : value.toString();
        const Icon = card.Icon;
        const href = `/${locale}/god-view/kpi/${card.path}`;

        return (
          <motion.div key={card.dataKey} {...staggerItem} className="h-full min-h-0">
            <Link
              href={href}
              className="block h-full rounded-xl border border-[rgba(201,162,39,0.12)] bg-sovereign-card p-4 flex flex-col gap-2 transition-all hover:border-[rgba(201,162,39,0.35)] hover:bg-[rgba(6,15,30,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A227]"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[rgba(201,162,39,0.08)] text-[#C9A227] border border-[rgba(201,162,39,0.12)]">
                  <Icon className="size-[18px]" style={{ color: card.color }} aria-hidden />
                </span>
                {card.dataKey === "criticalAlerts" && value > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#9C2A2A] animate-pulse" />
                )}
              </div>
              <div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: card.color, fontFamily: "var(--font-eb-garamond)" }}
                >
                  {display}
                </p>
                <p className="text-[#6e7d93] text-xs mt-0.5 leading-snug">{t(card.labelKey)}</p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
