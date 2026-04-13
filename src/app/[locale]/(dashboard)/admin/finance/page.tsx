import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { MultiSigApprovalPanel } from "@/components/dashboard/MultiSigApprovalPanel";
import { ReconciliationButton } from "@/components/dashboard/ReconciliationButton";

export default async function AdminFinancePage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.finance");
  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!["super_admin", "admin"].includes(session.user.role)) {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const [wallets, recentTxns, reconciliations, settings, pendingMultiSig] = await Promise.all([
    prisma.wallet.findMany({
      include: { owner: { select: { name: true } }, sector: { select: { nameEn: true } } },
      orderBy: { walletType: "asc" },
    }),
    prisma.coinTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        initiator: { select: { name: true } },
        senderWallet: { include: { sector: { select: { nameEn: true } } } },
        receiverWallet: { include: { sector: { select: { nameEn: true } } } },
      },
    }),
    prisma.monthlyReconciliation.findMany({
      orderBy: { periodYear: "desc" },
      take: 12,
    }),
    prisma.financialSettings.findFirst(),
    prisma.coinTransaction.findMany({
      where: { requiresMultiSig: true, multiSigComplete: false },
      orderBy: { createdAt: "desc" },
      include: { initiator: { select: { name: true } } },
    }),
  ]);

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balanceCoins), 0);

  const headers = [t("col_type"), t("col_owner"), t("col_balance"), t("col_reserved"), t("col_status")];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("title")}
        </h1>
        <ReconciliationButton />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {totalBalance.toLocaleString()}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{t("total_coins")}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#A8B5C8]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {Number(settings?.vatPercent ?? 14)}%
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{t("vat_rate")}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#e8c84a]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {Number(settings?.multiSigThreshold ?? 50000).toLocaleString()}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{t("multisig_threshold")}</p>
        </div>
        <div className="bg-sovereign-card rounded-xl border border-[rgba(201,162,39,0.12)] p-4">
          <p className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {reconciliations.filter((r) => r.status === "completed").length}
          </p>
          <p className="text-[#6e7d93] text-xs mt-1">{t("reconciliations_done")}</p>
        </div>
      </div>

      <MultiSigApprovalPanel
        transactions={pendingMultiSig.map((txn) => ({
          ...txn,
          amountCoins: String(txn.amountCoins),
          createdAt: txn.createdAt.toISOString(),
          multiSigSigners: Array.isArray(txn.multiSigSigners) ? (txn.multiSigSigners as string[]) : null,
        }))}
      />

      <div>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("wallets")}
        </h2>
        <div className="rounded-xl border border-[rgba(201,162,39,0.12)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[rgba(10,31,61,0.8)] border-b border-[rgba(201,162,39,0.1)]">
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6e7d93] uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,162,39,0.06)]">
              {wallets.map((w) => (
                <tr key={w.id} className="hover:bg-[rgba(201,162,39,0.03)]">
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[rgba(201,162,39,0.2)] text-[#C9A227]">
                      {w.walletType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#A8B5C8] text-xs">
                    {w.sector?.nameEn ?? w.owner.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[#C9A227] font-mono text-sm">
                    {Number(w.balanceCoins).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[#6e7d93] font-mono text-xs">
                    {Number(w.reservedCoins).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block mr-1"
                      style={{ background: w.isLocked ? "#9C2A2A" : "#22c55e" }}
                    />
                    <span className="text-xs text-[#6e7d93]">
                      {w.isLocked ? t("status_locked") : t("status_active")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("recent_txns")}
        </h2>
        <div className="space-y-2">
          {recentTxns.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between py-3 px-4 rounded-xl border border-[rgba(201,162,39,0.08)] bg-[rgba(6,15,30,0.4)] hover:bg-[rgba(6,15,30,0.6)] transition-colors"
            >
              <div>
                <p className="text-xs font-medium text-[#A8B5C8]">
                  {txn.type} — <span className="text-[#6e7d93]">{txn.reason?.slice(0, 40) ?? "—"}</span>
                </p>
                <p className="text-[10px] text-[#6e7d93] mt-0.5">
                  {txn.initiator.name} · {new Date(txn.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-sm font-bold font-mono"
                  style={{ color: Number(txn.amountCoins) > 0 ? "#C9A227" : "#9C2A2A" }}
                >
                  {Number(txn.amountCoins).toLocaleString()} {t("coins")}
                </p>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: txn.status === "completed" ? "rgba(34,197,94,0.1)" : "rgba(201,162,39,0.1)",
                    color: txn.status === "completed" ? "#22c55e" : "#C9A227",
                  }}
                >
                  {txn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
