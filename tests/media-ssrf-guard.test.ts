import { describe, it, expect } from 'vitest';
import {
  isPrivateIpv4,
  isPrivateIpv6,
  assertSafeUrl,
  isSafePublicUrl,
  SsrfSecurityError,
} from '../packages/media/src/content-resolver/ssrf-guard';

describe('Media SSRF Guard & IP Verification', () => {
  describe('isPrivateIpv4', () => {
    it('identifies RFC 1918 private IPv4 networks', () => {
      expect(isPrivateIpv4('10.0.0.1')).toBe(true);
      expect(isPrivateIpv4('172.16.0.1')).toBe(true);
      expect(isPrivateIpv4('172.31.255.254')).toBe(true);
      expect(isPrivateIpv4('192.168.1.1')).toBe(true);
    });

    it('identifies loopback and link-local cloud metadata IPs', () => {
      expect(isPrivateIpv4('127.0.0.1')).toBe(true);
      expect(isPrivateIpv4('169.254.169.254')).toBe(true);
      expect(isPrivateIpv4('0.0.0.0')).toBe(true);
    });

    it('permits public internet IPv4 addresses', () => {
      expect(isPrivateIpv4('8.8.8.8')).toBe(false);
      expect(isPrivateIpv4('1.1.1.1')).toBe(false);
      expect(isPrivateIpv4('104.21.50.2')).toBe(false);
    });
  });

  describe('isSafePublicUrl', () => {
    it('allows safe public URLs', () => {
      expect(isSafePublicUrl('https://youtube.com/watch?v=123')).toBe(true);
      expect(isSafePublicUrl('https://spotify.com/track/456')).toBe(true);
      expect(isSafePublicUrl('https://tukubi.com')).toBe(true);
    });

    it('rejects internal IP literals, loopbacks, and cloud metadata', () => {
      expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(isSafePublicUrl('http://127.0.0.1:8080/admin')).toBe(false);
      expect(isSafePublicUrl('http://localhost:3000')).toBe(false);
      expect(isSafePublicUrl('http://metadata.google.internal')).toBe(false);
      expect(isSafePublicUrl('http://192.168.0.1/router')).toBe(false);
    });

    it('rejects disallowed protocols and credentials in URL', () => {
      expect(isSafePublicUrl('file:///etc/passwd')).toBe(false);
      expect(isSafePublicUrl('ftp://example.com')).toBe(false);
      expect(isSafePublicUrl('https://user:password@example.com')).toBe(false);
    });
  });

  describe('assertSafeUrl', () => {
    it('throws SsrfSecurityError for blocked hosts', async () => {
      await expect(assertSafeUrl('http://169.254.169.254')).rejects.toThrow(SsrfSecurityError);
      await expect(assertSafeUrl('http://localhost:5432')).rejects.toThrow(SsrfSecurityError);
    });

    it('resolves safe public URL', async () => {
      const url = await assertSafeUrl('https://example.com/stream.mp4');
      expect(url.hostname).toBe('example.com');
    });
  });
});
