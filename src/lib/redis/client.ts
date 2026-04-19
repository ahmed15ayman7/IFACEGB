import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 3000,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Suppress unhandled error events (ioredis emits them on connection failure)
redis.on("error", () => {/* silently swallow — DB is the source of truth */});

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
  try {
    await redis.set(`kill_switch:${target}`, "1");
  } catch {
    // non-fatal — DB is source of truth
  }
}

export async function deactivateKillSwitch(target = "platform"): Promise<void> {
  try {
    await redis.del(`kill_switch:${target}`);
  } catch {
    // non-fatal
  }
}

// ─── Per-Sector Lock ─────────────────────────────────────────────────────────

const LOCKED_SECTORS_KEY = "locked_sectors";

export async function lockSector(sectorCode: string): Promise<void> {
  try {
    await redis.set(`kill_switch:sector:${sectorCode}`, "1");
    await redis.sadd(LOCKED_SECTORS_KEY, sectorCode);
  } catch {
    // non-fatal — DB is source of truth
  }
}

export async function unlockSector(sectorCode: string): Promise<void> {
  try {
    await redis.del(`kill_switch:sector:${sectorCode}`);
    await redis.srem(LOCKED_SECTORS_KEY, sectorCode);
  } catch {
    // non-fatal
  }
}

export async function isSectorLocked(sectorCode: string): Promise<boolean> {
  try {
    const val = await redis.get(`kill_switch:sector:${sectorCode}`);
    return val === "1";
  } catch {
    return false;
  }
}

/** Returns an array of currently locked sector codes (cache layer, may be stale) */
export async function getLockedSectors(): Promise<string[]> {
  try {
    return await redis.smembers(LOCKED_SECTORS_KEY);
  } catch {
    return [];
  }
}
