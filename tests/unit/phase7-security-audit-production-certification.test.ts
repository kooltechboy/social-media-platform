import { describe, it, expect } from 'vitest';
import { sanitizeRedirectUrl } from '../../apps/web/src/lib/auth/redirect-utils';
import { isPrivateIpv4 } from '../../packages/media/src/content-resolver/ssrf-guard';
import { checkRateLimit, getRateLimitHeaders } from '../../apps/web/src/lib/rate-limit/sliding-window';

describe('Phase 7 — Security Audit, Penetration Resistance & Auth Hardening Certification', () => {
  // ===========================================================================
  // 1. OWASP A01: Broken Access Control & Open-Redirect Immunity
  // ===========================================================================
  describe('1. Open-Redirect Prevention & URL Sanitization (OWASP A01)', () => {
    it('deflects protocol-relative open-redirect vectors', () => {
      expect(sanitizeRedirectUrl('//malicious.com')).toBe('/');
      expect(sanitizeRedirectUrl('///malicious.com/evil')).toBe('/');
    });

    it('deflects absolute scheme injection attacks', () => {
      expect(sanitizeRedirectUrl('https://evil.com/login')).toBe('/');
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/');
      expect(sanitizeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/');
    });

    it('deflects backslash normalization bypasses (CVE pattern)', () => {
      expect(sanitizeRedirectUrl('/\\evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('/foo\\bar')).toBe('/');
    });

    it('deflects path traversal and directory escape attempts', () => {
      expect(sanitizeRedirectUrl('/../etc/passwd')).toBe('/');
      expect(sanitizeRedirectUrl('/explore/../../hidden')).toBe('/');
    });

    it('deflects CRLF and null-byte injection', () => {
      expect(sanitizeRedirectUrl('/explore\r\nSet-Cookie: session=evil')).toBe('/');
      expect(sanitizeRedirectUrl('/messages\0hidden')).toBe('/');
    });

    it('rejects arbitrary unwhitelisted external paths', () => {
      expect(sanitizeRedirectUrl('/secret-admin-door')).toBe('/');
      expect(sanitizeRedirectUrl('/api/internal/debug')).toBe('/');
    });

    it('safely allows whitelisted internal application destinations with queries', () => {
      expect(sanitizeRedirectUrl('/explore')).toBe('/explore');
      expect(sanitizeRedirectUrl('/explore?q=reggae&country=JAM')).toBe('/explore?q=reggae&country=JAM');
      expect(sanitizeRedirectUrl('/messages/conv-123')).toBe('/messages/conv-123');
      expect(sanitizeRedirectUrl('/marketplace/products/101')).toBe('/marketplace/products/101');
      expect(sanitizeRedirectUrl('/settings')).toBe('/settings');
    });
  });

  // ===========================================================================
  // 2. OWASP A10: Server-Side Request Forgery (SSRF) Protection
  // ===========================================================================
  describe('2. Server-Side Request Forgery (SSRF) IP Filtering (OWASP A10)', () => {
    it('blocks internal localhost loopback addresses (127.0.0.0/8)', () => {
      expect(isPrivateIpv4('127.0.0.1')).toBe(true);
      expect(isPrivateIpv4('127.0.0.2')).toBe(true);
      expect(isPrivateIpv4('127.255.255.255')).toBe(true);
    });

    it('blocks RFC 1918 private network spaces (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)', () => {
      // 10.0.0.0/8
      expect(isPrivateIpv4('10.0.0.1')).toBe(true);
      expect(isPrivateIpv4('10.254.1.1')).toBe(true);

      // 172.16.0.0/12
      expect(isPrivateIpv4('172.16.0.1')).toBe(true);
      expect(isPrivateIpv4('172.31.255.255')).toBe(true);

      // 192.168.0.0/16
      expect(isPrivateIpv4('192.168.0.1')).toBe(true);
      expect(isPrivateIpv4('192.168.1.254')).toBe(true);
    });

    it('blocks Cloud Provider Instance Metadata Service (IMDS: 169.254.169.254)', () => {
      expect(isPrivateIpv4('169.254.169.254')).toBe(true);
      expect(isPrivateIpv4('169.254.0.1')).toBe(true);
    });

    it('blocks Carrier-Grade NAT (100.64.0.0/10) and Multicast spaces', () => {
      expect(isPrivateIpv4('100.64.0.1')).toBe(true);
      expect(isPrivateIpv4('100.127.255.255')).toBe(true);
      expect(isPrivateIpv4('224.0.0.1')).toBe(true); // Multicast
    });

    it('permits valid public routable IP addresses', () => {
      expect(isPrivateIpv4('8.8.8.8')).toBe(false); // Google Public DNS
      expect(isPrivateIpv4('1.1.1.1')).toBe(false); // Cloudflare DNS
      expect(isPrivateIpv4('104.244.42.1')).toBe(false); // Public CDN
    });
  });

  // ===========================================================================
  // 3. OWASP A04: Brute-Force & Sliding Window Rate Limiting
  // ===========================================================================
  describe('3. Multi-Tier Rate Limiting & Denial-of-Service Defense (OWASP A04)', () => {
    it('provides standard rate limit headers on responses', async () => {
      const result = await checkRateLimit('198.51.100.42', 'burst');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('limit');

      const headers = getRateLimitHeaders(result);
      expect(headers).toHaveProperty('X-RateLimit-Limit');
      expect(headers).toHaveProperty('X-RateLimit-Remaining');
      expect(headers).toHaveProperty('X-RateLimit-Reset');
    });

    it('enforces stricter thresholds for auth endpoints compared to general api', async () => {
      const authResult = await checkRateLimit('198.51.100.99', 'auth');
      const apiResult = await checkRateLimit('198.51.100.99', 'api');

      // Auth limit must be tighter than general API limit
      expect(authResult.limit).toBeLessThan(apiResult.limit);
    });
  });
});
