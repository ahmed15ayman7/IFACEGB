"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Coins, Globe, Megaphone, Award, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion/dashboard";

type KPIs = {
  certsToday: number;
  financialFlow: number;
  activeExams: number;
  activeAgents: number;
  pendingDirectives: number;
  criticalAlerts: number;
};

type CardDef = {
  key: keyof KPIs;
  label: string;
  Icon: LucideIcon;
  color: string;
  format?: "coins";
};

const KPI_CARDS: CardDef[] = [
  { key: "certsToday", label: "Certificates Today", Icon: Award, color: "#C9A227" },
  { key: "financialFlow", label: "Financial Flow (Coins)", Icon: Coins, color: "#e8c84a", format: "coins" },
  { key: "activeExams", label: "Active Exams", Icon: ClipboardList, color: "#A8B5C8" },
  { key: "activeAgents", label: "Active Agents", Icon: Globe, color: "#A8B5C8" },
  { key: "pendingDirectives", label: "Pending Directives", Icon: Megaphone, color: "#e8c84a" },
  { key: "criticalAlerts", label: "Critical Alerts (24h)", Icon: AlertTriangle, color: "#9C2A2A" },
];

export function GodViewKPIStrip({ kpis }: { kpis: KPIs }) {
  return (
    <motion.div {...staggerContainer} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {KPI_CARDS.map((card) => {
        const value = kpis[card.key];
        const display =
          card.format === "coins"
            ? value.toLocaleString("en-US", { maximumFractionDigits: 0 })
            : value.toString();
        const Icon = card.Icon;

        return (
          <motion.div
            key={card.key}
            {...staggerItem}
            className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-[rgba(201,162,39,0.08)] text-[#C9A227] border border-[rgba(201,162,39,0.12)]">
                <Icon className="size-[18px]" style={{ color: card.color }} aria-hidden />
              </span>
              {card.key === "criticalAlerts" && value > 0 && (
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
              <p className="text-[#6e7d93] text-xs mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
