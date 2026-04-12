"use client";

import { motion } from "framer-motion";
import { publicEase, publicViewport } from "@/lib/motion/public";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
};

export function PublicGlowCard({ children, className, delay = 0, hover = true }: Props) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(10,31,61,0.45)] backdrop-blur-sm",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={publicViewport}
      transition={{ duration: 0.48, delay, ease: publicEase }}
      whileHover={
        hover
          ? {
              y: -5,
              borderColor: "rgba(201,162,39,0.32)",
              boxShadow: "0 20px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,162,39,0.08)",
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
