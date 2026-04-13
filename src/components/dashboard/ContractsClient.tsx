"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/dashboard";
import { FileText, PenLine, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { ContractSignModal } from "./ContractSignModal";

type Contract = {
  id: string;
  templateType: string;
  status: string;
  signedAt: string | null;
  createdAt: string;
  electronicSignatures: { signedAt: string; ipAddress: string | null }[];
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  signed: { color: "#22c55e", icon: CheckCircle2 },
  pending: { color: "#C9A227", icon: Clock },
  draft: { color: "#A8B5C8", icon: FileText },
  pending_signature: { color: "#f97316", icon: PenLine },
  expired: { color: "#ef4444", icon: AlertTriangle },
};

export function ContractsClient({ contracts }: { contracts: Contract[] }) {
  const t = useTranslations("dashboard.employeeContracts");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [signing, setSigning] = useState<{ id: string; title: string } | null>(null);

  if (contracts.length === 0) {
    return <p className="py-16 text-center text-sm text-[#6e7d93]">{t("empty")}</p>;
  }

  return (
    <>
      <motion.div {...staggerContainer} className="space-y-3">
        {contracts.map((c) => {
          const { color, icon: Icon } = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
          const needsSign = c.status === "pending" || c.status === "pending_signature";
          return (
            <motion.div
              key={c.id}
              {...staggerItem}
              className="rounded-xl border border-[rgba(201,162,39,0.1)] bg-[rgba(6,15,30,0.5)] p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border"
                  style={{ borderColor: `${color}30`, background: `${color}10`, color }}
                >
                  <Icon className="size-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#C9A227] capitalize">
                    {c.templateType.replace("_", " ")}
                  </p>
                  <p className="text-xs text-[#6e7d93] mt-0.5">
                    {c.signedAt ? `${t("signed_at")} ${new Date(c.signedAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}` : new Date(c.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full border"
                  style={{ color, borderColor: `${color}30`, background: `${color}10` }}
                >
                  {t(`status_${c.status.replace(" ", "_") as "draft"}` as Parameters<typeof t>[0])}
                </span>
                {needsSign && (
                  <button
                    onClick={() => setSigning({ id: c.id, title: c.templateType })}
                    className="h-8 px-3 rounded-lg border border-[rgba(201,162,39,0.3)] bg-[rgba(201,162,39,0.1)] text-xs font-semibold text-[#C9A227] hover:bg-[rgba(201,162,39,0.18)] transition-all inline-flex items-center gap-1.5"
                  >
                    <PenLine className="size-3" aria-hidden />
                    {t("sign_btn")}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {signing && (
        <ContractSignModal
          contractId={signing.id}
          contractTitle={signing.title.replace("_", " ")}
          onClose={() => setSigning(null)}
        />
      )}
    </>
  );
}
