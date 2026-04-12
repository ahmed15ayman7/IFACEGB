"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Award, BarChart3, Plus, Users, Wallet } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion/dashboard";

const ICONS = {
  plus: Plus,
  users: Users,
  wallet: Wallet,
  award: Award,
  chart: BarChart3,
} as const;

export type SectorQuickActionIcon = keyof typeof ICONS;

export type SectorQuickAction = {
  href: string;
  label: string;
  icon: SectorQuickActionIcon;
};

export function SectorQuickActions({ actions }: { actions: SectorQuickAction[] }) {
  return (
    <motion.div
      {...staggerContainer}
      className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5 space-y-3"
    >
      <h3
        className="text-[#C9A227] font-semibold"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        Quick Actions
      </h3>
      {actions.map((action) => {
        const Icon = ICONS[action.icon];
        return (
          <motion.div key={action.href} {...staggerItem}>
            <Link
              href={action.href}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[rgba(201,162,39,0.06)] transition-colors group"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-[rgba(201,162,39,0.08)] text-[#C9A227] border border-[rgba(201,162,39,0.15)]">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm text-[#A8B5C8] group-hover:text-[#C9A227] transition-colors">
                {action.label}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
