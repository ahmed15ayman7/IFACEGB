"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  Star, Trophy, Target, TrendingUp, Coins,
  CheckCircle2, Clock, XCircle, Zap,
} from "lucide-react";

type Bonus = {
  id: string;
  type: string;
  amountCoins: number;
  reason: string | null;
  status: string;
  issuedAt: string;
};

type PerformanceTarget = {
  id: string;
  period: string;
  targetValue: number;
  achievedValue: number;
  bonusPerUnit: number;
  isAchieved: boolean;
  createdAt: string;
};

type Props = {
  kineticPoints: number;
  profitSharePct: number;
  bonuses: Bonus[];
  targets: PerformanceTarget[];
};

// Level thresholds
const LEVELS = [
  { key: "bronze",   min: 0,    max: 499,  color: "#cd7f32", glow: "rgba(205,127,50,0.2)" },
  { key: "silver",   min: 500,  max: 1499, color: "#A8B5C8", glow: "rgba(168,181,200,0.2)" },
  { key: "gold",     min: 1500, max: 3999, color: "#C9A227", glow: "rgba(201,162,39,0.2)" },
  { key: "platinum", min: 4000, max: 9999, color: "#e5e4e2", glow: "rgba(229,228,226,0.2)" },
  { key: "legend",   min: 10000,max: Infinity, color: "#b9f", glow: "rgba(187,153,255,0.2)" },
];

function getLevel(points: number) {
  return LEVELS.find((l) => points >= l.min && points <= l.max) ?? LEVELS[0];
}

const BONUS_STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock }> = {
  pending:  { color: "#C9A227", icon: Clock },
  approved: { color: "#A8B5C8", icon: CheckCircle2 },
  paid:     { color: "#22c55e", icon: CheckCircle2 },
  rejected: { color: "#ef4444", icon: XCircle },
};

export function RewardsClient({ kineticPoints, profitSharePct, bonuses, targets }: Props) {
  const t = useTranslations("dashboard.rewards");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const level = getLevel(kineticPoints);
  const nextLevel = LEVELS.find((l) => l.min > kineticPoints);
  const progressPct = nextLevel
    ? Math.min(100, ((kineticPoints - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const paidTotal = bonuses
    .filter((b) => b.status === "paid")
    .reduce((s, b) => s + b.amountCoins, 0);

  return (
    <div className="space-y-6 pb-10">

      {/* ── Hero: Kinetic Points ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border p-6"
        style={{
          borderColor: `${level.color}30`,
          background: `linear-gradient(135deg, rgba(6,15,30,0.95) 60%, ${level.glow})`,
        }}
      >
        {/* Background glow */}
        <div
          className="pointer-events-none absolute -top-16 -end-16 w-48 h-48 rounded-full blur-3xl opacity-30"
          style={{ background: level.color }}
        />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          {/* Left */}
          <div className="flex items-center gap-4">
            <div
              className="size-16 rounded-2xl flex items-center justify-center border"
              style={{ borderColor: `${level.color}40`, background: `${level.color}15` }}
            >
              <Trophy className="size-8" style={{ color: level.color }} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-white/50 mb-0.5">{t("kinetic_sub")}</p>
              <p
                className="text-5xl font-extrabold leading-none"
                style={{
                  color: level.color,
                  fontFamily: "var(--font-eb-garamond)",
                  textShadow: `0 0 30px ${level.glow}`,
                }}
              >
                {kineticPoints.toLocaleString()}
              </p>
              <p className="text-xs text-white/40 mt-1">{t("kinetic_title")}</p>
            </div>
          </div>

          {/* Right: Level badge */}
          <div className="text-center sm:text-end">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold mb-2"
              style={{ borderColor: `${level.color}40`, color: level.color, background: `${level.color}12` }}
            >
              <Star className="size-4" fill={level.color} />
              {t("level_label")}: {t(`level_${level.key}` as Parameters<typeof t>[0])}
            </div>
            {nextLevel && (
              <p className="text-xs text-white/30">
                {(nextLevel.min - kineticPoints).toLocaleString()} {t("next_level")}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${level.color}80, ${level.color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── KPI Strip ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Coins, label: "Paid bonuses", value: `${paidTotal.toLocaleString()} coins`,
            color: "#22c55e", bg: "rgba(34,197,94,0.08)",
          },
          {
            icon: TrendingUp, label: t("profit_rate"), value: `${profitSharePct}%`,
            color: "#C9A227", bg: "rgba(201,162,39,0.08)",
          },
          {
            icon: Target, label: t("targets_title"),
            value: `${targets.filter((t) => t.isAchieved).length}/${targets.length}`,
            color: "#A8B5C8", bg: "rgba(168,181,200,0.08)",
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/[0.07] p-4 flex items-center gap-3"
            style={{ background: bg }}
          >
            <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
              <Icon className="size-4" style={{ color }} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/40 truncate">{label}</p>
              <p className="text-base font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Performance Targets ──────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-[#C9A227] mb-4 flex items-center gap-2">
          <Target className="size-4" /> {t("targets_title")}
        </h2>
        {targets.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm">{t("targets_empty")}</div>
        ) : (
          <div className="space-y-3">
            {targets.map((tgt) => {
              const pct = tgt.targetValue > 0
                ? Math.min(100, (tgt.achievedValue / tgt.targetValue) * 100)
                : 0;
              const barColor = tgt.isAchieved ? "#22c55e" : "#C9A227";

              return (
                <motion.div
                  key={tgt.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#0d1929] border border-white/[0.07] rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white text-sm font-medium">{tgt.period}</p>
                      <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                        <Zap className="size-3 text-[#C9A227]" />
                        {t("target_bonus_per_unit")}: {Number(tgt.bonusPerUnit).toLocaleString()} coins
                      </p>
                    </div>
                    {tgt.isAchieved ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold bg-[rgba(34,197,94,0.12)] text-green-400 border border-[rgba(34,197,94,0.25)]">
                        <CheckCircle2 className="size-3" /> {t("target_achieved_badge")}
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[rgba(201,162,39,0.1)] text-[#C9A227] border border-[rgba(201,162,39,0.2)]">
                        {t("target_in_progress")}
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-white/50 tabular-nums shrink-0">
                      {tgt.achievedValue.toLocaleString()} / {tgt.targetValue.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Bonus History ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-[#C9A227] mb-4 flex items-center gap-2">
          <Coins className="size-4" /> {t("bonuses_title")}
        </h2>
        {bonuses.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm">{t("bonuses_empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-white/30 uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="py-2 pe-4 font-medium text-start">{t("col_type")}</th>
                  <th className="py-2 pe-4 font-medium text-start">{t("col_reason")}</th>
                  <th className="py-2 pe-4 font-medium text-end">{t("col_amount")}</th>
                  <th className="py-2 pe-4 font-medium text-center">{t("col_status")}</th>
                  <th className="py-2 font-medium text-end">{t("col_date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {bonuses.map((bonus) => {
                  const cfg = BONUS_STATUS_CONFIG[bonus.status] ?? BONUS_STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const typeKey = `bonus_type_${bonus.type}` as Parameters<typeof t>[0];
                  const statusKey = `bonus_status_${bonus.status}` as Parameters<typeof t>[0];

                  return (
                    <tr key={bonus.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pe-4 text-white/70 capitalize">
                        {t(typeKey)}
                      </td>
                      <td className="py-3 pe-4 text-white/40 text-xs max-w-[200px] truncate">
                        {bonus.reason ?? "—"}
                      </td>
                      <td className="py-3 pe-4 text-end font-mono font-semibold" style={{ color: cfg.color }}>
                        +{Number(bonus.amountCoins).toLocaleString()}
                        <span className="text-[10px] text-white/30 ms-1">coins</span>
                      </td>
                      <td className="py-3 pe-4 text-center">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                          style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}
                        >
                          <StatusIcon className="size-2.5" />
                          {t(statusKey)}
                        </span>
                      </td>
                      <td className="py-3 text-end text-xs text-white/30">
                        {new Date(bonus.issuedAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Profit Share ─────────────────────────────────────────────── */}
      <section className="bg-[#0d1929] border border-[rgba(201,162,39,0.15)] rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[#C9A227] mb-3 flex items-center gap-2">
          <TrendingUp className="size-4" /> {t("profit_title")}
        </h2>
        <div className="flex items-center gap-4">
          <div
            className="size-14 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{ color: "#C9A227", background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.2)" }}
          >
            {profitSharePct}%
          </div>
          <div>
            <p className="text-sm text-white font-medium">{t("profit_rate")}</p>
            <p className="text-xs text-white/35 mt-0.5">{t("profit_desc")}</p>
          </div>
        </div>
      </section>

    </div>
  );
}
