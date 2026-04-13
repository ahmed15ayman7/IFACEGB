import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Coins, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";

export default async function EmployeeWalletPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.employeeWallet");

  if (!session?.user) redirect(`/${locale}/auth/login`);

  const wallet = await prisma.wallet.findFirst({
    where: { ownerId: session.user.id, walletType: "EmployeeWallet" },
  });

  const transactions = wallet
    ? await prisma.coinTransaction.findMany({
        where: {
          OR: [{ senderWalletId: wallet.id }, { receiverWalletId: wallet.id }],
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { initiator: { select: { name: true } } },
      })
    : [];

  const isRtl = locale === "ar";
  const balance = wallet ? Number(wallet.balanceCoins) : 0;
  const reserved = wallet ? Number(wallet.reservedCoins) : 0;
  const available = balance - reserved;

  const TYPE_COLORS: Record<string, string> = {
    credit: "#22c55e",
    salary: "#22c55e",
    bonus: "#C9A227",
    withdrawal: "#ef4444",
    debit: "#ef4444",
    transfer: "#3b82f6",
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.1)] text-[#C9A227]">
          <Coins className="size-5" strokeWidth={1.4} aria-hidden />
        </div>
        <h1
          className="text-xl font-bold text-[#C9A227]"
          style={{ fontFamily: "var(--font-eb-garamond)" }}
        >
          {t("title")}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[rgba(201,162,39,0.18)] bg-sovereign-card p-6">
          <p className="text-xs text-[#6e7d93] mb-1">{t("balance")}</p>
          <p className="text-4xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {available.toLocaleString()}
          </p>
          <p className="text-xs text-[#6e7d93] mt-1">coins</p>
        </div>
        <div className="rounded-2xl border border-[rgba(168,181,200,0.12)] bg-sovereign-card p-6">
          <p className="text-xs text-[#6e7d93] mb-1">{t("reserved")}</p>
          <p className="text-4xl font-bold text-[#A8B5C8]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {reserved.toLocaleString()}
          </p>
          <p className="text-xs text-[#6e7d93] mt-1">coins</p>
        </div>
      </div>

      <div>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("history_title")}
        </h2>

        {transactions.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6e7d93]">{t("empty_history")}</p>
        ) : (
          <div className="rounded-xl border border-[rgba(201,162,39,0.12)] overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-[rgba(10,31,61,0.8)] border-b border-[rgba(201,162,39,0.1)]">
                  {[t("col_date"), t("col_type"), t("col_amount"), t("col_reason"), t("col_status")].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6e7d93] uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(201,162,39,0.06)]">
                {transactions.map((txn) => {
                  const isSender = txn.senderWalletId === wallet?.id;
                  const amount = Number(txn.amountCoins);
                  const color = TYPE_COLORS[txn.type] ?? "#A8B5C8";
                  return (
                    <tr key={txn.id} className="hover:bg-[rgba(201,162,39,0.02)]">
                      <td className="px-4 py-3 text-xs text-[#6e7d93]">
                        {new Date(txn.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color }}>
                          {isSender ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownLeft className="size-3" aria-hidden />}
                          {txn.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color }}>
                        {isSender ? "-" : "+"}{amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6e7d93] max-w-[200px] truncate">
                        {txn.reason?.slice(0, 50) ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: txn.status === "completed" ? "rgba(34,197,94,0.1)" : "rgba(201,162,39,0.1)",
                            color: txn.status === "completed" ? "#22c55e" : "#C9A227",
                          }}
                        >
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {wallet && (
        <WithdrawalForm walletId={wallet.id} maxCoins={available} />
      )}
    </div>
  );
}
