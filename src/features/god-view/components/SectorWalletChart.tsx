"use client";

import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Wallet = {
  id: string;
  balanceCoins: number | string;
  sector: { nameEn: string; color: string } | null;
};

export function SectorWalletChart({ wallets }: { wallets: Wallet[] }) {
  const data = wallets.map((w) => ({
    name: w.sector?.nameEn?.split(" ")[0] ?? "N/A",
    balance: Number(w.balanceCoins),
    color: w.sector?.color ?? "#C9A227",
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-5"
    >
      <h3
        className="text-[#C9A227] font-semibold mb-5 flex items-center gap-2"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.15)]">
          <Briefcase className="size-4" aria-hidden />
        </span>
        Sector Wallet Balances
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: "#6e7d93", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6e7d93", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              background: "#0A1F3D",
              border: "1px solid rgba(201,162,39,0.3)",
              borderRadius: 8,
              color: "#A8B5C8",
              fontSize: 12,
            }}
            formatter={(value) => [`${Number(value).toLocaleString()} coins`, "Balance"]}
          />
          <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
