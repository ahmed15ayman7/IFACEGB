import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Coins, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";
import { format } from "date-fns";

const ALLOWED_ROLES = ["super_admin", "admin", "sector_manager"] as const;

export default async function GeneralAdminWalletPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.generalAdmin");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])) {
    redirect(`/${locale}/dashboard`);
  }

  const isRtl = locale === "ar";

  const sector = await prisma.sector.findFirst({ where: { code: "general-admin" } });
  const wallet = sector
    ? await prisma.wallet.findFirst({ where: { sectorId: sector.id } })
    : null;

  const transactions = wallet
    ? await prisma.coinTransaction.findMany({
        where: { OR: [{ senderWalletId: wallet.id }, { receiverWalletId: wallet.id }] },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { initiator: { select: { name: true } } },
      })
    : [];

  const balance = wallet ? Number(wallet.balanceCoins ?? 0) : 0;
  const reserved = wallet ? Number(wallet.reservedCoins ?? 0) : 0;
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
    <div className="p-4 lg:p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-[rgba(201,162,39,0.25)] bg-[rgba(201,162,39,0.1)] text-[#C9A227]">
          <Coins className="size-5" strokeWidth={1.4} aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {t("wallet_title")}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[rgba(201,162,39,0.18)] bg-sovereign-card p-6">
          <p className="text-xs text-[#6e7d93] mb-1">{isRtl ? "الرصيد المتاح" : "Available Balance"}</p>
          <p className="text-4xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {available.toLocaleString()}
          </p>
          <p className="text-xs text-[#6e7d93] mt-1">coins</p>
        </div>
        <div className="rounded-2xl border border-[rgba(168,181,200,0.12)] bg-sovereign-card p-6">
          <p className="text-xs text-[#6e7d93] mb-1">{isRtl ? "محجوز" : "Reserved"}</p>
          <p className="text-4xl font-bold text-[#A8B5C8]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {reserved.toLocaleString()}
          </p>
          <p className="text-xs text-[#6e7d93] mt-1">coins</p>
        </div>
      </div>

      {wallet && (
        <WithdrawalForm walletId={wallet.id} maxCoins={available} />
      )}

      <div>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          {isRtl ? "سجل المعاملات" : "Transaction History"}
        </h2>

        {transactions.length === 0 ? (
          <p className="text-center text-[#6e7d93] py-10 text-sm">
            {isRtl ? "لا توجد معاملات بعد." : "No transactions yet."}
          </p>
        ) : (
          <div className="rounded-xl border border-[rgba(201,162,39,0.1)] overflow-hidden">
            {transactions.map((tx) => {
              const isSend = tx.senderWalletId === wallet?.id;
              const color = TYPE_COLORS[tx.type ?? "transfer"] ?? "#60a5fa";
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(201,162,39,0.07)] last:border-0 hover:bg-[rgba(201,162,39,0.03)] transition-colors"
                >
                  <div
                    className="size-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20` }}
                  >
                    {isSend ? (
                      <ArrowUpRight size={14} style={{ color }} />
                    ) : (
                      <ArrowDownLeft size={14} style={{ color }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{tx.reason ?? tx.type}</p>
                    <p className="text-xs text-[#6e7d93]">
                      {tx.initiator?.name} · {format(new Date(tx.createdAt), "d MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0" style={{ color }}>
                    {isSend ? "-" : "+"}
                    {Number(tx.amountCoins).toLocaleString()} ¤
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
