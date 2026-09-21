/**
 * TUKUBI Enterprise Sliding Window Rate Limiter
 * Dual-Engine: Upstash Redis REST Protocol (Edge/Serverless) + In-Memory Fallback.
 * Adheres to Fortune-100 anti-DDoS, anti-abuse, and credential-stuffing prevention standards.
 */

export type RateLimitTier = 'api' | 'auth' | 'write' | 'burst';

export interface RateLimitPolicy {
  limit: number;      // Maximum requests allowed
  windowSec: number;  // Time window in seconds
}

export const RATE_LIMIT_POLICIES: Record<RateLimitTier, RateLimitPolicy> = {
  // General public API routes
  api: { limit: 60, windowSec: 60 },
  // Sensitive authentication endpoints: prevents brute-force & credential stuffing
  auth: { limit: 5, windowSec: 60 },
  // Write actions (creating posts, comments, reactions)
  write: { limit: 20, windowSec: 60 },
  // Burst / DDoS protection per IP across all traffic
  burst: { limit: 120, windowSec: 10 },
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;       // Unix timestamp (seconds) when window resets
  retryAfter: number;  // Seconds until next allowed request
}

// In-memory sliding log store for local / non-Redis environments
interface InMemoryEntry {
  timestamps: number[];
}
const localMemoryStore = new Map<string, InMemoryEntry>();

// Housekeeping interval to prevent memory leaks in memory store
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of localMemoryStore.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < 120000);
      if (entry.timestamps.length === 0) {
        localMemoryStore.delete(key);
      }
    }
  }, 60000).unref?.();
}

/**
 * Executes a sliding window rate-limit check using Upstash Redis REST API if credentials exist.
 */
async function checkUpstashRedis(
  key: string,
  policy: RateLimitPolicy,
  now: number
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    const windowStart = now - policy.windowSec * 1000;
    const redisKey = `ratelimit:${key}`;

    // Pipeline: ZREMRANGEBYSCORE, ZADD, ZCARD, EXPIRE via Upstash REST API
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['ZREMRANGEBYSCORE', redisKey, '-inf', windowStart],
        ['ZADD', redisKey, now, `${now}-${Math.random()}`],
        ['ZCARD', redisKey],
        ['EXPIRE', redisKey, policy.windowSec],
      ]),
      // Low timeout so rate-limiting never stalls application requests
      signal: AbortSignal.timeout(1200),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const currentCount = Number(data[2]?.result ?? 1);
    const resetTimeSec = Math.ceil((now + policy.windowSec * 1000) / 1000);

    const remaining = Math.max(0, policy.limit - currentCount);
    const allowed = currentCount <= policy.limit;
    const retryAfter = allowed ? 0 : policy.windowSec;

    return {
      success: allowed,
      limit: policy.limit,
      remaining,
      reset: resetTimeSec,
      retryAfter,
    };
  } catch {
    // If Redis call times out or fails, fail-open to in-memory check
    return null;
  }
}

/**
 * In-memory sliding log algorithm fallback.
 */
function checkInMemory(
  key: string,
  policy: RateLimitPolicy,
  now: number
): RateLimitResult {
  const windowMs = policy.windowSec * 1000;
  const cutoff = now - windowMs;

  let entry = localMemoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    localMemoryStore.set(key, entry);
  }

  // Filter timestamps outside current sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  const currentCount = entry.timestamps.length;
  const resetSec = Math.ceil((now + windowMs) / 1000);

  if (currentCount >= policy.limit) {
    const oldestTimestamp = entry.timestamps[0] || now;
    const retryAfter = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));
    return {
      success: false,
      limit: policy.limit,
      remaining: 0,
      reset: resetSec,
      retryAfter,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    success: true,
    limit: policy.limit,
    remaining: policy.limit - entry.timestamps.length,
    reset: resetSec,
    retryAfter: 0,
  };
}

/**
 * Universal Rate Limiter function.
 * @param identifier Unique caller identifier (User ID, IP address, or token)
 * @param tier Target policy tier ('api' | 'auth' | 'write' | 'burst')
 */
export async function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'api'
): Promise<RateLimitResult> {
  // Allow high throughput on local loopback during automated testing or development
  if (
    (identifier === '127.0.0.1' || identifier === '::1' || identifier === 'localhost') &&
    (process.env.PLAYWRIGHT_TEST === '1' || process.env.NODE_ENV !== 'production' || process.env.CI)
  ) {
    return {
      success: true,
      limit: 10000,
      remaining: 9999,
      reset: Math.ceil(Date.now() / 1000) + 60,
      retryAfter: 0,
    };
  }

  const policy = RATE_LIMIT_POLICIES[tier] || RATE_LIMIT_POLICIES.api;
  const key = `${tier}:${identifier}`;
  const now = Date.now();

  // 1. Try distributed Upstash Redis if configured
  const redisResult = await checkUpstashRedis(key, policy, now);
  if (redisResult) {
    return redisResult;
  }

  // 2. High-performance in-memory fallback
  return checkInMemory(key, policy, now);
}

/**
 * Formats rate limit information into standard HTTP RFC response headers.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success && result.retryAfter > 0) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}
