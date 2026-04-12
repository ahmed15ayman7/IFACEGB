import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Kill switch helpers
export async function isKillSwitchActive(target = "platform"): Promise<boolean> {
  try {
    const val = await redis.get(`kill_switch:${target}`);
    return val === "1";
  } catch {
    return false;
  }
}

export async function activateKillSwitch(target = "platform"): Promise<void> {
  await redis.set(`kill_switch:${target}`, "1");
}

export async function deactivateKillSwitch(target = "platform"): Promise<void> {
  await redis.del(`kill_switch:${target}`);
}
