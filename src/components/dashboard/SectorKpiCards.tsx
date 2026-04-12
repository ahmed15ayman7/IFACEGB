"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/dashboard";

export type SectorKpi = {
  label: string;
  value: string;
  suffix: string;
  color: string;
};

export function SectorKpiCards({ items }: { items: SectorKpi[] }) {
  return (
    <motion.div
      {...staggerContainer}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
    >
      {items.map((kpi) => (
        <motion.div
          key={kpi.label}
          {...staggerItem}
          className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4"
        >
          <p
            className="text-2xl font-bold"
            style={{ color: kpi.color, fontFamily: "var(--font-eb-garamond)" }}
          >
            {kpi.value}
          </p>
          <p className="text-[#6e7d93] text-xs mt-0.5">{kpi.label}</p>
          <p className="text-[10px] text-[#6e7d93] opacity-60">{kpi.suffix}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
