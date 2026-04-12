"use client";

import { motion } from "framer-motion";
import { useLocale } from "next-intl";

type Props = { variant?: "default" | "dense" | "minimal" };

/** Soft animated mesh behind public pages (depth without clutter). */
export function PublicAmbient({ variant = "default" }: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const a = variant === "dense" ? 1 : variant === "minimal" ? 0.45 : 0.75;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          background: `radial-gradient(ellipse 85% 50% at 50% -10%, rgba(201,162,39,${0.12 * a}) 0%, transparent 55%)`,
        }}
      />
      <motion.div
        className="absolute -top-24 h-[420px] w-[420px] rounded-full bg-[rgba(201,162,39,0.06)] blur-[100px]"
        style={{ [isRtl ? "right" : "left"]: "-8%" }}
        animate={{ x: isRtl ? [0, -28, 0] : [0, 28, 0], y: [0, 18, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 h-[360px] w-[360px] rounded-full bg-[rgba(80,110,160,0.07)] blur-[90px]"
        style={{ [isRtl ? "left" : "right"]: "-5%" }}
        animate={{ x: isRtl ? [0, 22, 0] : [0, -22, 0], y: [0, -14, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      {variant !== "minimal" && (
        <div className="absolute bottom-0 left-1/2 h-px w-[min(90%,720px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[rgba(201,162,39,0.2)] to-transparent opacity-50" />
      )}
    </div>
  );
}
