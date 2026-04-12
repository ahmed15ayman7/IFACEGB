import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transferCoins, creditExternalIncome } from "@/lib/wallet/wallet.service";
import { auth } from "@/lib/auth/auth.config";
import { z } from "zod";

const transferSchema = z.object({
  fromWalletId: z.string(),
  toWalletId: z.string(),
  amountCoins: z.number().positive(),
  type: z.enum(["internal_transfer", "bonus", "profit_share", "fee", "withdrawal", "refund"]),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
});

const creditSchema = z.object({
  sectorId: z.string(),
  amountCoins: z.number().positive(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "transfer") {
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    try {
      const txn = await transferCoins({
        ...parsed.data,
        initiatedBy: session.user.id,
      });
      return NextResponse.json({ success: true, txn });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transfer failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (action === "credit_income") {
    if (!["super_admin", "admin", "sector_manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = creditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await creditExternalIncome({ ...parsed.data, initiatedBy: session.user.id });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const walletId = searchParams.get("walletId");

  if (walletId) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        sentTxns: { orderBy: { createdAt: "desc" }, take: 20 },
        receivedTxns: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    return NextResponse.json(wallet);
  }

  const wallets = await prisma.wallet.findMany({
    where: { ownerId: session.user.id },
  });
  return NextResponse.json(wallets);
}
