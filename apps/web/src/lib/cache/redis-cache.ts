/**
 * TUKUBI Distributed Cache Layer
 * Supports Upstash Redis REST protocol with in-memory TTL fallback.
 * Guarantees zero downtime: cache errors fail gracefully without halting DB queries.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

// Periodic in-memory eviction
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        memoryCache.delete(key);
      }
    }
  }, 30000).unref?.();
}

/**
 * Retrieves a cached value. Returns null if missing, expired, or on failure.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const prefixedKey = `tukubi:cache:${key}`;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash Redis check
  if (url && token) {
    try {
      const res = await fetch(`${url}/get/${encodeURIComponent(prefixedKey)}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(1000),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.result) {
          return typeof body.result === 'string' ? JSON.parse(body.result) as T : body.result as T;
        }
      }
    } catch {
      // Fall through to memory check on Redis error
    }
  }

  // 2. In-Memory fallback
  const entry = memoryCache.get(prefixedKey);
  if (entry) {
    if (entry.expiresAt > Date.now()) {
      return entry.value as T;
    }
    memoryCache.delete(prefixedKey);
  }

  return null;
}

/**
 * Stores a value in the cache with a specified TTL in seconds.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 60
): Promise<void> {
  const prefixedKey = `tukubi:cache:${key}`;
  const serialized = JSON.stringify(value);
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash Redis set with EX
  if (url && token) {
    try {
      await fetch(`${url}/set/${encodeURIComponent(prefixedKey)}/${encodeURIComponent(serialized)}?EX=${ttlSeconds}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(1000),
      });
    } catch {
      // Non-blocking error
    }
  }

  // 2. In-Memory backup
  memoryCache.set(prefixedKey, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Deletes a cached entry by key.
 */
export async function cacheDelete(key: string): Promise<void> {
  const prefixedKey = `tukubi:cache:${key}`;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      await fetch(`${url}/del/${encodeURIComponent(prefixedKey)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(1000),
      });
    } catch {
      // Non-blocking error
    }
  }

  memoryCache.delete(prefixedKey);
}
