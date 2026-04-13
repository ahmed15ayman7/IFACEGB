import { auth } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/prisma";
import { getRoleHomePath } from "@/lib/auth/role-home";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Coins, ArrowUpRight, ArrowDownLeft, Shield } from "lucide-react";

const ALLOWED = ["sector_manager", "admin", "super_admin"];
type Props = { params: Promise<{ slug: string }> };

export default async function SectorWalletPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.sectorPortal");
  const tf = await getTranslations("dashboard.finance");

  if (!session?.user) redirect(`/${locale}/auth/login`);
  if (!ALLOWED.includes(session.user.role))
    redirect(getRoleHomePath(locale, session.user.role, session.user.sectorId ?? null));

  const sector = await prisma.sector.findFirst({
    where: { OR: [{ code: slug }, { id: slug }] },
    select: { id: true, nameEn: true, nameAr: true },
  });
  if (!sector) notFound();

  const wallet = await prisma.wallet.findFirst({
    where: { sectorId: sector.id, walletType: "SectorWallet" },
  });

  const transactions = wallet
    ? await prisma.coinTransaction.findMany({
        where: {
          OR: [{ senderWalletId: wallet.id }, { receiverWalletId: wallet.id }],
        },
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { initiator: { select: { name: true } } },
      })
    : [];

  const isRtl = locale === "ar";
  const sectorName = isRtl ? (sector.nameAr ?? sector.nameEn) : sector.nameEn;
  const balance = wallet ? Number(wallet.balanceCoins) : 0;
  const reserved = wallet ? Number(wallet.reservedCoins) : 0;
  const available = balance - reserved;

  const COLS = [tf("col_type"), tf("col_owner"), tf("col_balance"), tf("col_status"), "Date"];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/sector/${slug}`}
          className="text-xs text-[#6e7d93] hover:text-[#C9A227] inline-flex items-center gap-1 transition-colors"
        >
          {isRtl ? <ArrowRight className="size-3.5" aria-hidden /> : <ArrowLeft className="size-3.5" aria-hidden />}
          {sectorName}
        </Link>
        <span className="text-[#6e7d93] opacity-40">·</span>
        <div className="flex items-center gap-2">
          <Coins className="size-4 text-[#C9A227]" aria-hidden />
          <h1
            className="text-lg font-bold text-[#C9A227]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            {t("wallet_title")}
          </h1>
        </div>
      </div>

      <p className="text-xs text-[#6e7d93]">{t("wallet_subtitle")}</p>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[rgba(201,162,39,0.18)] bg-[rgba(6,15,30,0.7)] p-5">
          <p className="text-xs text-[#6e7d93] mb-1">Total Balance</p>
          <p className="text-4xl font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {balance.toLocaleString()}
          </p>
          <p className="text-xs text-[#6e7d93] mt-1">coins</p>
        </div>
        <div className="rounded-2xl border border-[rgba(168,181,200,0.15)] bg-[rgba(6,15,30,0.7)] p-5">
          <p className="text-xs text-[#6e7d93] mb-1">Available</p>
          <p className="text-4xl font-bold text-[#22c55e]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
            {available.toLocaleString()}
          </p>
          <p className="text-xs text-[#6e7d93] mt-1">coins</p>
        </div>
        <div className="rounded-2xl border border-[rgba(168,181,200,0.12)] bg-[rgba(6,15,30,0.7)] p-5">
          <p className="text-xs text-[#6e7d93] mb-1">Reserved</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-[#A8B5C8]" style={{ fontFamily: "var(--font-eb-garamond)" }}>
              {reserved.toLocaleString()}
            </p>
            {wallet?.isLocked && (
              <Shield className="size-4 text-red-400 mb-1" aria-hidden />
            )}
          </div>
          <p className="text-xs text-[#6e7d93] mt-1">{wallet?.isLocked ? tf("status_locked") : tf("status_active")}</p>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-[#C9A227] font-semibold mb-3" style={{ fontFamily: "var(--font-eb-garamond)" }}>
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6e7d93]">No transactions yet.</p>
        ) : (
          <div className="rounded-xl border border-[rgba(201,162,39,0.12)] overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="bg-[rgba(10,31,61,0.8)] border-b border-[rgba(201,162,39,0.1)]">
                  {["Type", "Amount", "Initiated by", "Reason", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6e7d93] uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(201,162,39,0.06)]">
                {transactions.map((txn) => {
                  const isIncoming = txn.receiverWalletId === wallet?.id;
                  const amount = Number(txn.amountCoins);
                  return (
                    <tr key={txn.id} className="hover:bg-[rgba(201,162,39,0.02)]">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs ${isIncoming ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {isIncoming ? <ArrowDownLeft className="size-3" aria-hidden /> : <ArrowUpRight className="size-3" aria-hidden />}
                          {txn.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: isIncoming ? "#22c55e" : "#ef4444" }}>
                        {isIncoming ? "+" : "-"}{amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6e7d93]">{txn.initiator.name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-[#6e7d93] max-w-[180px] truncate">
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
                      <td className="px-4 py-3 text-xs text-[#6e7d93]">
                        {new Date(txn.createdAt).toLocaleDateString(isRtl ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
