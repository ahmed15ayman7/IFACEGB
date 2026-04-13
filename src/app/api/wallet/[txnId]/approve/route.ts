import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";

type Params = { params: Promise<{ txnId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { txnId } = await params;

  const txn = await prisma.coinTransaction.findUnique({ where: { id: txnId } });
  if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  if (!txn.requiresMultiSig) return NextResponse.json({ error: "No multi-sig required" }, { status: 400 });
  if (txn.multiSigComplete) return NextResponse.json({ error: "Already approved" }, { status: 400 });

  const signers: string[] = Array.isArray(txn.multiSigSigners) ? (txn.multiSigSigners as string[]) : [];
  if (signers.includes(session.user.id))
    return NextResponse.json({ error: "Already signed by this user" }, { status: 400 });

  const newSigners = [...signers, session.user.id];
  const settings = await prisma.financialSettings.findFirst();
  const required = Number(settings?.multiSigMinSigners ?? 2);
  const isComplete = newSigners.length >= required;

  await prisma.coinTransaction.update({
    where: { id: txnId },
    data: {
      multiSigSigners: newSigners,
      multiSigComplete: isComplete,
      status: isComplete ? "completed" : "pending",
      processedAt: isComplete ? new Date() : undefined,
    },
  });

  if (isComplete && txn.senderWalletId && txn.receiverWalletId) {
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: txn.senderWalletId },
        data: { balanceCoins: { decrement: txn.amountCoins } },
      }),
      prisma.wallet.update({
        where: { id: txn.receiverWalletId },
        data: { balanceCoins: { increment: txn.amountCoins } },
      }),
    ]);
  }

  await logAudit({
    userId: session.user.id,
    action: "multisig_approve",
    entityType: "CoinTransaction",
    entityId: txnId,
    severity: "warning",
    after: { signers: newSigners, complete: isComplete },
  });

  return NextResponse.json({ success: true, complete: isComplete });
}
