/**
 * In-memory Token Bucket Anti-Spam & Burst Rate Limiter for Messaging 2.0
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const userBuckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  capacity?: number;       // Maximum burst tokens (default: 15)
  refillRate?: number;     // Tokens added per second (default: 2)
}

export function checkMessageRateLimit(
  userId: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remainingTokens: number; retryAfterSec?: number } {
  const capacity = options.capacity ?? 15;
  const refillRate = options.refillRate ?? 2; // 2 messages per second sustained
  const now = Date.now();

  let bucket = userBuckets.get(userId);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    userBuckets.set(userId, bucket);
  }

  // Calculate tokens to refill
  const elapsedSec = (now - bucket.lastRefill) / 1000;
  const refilled = elapsedSec * refillRate;
  bucket.tokens = Math.min(capacity, bucket.tokens + refilled);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, remainingTokens: Math.floor(bucket.tokens) };
  }

  const missingTokens = 1 - bucket.tokens;
  const retryAfterSec = Math.ceil(missingTokens / refillRate);
  return { allowed: false, remainingTokens: 0, retryAfterSec };
}
