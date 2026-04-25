"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";

const GOLD = "#C9A227";

function getStarRating(points: number): number {
  if (points >= 5000) return 5;
  if (points >= 3000) return 4.5;
  if (points >= 1500) return 4;
  if (points >= 500) return 3;
  return 2;
}

type Tier = "legend" | "platinum" | "gold" | "silver" | "bronze";

function getLevel(points: number): Tier {
  if (points >= 5000) return "legend";
  if (points >= 3000) return "platinum";
  if (points >= 1500) return "gold";
  if (points >= 500) return "silver";
  return "bronze";
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          className={
            s <= Math.floor(rating)
              ? "fill-[#C9A227] text-[#C9A227]"
              : s <= rating
                ? "fill-[#C9A227]/50 text-[#C9A227]"
                : "text-[#334155]"
          }
        />
      ))}
    </div>
  );
}

export interface ExcellenceBoardCardProps {
  badge: string;
  name: string;
  subtitle: string;
  kickerPoints: number;
  tierLabel: (key: Tier) => string;
  rank?: string;
  mode: "rank" | "avatar";
  avatarUrl: string | null;
  nameInitial: string;
  isRTL: boolean;
  metrics: { value: string; label: string }[];
  motionDelay?: number;
}

export function ExcellenceBoardCard({
  badge,
  name,
  subtitle,
  kickerPoints,
  tierLabel,
  rank = "1",
  mode,
  avatarUrl,
  nameInitial,
  isRTL,
  metrics,
  motionDelay = 0,
}: ExcellenceBoardCardProps) {
  const level = getLevel(kickerPoints);
  const starRating = getStarRating(kickerPoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: motionDelay }}
      className="h-full"
    >
      <div
        className="relative flex flex-col items-center gap-4 p-5 sm:p-6 rounded-2xl border bg-[#0A0F1A] h-full"
        style={{
          borderColor: GOLD,
          boxShadow: "0 0 32px rgba(201,162,39,0.18), 0 0 64px rgba(201,162,39,0.06)",
        }}
      >
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-[#C9A227] text-black text-[10px] sm:text-xs font-bold text-center max-w-[min(100%,220px)] leading-tight">
          {badge}
        </div>

        {mode === "rank" ? (
          <div
            className="relative mt-2 w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{
              borderColor: GOLD,
              boxShadow: "0 0 20px rgba(201,162,39,0.35)",
            }}
          >
            {rank}
          </div>
        ) : (
          <div className="relative mt-2">
            <div
              className="w-20 h-20 rounded-full overflow-hidden border-4"
              style={{ borderColor: GOLD }}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full bg-[#C9A227]/20 flex items-center justify-center text-[#C9A227] text-2xl font-bold"
                >
                  {nameInitial}
                </div>
              )}
            </div>
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ boxShadow: "0 0 20px rgba(201,162,39,0.4)" }}
            />
          </div>
        )}

        <div className="text-center w-full min-h-0 grow flex flex-col">
          <h3
            className="text-base sm:text-lg font-bold text-white mb-0.5 line-clamp-2"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {name}
          </h3>
          <p
            className="text-[#94A3B8] text-xs sm:text-sm line-clamp-2"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <StarRating rating={starRating} />
          <span className="text-[#C9A227] text-[10px] sm:text-xs font-medium">{tierLabel(level)}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full mt-auto pt-1">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="flex flex-col items-center p-2 rounded-xl bg-[#0F172A] border border-[#1E293B] min-w-0"
            >
              <span className="text-[#C9A227] text-sm sm:text-base font-bold tabular-nums truncate max-w-full">
                {m.value}
              </span>
              <span className="text-[#64748B] text-[9px] sm:text-[10px] text-center leading-tight mt-0.5 line-clamp-2">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
