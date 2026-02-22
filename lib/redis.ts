import Redis from "ioredis";

// Singleton Redis client with graceful degradation
// If REDIS_URL is not set, all cache operations are no-ops.

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
    if (!process.env.REDIS_URL) return null;

    if (!redisClient) {
        redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            connectTimeout: 3000,
            lazyConnect: true,
            enableOfflineQueue: false,
        });

        redisClient.on("error", (err) => {
            // Log but don't crash — app should degrade gracefully
            console.warn("[Redis] Connection error:", err.message);
        });
    }

    return redisClient;
}

// Helpers -------------------------------------------------------------------

export async function cacheGet(key: string): Promise<string | null> {
    try {
        const redis = getRedis();
        if (!redis) return null;
        return await redis.get(key);
    } catch {
        return null;
    }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
        const redis = getRedis();
        if (!redis) return;
        await redis.set(key, value, "EX", ttlSeconds);
    } catch {
        // Swallow — cache write failure should never break the app
    }
}

export async function cacheDel(...keys: string[]): Promise<void> {
    try {
        const redis = getRedis();
        if (!redis) return;
        await redis.del(...keys);
    } catch {
        // Swallow
    }
}

/**
 * Invalidate all keys matching a pattern (e.g., "resume-list:*").
 * Uses SCAN so it's safe on large Redis instances.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
    try {
        const redis = getRedis();
        if (!redis) return;
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } while (cursor !== "0");
    } catch {
        // Swallow
    }
}
