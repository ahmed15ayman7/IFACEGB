"use client";

import { motion } from "framer-motion";
import { publicEase, publicViewport } from "@/lib/motion/public";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export function PublicFadeIn({ children, className, delay = 0, y = 22 }: Props) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={publicViewport}
      transition={{ duration: 0.5, delay, ease: publicEase }}
    >
      {children}
    </motion.div>
  );
}
