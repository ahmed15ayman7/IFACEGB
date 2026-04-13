"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ShieldCheck, User } from "lucide-react";

type PendingTxn = {
  id: string;
  type: string;
  amountCoins: string;
  reason: string | null;
  initiator: { name: string | null };
  multiSigSigners: string[] | null;
  createdAt: string;
};

export function MultiSigApprovalPanel({ transactions }: { transactions: PendingTxn[] }) {
  const t = useTranslations("dashboard.finance");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [approved, setApproved] = useState<Set<string>>(new Set());

  if (transactions.length === 0) return null;

  async function approve(txnId: string) {
    setLoading(txnId);
    try {
      const res = await fetch(`/api/wallet/${txnId}/approve`, { method: "POST" });
      if (res.ok) {
        setApproved((prev) => new Set([...prev, txnId]));
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <h2
        className="text-[#C9A227] font-semibold mb-3 flex items-center gap-2"
        style={{ fontFamily: "var(--font-eb-garamond)" }}
      >
        <ShieldCheck className="size-5" aria-hidden />
        {t("multisig_pending_title")}
        <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.12)] text-red-400 border border-[rgba(239,68,68,0.2)]">
          {transactions.length}
        </span>
      </h2>

      <div className="space-y-2">
        {transactions.map((txn) => {
          const alreadyApproved = approved.has(txn.id);
          const signers = txn.multiSigSigners ?? [];
          return (
            <div
              key={txn.id}
              className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.04)]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[#C9A227]">{txn.type.replace("_", " ")}</span>
                  <span className="text-sm font-bold text-[#e8c84a] font-mono">
                    {Number(txn.amountCoins).toLocaleString()} {t("coins")}
                  </span>
                </div>
                <p className="text-xs text-[#6e7d93] truncate">
                  {txn.reason?.slice(0, 50) ?? "—"}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-[#6e7d93]">
                  <User className="size-3" aria-hidden />
                  {txn.initiator.name ?? "—"}
                  <span className="ms-2">· {signers.length} signer(s)</span>
                </div>
              </div>
              <button
                onClick={() => approve(txn.id)}
                disabled={!!loading || alreadyApproved}
                className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] text-[#22c55e] transition-all hover:bg-[rgba(34,197,94,0.18)] disabled:opacity-50"
              >
                {loading === txn.id
                  ? t("multisig_approving")
                  : alreadyApproved
                    ? "✓"
                    : t("multisig_approve")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
