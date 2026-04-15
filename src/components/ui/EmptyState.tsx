"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Inbox, SearchX, FileX, BellOff, Activity } from "lucide-react";

type EmptyVariant =
  | "default"
  | "no_results"
  | "no_records"
  | "no_activity"
  | "no_notifications";

interface EmptyStateProps {
  /** Preset variant — picks icon + title + description automatically */
  variant?: EmptyVariant;
  /** Override the icon */
  icon?: LucideIcon;
  /** Override the title */
  title?: string;
  /** Override the description */
  description?: string;
  /** Optional CTA button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Compact mode — less vertical padding, smaller text */
  compact?: boolean;
  className?: string;
}

const VARIANT_ICONS: Record<EmptyVariant, LucideIcon> = {
  default: Inbox,
  no_results: SearchX,
  no_records: FileX,
  no_activity: Activity,
  no_notifications: BellOff,
};

export default function EmptyState({
  variant = "default",
  icon: IconOverride,
  title,
  description,
  action,
  compact = false,
  className = "",
}: EmptyStateProps) {
  const t = useTranslations("empty_state");

  const Icon = IconOverride ?? VARIANT_ICONS[variant];

  const resolvedTitle =
    title ??
    t(
      variant === "default"
        ? "default_title"
        : variant === "no_results"
          ? "no_results"
          : variant === "no_records"
            ? "no_records"
            : variant === "no_activity"
              ? "no_activity"
              : "no_notifications"
    );

  const resolvedDesc =
    description ??
    t(
      variant === "default"
        ? "default_description"
        : variant === "no_results"
          ? "no_results_description"
          : variant === "no_records"
            ? "no_records_description"
            : variant === "no_activity"
              ? "no_activity_description"
              : "no_notifications_description"
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-8 px-4" : "py-16 px-6"} ${className}`}
    >
      {/* Icon halo */}
      <div
        className={`${compact ? "w-12 h-12 mb-3" : "w-16 h-16 mb-5"} rounded-2xl flex items-center justify-center`}
        style={{
          background:
            "radial-gradient(circle, rgba(201,162,39,0.12) 0%, rgba(201,162,39,0.03) 100%)",
          border: "1px solid rgba(201,162,39,0.15)",
        }}
      >
        <Icon
          className={`${compact ? "w-5 h-5" : "w-7 h-7"} text-[#C9A227] opacity-80`}
          strokeWidth={1.5}
        />
      </div>

      {/* Text */}
      <p className={`font-semibold text-white/70 ${compact ? "text-sm" : "text-base"} mb-1`}>
        {resolvedTitle}
      </p>
      {resolvedDesc && (
        <p className={`text-white/35 ${compact ? "text-xs" : "text-sm"} max-w-xs leading-relaxed`}>
          {resolvedDesc}
        </p>
      )}

      {/* CTA */}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-[#C9A227]/10 border border-white/10 hover:border-[#C9A227]/30 text-white/60 hover:text-[#C9A227] transition-all"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
