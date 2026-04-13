import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const schema = z.object({
  walletId: z.string().min(1),
  amountCoins: z.number().positive(),
  reason: z.string().min(3),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { walletId, amountCoins, reason } = parsed.data;

  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

  // Ownership check
  if (wallet.ownerId !== session.user.id && !["admin", "super_admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const available = Number(wallet.balanceCoins) - Number(wallet.reservedCoins);
  if (amountCoins > available)
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

  const settings = await prisma.financialSettings.findFirst();
  const threshold = Number(settings?.multiSigThreshold ?? 50000);
  const requiresMultiSig = amountCoins > threshold;

  const centralWallet = await prisma.wallet.findFirst({ where: { walletType: "CentralTreasury" } });

  const txn = await prisma.coinTransaction.create({
    data: {
      senderWalletId: walletId,
      receiverWalletId: centralWallet?.id ?? walletId,
      initiatedBy: session.user.id,
      type: "withdrawal",
      amountCoins,
      reason,
      status: "pending",
      requiresMultiSig,
      multiSigSigners: [],
    },
  });

  // Reserve coins
  await prisma.wallet.update({
    where: { id: walletId },
    data: { reservedCoins: { increment: amountCoins } },
  });

  await logAudit({
    userId: session.user.id,
    action: "withdrawal_request",
    entityType: "CoinTransaction",
    entityId: txn.id,
    severity: requiresMultiSig ? "warning" : "info",
    after: { walletId, amountCoins, reason, requiresMultiSig },
  });

  return NextResponse.json({ success: true, txn, requiresMultiSig }, { status: 201 });
}
