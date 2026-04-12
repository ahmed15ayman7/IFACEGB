import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/audit.service";
import type { TransactionType } from "@prisma/client";

export class OverdraftError extends Error {
  constructor(available: number, requested: number) {
    super(`Overdraft prevented: available ${available}, requested ${requested}`);
    this.name = "OverdraftError";
  }
}

export async function getWallet(ownerId: string, walletType: "CentralTreasury" | "SectorWallet" | "EmployeeWallet") {
  return prisma.wallet.findFirst({ where: { ownerId, walletType } });
}

/**
 * Transfer coins between two wallets atomically.
 * Guards: overdraft prevention, multi-sig threshold, locked wallet check.
 */
export async function transferCoins({
  fromWalletId,
  toWalletId,
  amountCoins,
  initiatedBy,
  type,
  reason,
  requiresMultiSig = false,
  referenceId,
}: {
  fromWalletId: string;
  toWalletId: string;
  amountCoins: number;
  initiatedBy: string;
  type: TransactionType;
  reason?: string;
  requiresMultiSig?: boolean;
  referenceId?: string;
}) {
  const [fromWallet, toWallet, settings] = await Promise.all([
    prisma.wallet.findUniqueOrThrow({ where: { id: fromWalletId } }),
    prisma.wallet.findUniqueOrThrow({ where: { id: toWalletId } }),
    prisma.financialSettings.findFirst(),
  ]);

  if (fromWallet.isLocked || fromWallet.isHardLocked) {
    throw new Error("Source wallet is locked");
  }

  const available = Number(fromWallet.balanceCoins) - Number(fromWallet.reservedCoins);
  if (available < amountCoins) {
    throw new OverdraftError(available, amountCoins);
  }

  const threshold = Number(settings?.multiSigThreshold ?? 50000);
  const needsMultiSig = amountCoins > threshold || requiresMultiSig;

  // VAT calculation for external income
  const vatPct = Number(settings?.vatPercent ?? 14) / 100;
  const vatAmount = type === "external_income" ? amountCoins * vatPct : 0;

  const txn = await prisma.$transaction(async (tx) => {
    // Deduct from sender
    await tx.wallet.update({
      where: { id: fromWalletId },
      data: { balanceCoins: { decrement: amountCoins } },
    });

    // Credit to receiver (if multi-sig not needed, or already complete)
    if (!needsMultiSig) {
      await tx.wallet.update({
        where: { id: toWalletId },
        data: { balanceCoins: { increment: amountCoins - vatAmount } },
      });
    }

    return tx.coinTransaction.create({
      data: {
        senderWalletId: fromWalletId,
        receiverWalletId: toWalletId,
        initiatedBy,
        type,
        status: needsMultiSig ? "pending" : "completed",
        amountCoins,
        vatAmount,
        reason,
        referenceId,
        requiresMultiSig: needsMultiSig,
        processedAt: needsMultiSig ? null : new Date(),
      },
    });
  });

  await logAudit({
    userId: initiatedBy,
    action: "coin_transfer",
    entityType: "CoinTransaction",
    entityId: txn.id,
    severity: amountCoins > threshold ? "warning" : "info",
    after: { txnId: txn.id, amount: amountCoins, type, needsMultiSig },
  });

  return txn;
}

/**
 * Credit external income to a sector wallet, auto-split via liquidity vault.
 */
export async function creditExternalIncome({
  sectorId,
  amountCoins,
  initiatedBy,
  reason,
}: {
  sectorId: string;
  amountCoins: number;
  initiatedBy: string;
  reason?: string;
}) {
  const [sectorWallet, settings] = await Promise.all([
    prisma.wallet.findFirst({
      where: { sectorId, walletType: "SectorWallet" },
    }),
    prisma.financialSettings.findFirst(),
  ]);

  if (!sectorWallet) throw new Error(`Sector wallet not found for sector ${sectorId}`);

  // Liquidity split: 60% ops, 30% agent, 10% reserve
  const opsAmount = amountCoins * 0.6;
  const agentAmount = amountCoins * 0.3;
  const reserveAmount = amountCoins * 0.1;

  const vatPct = Number(settings?.vatPercent ?? 14) / 100;
  const vatAmount = amountCoins * vatPct;

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: sectorWallet.id },
      data: { balanceCoins: { increment: opsAmount } },
    });

    const txn = await tx.coinTransaction.create({
      data: {
        receiverWalletId: sectorWallet.id,
        initiatedBy,
        type: "external_income",
        status: "completed",
        amountCoins,
        vatAmount,
        reason,
        processedAt: new Date(),
      },
    });

    await tx.liquidityVault.create({
      data: {
        walletId: sectorWallet.id,
        transactionId: txn.id,
        opsAmount,
        agentAmount,
        reserveAmount,
      },
    });

    // Add to sovereign reserve
    const reserve = await tx.sovereignReserveSubAccount.findFirst();
    if (reserve) {
      await tx.sovereignReserveSubAccount.update({
        where: { id: reserve.id },
        data: { totalLocked: { increment: reserveAmount } },
      });
      await tx.reserveDepositLedger.create({
        data: {
          reserveId: reserve.id,
          amountCoins: reserveAmount,
          transactionId: txn.id,
        },
      });
    }
  });
}
