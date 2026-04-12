import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/audit.service";

/**
 * Monthly Auto-Reconciliation — 8 exact steps from desc.txt §5.3
 * Triggered by cron on last day of each month at midnight
 */
export async function runReconciliation(runBy?: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0, 23, 59, 59);

  // Upsert reconciliation record
  const rec = await prisma.monthlyReconciliation.upsert({
    where: { periodYear_periodMonth: { periodYear: year, periodMonth: month } },
    update: { status: "processing", runBy },
    create: { periodYear: year, periodMonth: month, status: "processing", runBy },
  });

  try {
    // ── Step 1: Determine period ─────────────────────────────
    // Already done above

    // ── Step 2: Calculate external revenue ──────────────────
    const revenueResult = await prisma.coinTransaction.aggregate({
      where: {
        type: "external_income",
        status: "completed",
        createdAt: { gte: firstDay, lte: lastDay },
      },
      _sum: { amountCoins: true },
    });
    const totalRevenue = Number(revenueResult._sum.amountCoins ?? 0);

    // ── Step 3: Calculate total expenses ────────────────────
    // 3a. Base salaries
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { bonuses: { where: { status: "pending" } } },
    });
    const totalSalaries = employees.reduce((s, e) => s + Number(e.salaryBase), 0);

    // 3b. Pending bonuses
    const totalBonuses = employees.reduce(
      (s, e) => s + e.bonuses.reduce((bs, b) => bs + Number(b.amountCoins), 0),
      0
    );

    // 3c. Internal invoices
    const invoiceResult = await prisma.internalInvoice.aggregate({
      where: { isPaid: false, createdAt: { gte: firstDay, lte: lastDay } },
      _sum: { amountCoins: true },
    });
    const totalInvoices = Number(invoiceResult._sum.amountCoins ?? 0);

    // 3d. Expenses
    const expenseResult = await prisma.expense.aggregate({
      where: { date: { gte: firstDay, lte: lastDay } },
      _sum: { amount: true },
    });
    const totalExpenses =
      totalSalaries + totalBonuses + totalInvoices + Number(expenseResult._sum.amount ?? 0);

    // ── Step 4: Net profit ───────────────────────────────────
    const netProfit = Math.max(totalRevenue - totalExpenses, 0);

    // ── Step 5: Distribute employee profit shares ────────────
    let employeeShareTotal = 0;
    for (const emp of employees) {
      const basePct = Number(emp.profitSharePct) / 100;
      const kineticBonus = Number(emp.kineticBonus) / 100;
      const totalPct = basePct + kineticBonus;
      const share = netProfit * totalPct;

      if (share > 0) {
        employeeShareTotal += share;

        // Find employee wallet
        const wallet = await prisma.wallet.findFirst({
          where: { ownerId: emp.userId, walletType: "EmployeeWallet" },
        });
        if (wallet) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balanceCoins: { increment: share } },
          });
          await prisma.coinTransaction.create({
            data: {
              receiverWalletId: wallet.id,
              initiatedBy: runBy ?? "system",
              type: "profit_share",
              status: "completed",
              amountCoins: share,
              reason: `Monthly Profit Share — ${year}/${month}`,
              processedAt: new Date(),
            },
          });
        }

        // Mark bonuses as paid
        if (emp.bonuses.length > 0) {
          await prisma.bonus.updateMany({
            where: { employeeId: emp.id, status: "pending" },
            data: { status: "paid", paidAt: new Date() },
          });
        }
      }
    }

    // ── Step 6: Transfer remainder to CentralTreasury ────────
    const treasuryTransfer = netProfit - employeeShareTotal;
    if (treasuryTransfer > 0) {
      const treasury = await prisma.wallet.findFirst({
        where: { walletType: "CentralTreasury" },
      });
      if (treasury) {
        await prisma.wallet.update({
          where: { id: treasury.id },
          data: { balanceCoins: { increment: treasuryTransfer } },
        });
        await prisma.coinTransaction.create({
          data: {
            receiverWalletId: treasury.id,
            initiatedBy: runBy ?? "system",
            type: "profit_share",
            status: "completed",
            amountCoins: treasuryTransfer,
            reason: `Treasury Transfer — ${year}/${month}`,
            processedAt: new Date(),
          },
        });
      }
    }

    // ── Step 7: Reset all sector wallet balances ─────────────
    await prisma.wallet.updateMany({
      where: { walletType: "SectorWallet" },
      data: { balanceCoins: 0, reservedCoins: 0 },
    });

    // ── Step 8: Generate report + update record ───────────────
    const snapshot = {
      period: `${year}-${String(month).padStart(2, "0")}`,
      totalRevenue,
      totalExpenses,
      netProfit,
      employeeShareTotal,
      treasuryTransfer,
      employeeCount: employees.length,
    };

    await prisma.monthlyReconciliation.update({
      where: { id: rec.id },
      data: {
        status: "completed",
        totalRevenue,
        totalExpenses,
        netProfit,
        employeeShareTotal,
        treasuryTransfer,
        reportSnapshotJson: snapshot,
        completedAt: new Date(),
      },
    });

    await logAudit({
      userId: runBy,
      action: "reconciliation_complete",
      entityType: "MonthlyReconciliation",
      entityId: rec.id,
      severity: "info",
      after: snapshot,
    });

    return { success: true, snapshot };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await prisma.monthlyReconciliation.update({
      where: { id: rec.id },
      data: { status: "failed", errorMessage: msg },
    });
    await logAudit({
      userId: runBy,
      action: "reconciliation_failed",
      entityType: "MonthlyReconciliation",
      entityId: rec.id,
      severity: "critical",
      after: { error: msg },
    });
    throw error;
  }
}
