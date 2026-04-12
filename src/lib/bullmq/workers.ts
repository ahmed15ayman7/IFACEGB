import { Queue, Worker } from "bullmq";
import { redis } from "@/lib/redis/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/audit.service";

const connection = { host: process.env.REDIS_HOST ?? "localhost", port: 6379 };

// ── Queues ────────────────────────────────────────────────
export const fraudDetectorQueue = new Queue("fraud-detector", { connection });
export const slaMonitorQueue = new Queue("sla-monitor", { connection });
export const performanceTrackerQueue = new Queue("track-daily-performance", { connection });
export const licenseRenewalQueue = new Queue("license-renewal", { connection });

// ── Fraud Detector Worker ─────────────────────────────────
export const fraudDetectorWorker = new Worker(
  "fraud-detector",
  async (job) => {
    const { transactionId, amountCoins, walletId, userId } = job.data;

    // Simple anomaly detection: flag if > 10x 7-day average
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const avg = await prisma.coinTransaction.aggregate({
      where: {
        senderWalletId: walletId,
        status: "completed",
        createdAt: { gte: sevenDaysAgo },
      },
      _avg: { amountCoins: true },
    });

    const avgAmount = Number(avg._avg.amountCoins ?? 0);
    const threshold = Math.max(avgAmount * 10, 100000);

    if (amountCoins > threshold) {
      await logAudit({
        userId,
        action: "fraud_flag",
        entityType: "CoinTransaction",
        entityId: transactionId,
        severity: "critical",
        after: { amountCoins, avgAmount, threshold },
      });

      // Emit to god-view via Redis pub/sub
      await redis.publish("god-view:alert", JSON.stringify({
        type: "alert:fraud",
        data: { transactionId, userId, amountCoins, avgAmount },
      }));
    }
  },
  { connection }
);

// ── SLA Monitor Worker ────────────────────────────────────
export const slaMonitorWorker = new Worker(
  "sla-monitor",
  async () => {
    const now = new Date();
    const overdue = await prisma.serviceRequest.findMany({
      where: {
        status: { in: ["pending", "in_progress", "acknowledged"] },
        slaDeadline: { lt: now },
      },
      include: { sector: { select: { id: true } } },
    });

    for (const req of overdue) {
      await prisma.serviceRequest.update({
        where: { id: req.id },
        data: { status: "escalated" },
      });

      if (req.toSectorId) {
        await redis.publish(`sector:${req.toSectorId}:alert`, JSON.stringify({
          type: "alert:sla-breach",
          data: { requestId: req.id, title: req.titleEn },
        }));
      }
    }

    return { escalated: overdue.length };
  },
  { connection }
);

// ── Daily Performance Tracker ──────────────────────────────
export const performanceTrackerWorker = new Worker(
  "track-daily-performance",
  async (job) => {
    const { employeeId } = job.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targets = await prisma.performanceTarget.findMany({
      where: { employeeId, isAchieved: false },
    });

    for (const target of targets) {
      if (Number(target.achievedValue) >= Number(target.targetValue) * 1.2) {
        // 120% achievement — add kinetic bonus
        await prisma.employee.update({
          where: { id: employeeId },
          data: {
            kineticPoints: { increment: 10 },
            kineticBonus: { increment: 0.03 },
          },
        });

        await prisma.performanceTarget.update({
          where: { id: target.id },
          data: { isAchieved: true },
        });
      }
    }
  },
  { connection }
);

// Schedule SLA monitor to run every 15 minutes
let slaScheduled = false;
export function scheduleSLAMonitor() {
  if (slaScheduled) return;
  slaScheduled = true;

  setInterval(async () => {
    await slaMonitorQueue.add("check", {}, { removeOnComplete: true });
  }, 15 * 60 * 1000);

  console.log("[BullMQ] SLA monitor scheduled every 15 minutes");
}
