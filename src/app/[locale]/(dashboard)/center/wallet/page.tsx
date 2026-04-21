import { auth } from "@/lib/auth/auth.config";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { TransactionType } from "@prisma/client";

export default async function CenterWalletPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.centerPortal");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (session.user.role !== "center") {
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));
  }

  const wallet = await prisma.wallet.findFirst({ where: { ownerId: session.user.id } });

  const transactions = wallet
    ? await prisma.coinTransaction.findMany({
        where: { senderWalletId: wallet.id, receiverWalletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    : [];

  const balance = wallet ? Number(wallet.balanceCoins) : 0;
  const reserved = wallet ? Number(wallet.reservedCoins ?? 0) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("wallet_title")}
        </h1>
        <p className="text-[#A8B5C8] mt-1 text-sm">{t("wallet_subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[rgba(201,162,39,0.06)] border border-[rgba(201,162,39,0.2)] rounded-xl p-5">
          <p className="text-[#6e7d93] text-xs mb-2">{t("balance")}</p>
          <p className="text-[#C9A227] text-3xl font-bold">{balance.toLocaleString()}</p>
          <p className="text-[#6e7d93] text-xs mt-1">coins</p>
        </div>
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-5">
          <p className="text-[#6e7d93] text-xs mb-2">{t("reserved")}</p>
          <p className="text-[#A8B5C8] text-3xl font-bold">{reserved.toLocaleString()}</p>
          <p className="text-[#6e7d93] text-xs mt-1">coins</p>
        </div>
      </div>

      {wallet && <WithdrawalForm walletId={wallet.id} maxCoins={balance - reserved} />}

      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(201,162,39,0.1)] rounded-xl p-6">
        <h2 className="text-[#A8B5C8] font-semibold mb-4">{t("recent_tx")}</h2>
        {transactions.length === 0 ? (
          <EmptyState compact />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-[rgba(6,15,30,0.4)] rounded-lg"
              >
                <div>
                  <p className="text-white text-sm capitalize">{tx.type.replace(/_/g, " ")}</p>
                  {tx.reason && <p className="text-[#6e7d93] text-xs">{tx.reason}</p>}
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === TransactionType.external_income ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {tx.type === TransactionType.external_income ? "+" : "-"}
                    {Number(tx.amountCoins).toLocaleString()}
                  </p>
                  <p className="text-[#6e7d93] text-xs">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
