import cron from "node-cron";
import { runReconciliation } from "@/lib/reconciliation/reconciliation.service";

let initialized = false;

export function startReconciliationCron() {
  if (initialized) return;
  initialized = true;

  // Run at midnight on days 28-31; check if it's actually the last day
  cron.schedule("0 0 28-31 * *", async () => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if (today.getDate() !== lastDay.getDate()) return;

    console.log("[Reconciliation] Starting monthly auto-reconciliation...");
    try {
      const result = await runReconciliation("system-cron");
      console.log("[Reconciliation] Complete:", result.snapshot);
    } catch (err) {
      console.error("[Reconciliation] Failed:", err);
    }
  });

  console.log("[Cron] Monthly reconciliation cron registered");
}
