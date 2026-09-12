import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  getRateLimitHeaders,
  RATE_LIMIT_POLICIES,
} from '../../apps/web/src/lib/rate-limit/sliding-window';

describe('TUKUBI Sliding Window Rate Limiter', () => {
  const testIp = '192.168.1.105';

  it('allows requests within policy limits', async () => {
    const result = await checkRateLimit(testIp, 'auth');
    expect(result.success).toBe(true);
    expect(result.limit).toBe(RATE_LIMIT_POLICIES.auth.limit);
    expect(result.remaining).toBeLessThan(result.limit);
    expect(result.retryAfter).toBe(0);
  });

  it('generates standard RFC compliant rate limit headers', async () => {
    const result = await checkRateLimit(testIp, 'api');
    const headers = getRateLimitHeaders(result);

    expect(headers['X-RateLimit-Limit']).toBe(result.limit.toString());
    expect(headers['X-RateLimit-Remaining']).toBeDefined();
    expect(headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('blocks excess requests when threshold is breached', async () => {
    const burstIp = `test-burst-${Date.now()}`;
    const authLimit = RATE_LIMIT_POLICIES.auth.limit;

    // Consume all tokens
    for (let i = 0; i < authLimit; i++) {
      const res = await checkRateLimit(burstIp, 'auth');
      expect(res.success).toBe(true);
    }

    // Next request must be rejected with 429 semantics
    const blocked = await checkRateLimit(burstIp, 'auth');
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);

    const headers = getRateLimitHeaders(blocked);
    expect(headers['Retry-After']).toBeDefined();
    expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
  });
});
