"use client";

import { motion } from "framer-motion";
import { publicEase } from "@/lib/motion/public";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  align?: "center" | "start";
  className?: string;
  /** Replace default icon frame size (e.g. sector hero: `!size-24 sm:!size-28 rounded-3xl`). */
  iconFrameClassName?: string;
};

export function PublicPageHeader({
  title,
  subtitle,
  eyebrow,
  children,
  align = "center",
  className,
  iconFrameClassName,
}: Props) {
  const isCenter = align === "center";

  return (
    <header className={cn("relative mb-10 sm:mb-12", isCenter ? "text-center" : "text-start", className)}>
      {children && (
        <motion.div
          className={cn("mb-5 flex", isCenter ? "justify-center" : "justify-start")}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: publicEase }}
        >
          <motion.div
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl border border-[rgba(201,162,39,0.22)] bg-[rgba(201,162,39,0.08)] text-[#C9A227] shadow-[0_12px_40px_rgba(0,0,0,0.2)] sm:size-16",
              iconFrameClassName
            )}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}

      {eyebrow && (
        <motion.p
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6e7d93]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: publicEase }}
        >
          {eyebrow}
        </motion.p>
      )}

      <motion.h1
        className="text-3xl font-bold leading-tight tracking-tight text-[#C9A227] sm:text-4xl lg:text-[2.65rem]"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: publicEase }}
      >
        {title}
      </motion.h1>

      {subtitle && (
        <motion.p
          className={cn(
            "mt-3 text-sm leading-relaxed text-[#A8B5C8] sm:text-base",
            isCenter ? "mx-auto max-w-xl" : "max-w-2xl"
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14, ease: publicEase }}
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div
        className={cn("mt-6 h-px w-20 bg-gradient-to-r from-transparent via-[rgba(201,162,39,0.45)] to-transparent sm:w-24", isCenter ? "mx-auto" : "")}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.55, delay: 0.22, ease: publicEase }}
      />
    </header>
  );
}
