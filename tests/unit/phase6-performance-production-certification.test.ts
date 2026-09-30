import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('Phase 6 — Performance & Resource Utilization Production Certification', () => {
  const rootDir = join(__dirname, '../..');
  const nextConfigPath = join(rootDir, 'apps/web/next.config.js');
  const serverAuthPath = join(rootDir, 'apps/web/src/lib/supabase/server.ts');
  const reelsViewerPath = join(rootDir, 'apps/web/src/components/reels/reels-feed-viewer.tsx');
  const feedStreamPath = join(rootDir, 'apps/web/src/components/feed-stream.tsx');

  // ===========================================================================
  // 1. Next.js Bundle & Media Delivery Optimization
  // ===========================================================================
  describe('1. Next.js Config Performance & Tree-Shaking', () => {
    it('verifies modern image formats (AVIF, WebP) are enabled in next.config.js', () => {
      expect(existsSync(nextConfigPath)).toBe(true);
      const content = readFileSync(nextConfigPath, 'utf-8');

      expect(content).toContain("'image/avif'");
      expect(content).toContain("'image/webp'");
      expect(content).toContain('deviceSizes:');
      expect(content).toContain('imageSizes:');
    });

    it('verifies package import optimization is configured for heavy libraries', () => {
      const content = readFileSync(nextConfigPath, 'utf-8');
      expect(content).toContain('optimizePackageImports');
      expect(content).toContain('lucide-react');
      expect(content).toContain('@caribbean/ui');
      expect(content).toContain('@caribbean/design-system');
    });

    it('verifies strict Content Security Policy limits connect-src endpoints', () => {
      const content = readFileSync(nextConfigPath, 'utf-8');
      expect(content).toContain('connect-src');
      expect(content).toContain('api.stripe.com');
      expect(content).toContain('api.paypal.com');
    });
  });

  // ===========================================================================
  // 2. Server-Side Request Memoization (React 19 cache)
  // ===========================================================================
  describe('2. Server-Side Request Caching & Zero-Redundancy Auth', () => {
    it('verifies getCurrentUser is wrapped in React cache() to prevent duplicate database hits', () => {
      expect(existsSync(serverAuthPath)).toBe(true);
      const content = readFileSync(serverAuthPath, 'utf-8');

      expect(content).toContain("import { cache } from 'react'");
      expect(content).toContain('export const getCurrentUser = cache(');
      expect(content).toContain('auth.getUser()');
    });
  });

  // ===========================================================================
  // 3. Reels & Feed GPU Decoder Protection
  // ===========================================================================
  describe('3. Mobile GPU Texture & Memory Leak Prevention', () => {
    it('verifies reels viewer restricts video mounting strictly to active and adjacent viewports', () => {
      expect(existsSync(reelsViewerPath)).toBe(true);
      const content = readFileSync(reelsViewerPath, 'utf-8');

      // Prevents mounting all 50+ video elements at once which crashes iOS/Android WebViews
      expect(content).toContain('isActive || isNext');
      expect(content).toContain('<video');
    });

    it('verifies feed stream cleans up only its own realtime channel without disrupting global subscriptions', () => {
      expect(existsSync(feedStreamPath)).toBe(true);
      const content = readFileSync(feedStreamPath, 'utf-8');

      expect(content).toContain("c.topic.includes('feed_realtime_posts')");
      expect(content).toContain('supabase.removeChannel(ch)');
      // Must not indiscriminately wipe all open channels across the whole client
      expect(content).not.toContain('supabase.getChannels().forEach(ch => supabase.removeChannel(ch))');
    });
  });
});
