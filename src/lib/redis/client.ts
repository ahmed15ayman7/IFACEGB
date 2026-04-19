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

// ─── Global Kill Switch ──────────────────────────────────────────────────────

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

// ─── Per-Sector Lock ─────────────────────────────────────────────────────────

const LOCKED_SECTORS_KEY = "locked_sectors";

export async function lockSector(sectorCode: string): Promise<void> {
  await redis.set(`kill_switch:sector:${sectorCode}`, "1");
  await redis.sadd(LOCKED_SECTORS_KEY, sectorCode);
}

export async function unlockSector(sectorCode: string): Promise<void> {
  await redis.del(`kill_switch:sector:${sectorCode}`);
  await redis.srem(LOCKED_SECTORS_KEY, sectorCode);
}

export async function isSectorLocked(sectorCode: string): Promise<boolean> {
  try {
    const val = await redis.get(`kill_switch:sector:${sectorCode}`);
    return val === "1";
  } catch {
    return false;
  }
}

/** Returns an array of currently locked sector codes */
export async function getLockedSectors(): Promise<string[]> {
  try {
    return await redis.smembers(LOCKED_SECTORS_KEY);
  } catch {
    return [];
  }
}
