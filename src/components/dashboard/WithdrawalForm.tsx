"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowDownLeft } from "lucide-react";

export function WithdrawalForm({ walletId, maxCoins }: { walletId: string; maxCoins: number }) {
  const t = useTranslations("dashboard.employeeWallet");
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputCls =
    "w-full rounded-lg border border-[rgba(201,162,39,0.18)] bg-[rgba(6,15,30,0.7)] px-3 py-2 text-sm text-[#A8B5C8] placeholder-[#6e7d93] focus:outline-none focus:border-[rgba(201,162,39,0.55)]";
  const labelCls = "block text-xs font-medium text-[#6e7d93] mb-1";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const coins = Number(amount);
    if (!coins || coins <= 0) return;
    if (coins > maxCoins) { setError(t("withdraw_max")); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId, amountCoins: coins, reason }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? t("withdraw_error"));
      }
      setSuccess(true);
      setAmount("");
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("withdraw_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[rgba(201,162,39,0.12)] bg-[rgba(6,15,30,0.5)] p-5">
      <h3 className="text-sm font-semibold text-[#C9A227] mb-4 flex items-center gap-2">
        <ArrowDownLeft className="size-4" aria-hidden />
        {t("withdraw_title")}
      </h3>

      {success && (
        <p className="text-sm text-[#22c55e] mb-3">{t("withdraw_success")}</p>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t("withdraw_amount")} *</label>
          <input
            required
            type="number"
            min={1}
            max={maxCoins}
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>{t("withdraw_reason")} *</label>
          <input
            required
            className={inputCls}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {error && <p className="sm:col-span-2 text-sm text-red-400">{error}</p>}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-lg bg-[rgba(201,162,39,0.9)] px-6 text-sm font-semibold text-[#060f1e] hover:bg-[#C9A227] transition-all disabled:opacity-60"
          >
            {loading ? t("withdraw_submitting") : t("withdraw_submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
