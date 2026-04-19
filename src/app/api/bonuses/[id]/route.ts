import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import { logAudit } from "@/lib/audit/audit.service";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["approve", "pay", "reject"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin", "admin"].includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { action } = parsed.data;

  const existing = await prisma.bonus.findUnique({ where: { id }, select: { id: true, status: true, amountCoins: true, employeeId: true } });
  if (!existing) return NextResponse.json({ error: "Bonus not found" }, { status: 404 });

  const newStatus = action === "approve" ? "approved" : action === "pay" ? "paid" : "rejected";

  const updated = await prisma.bonus.update({
    where: { id },
    data: {
      status: newStatus,
      approvedBy: action !== "reject" ? session.user.id : undefined,
      paidAt: action === "pay" ? new Date() : undefined,
    },
  });

  // If marking as paid, credit the employee wallet
  if (action === "pay") {
    const employee = await prisma.employee.findUnique({ where: { id: existing.employeeId }, select: { userId: true } });
    if (employee) {
      await prisma.wallet.updateMany({
        where: { ownerId: employee.userId, walletType: "EmployeeWallet" },
        data: { balanceCoins: { increment: existing.amountCoins } },
      });
      // Record transaction
      await prisma.coinTransaction.create({
        data: {
          receiverWalletId: (await prisma.wallet.findFirst({ where: { ownerId: employee.userId, walletType: "EmployeeWallet" }, select: { id: true } }))?.id ?? "",
          initiatedBy: employee.userId,
          type: "bonus",
          amountCoins: existing.amountCoins,
          status: "completed",
          reason: `Bonus payment #${id}`,
        },
      }).catch(() => null);
    }
  }

  await logAudit({
    userId: session.user.id,
    action: `bonus_${action}`,
    entityType: "Bonus",
    entityId: id,
    severity: action === "reject" ? "warning" : "info",
    after: { status: newStatus },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ success: true, status: newStatus, bonus: updated });
}
