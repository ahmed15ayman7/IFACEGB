"use client";

import { motion } from "framer-motion";
import { publicEase } from "@/lib/motion/public";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

/** Entrance animation on mount (above-the-fold, no scroll observer). */
export function PublicEnter({ children, className, delay = 0 }: Props) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, delay, ease: publicEase }}
    >
      {children}
    </motion.div>
  );
}
