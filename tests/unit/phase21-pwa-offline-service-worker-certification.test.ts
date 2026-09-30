import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import manifestGenerator from '../../apps/web/src/app/manifest';
import {
  detectPwaPlatform,
  checkIsStandalone,
  trackPwaEvent,
} from '../../apps/web/src/lib/pwa/use-pwa-install';
import { validateEvent, type AnalyticsEvent } from '../../packages/analytics/src/index';

describe('Phase 21 — PWA, Service Worker & Offline Experience Certification', () => {
  const webRoot = path.resolve(process.cwd(), 'apps/web');

  // ===========================================================================
  // 1. Web App Manifest & Static Brand Assets
  // ===========================================================================
  describe('1. Web App Manifest & Icons Integrity', () => {
    it('generates a compliant PWA manifest with standalone display and theme colors', () => {
      const manifest = manifestGenerator();

      expect(manifest.name).toBe('TUKUBI');
      expect(manifest.short_name).toBe('TUKUBI');
      expect(manifest.description).toBe('The Caribbean Connected.');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('/');
      expect(manifest.theme_color).toBe('#0a0612');
      expect(manifest.background_color).toBe('#060A13');

      // Verify required icons (standard & maskable 192 and 512)
      const icons = manifest.icons || [];
      expect(icons.some((i) => i.sizes === '192x192' && i.purpose !== 'maskable')).toBe(true);
      expect(icons.some((i) => i.sizes === '512x512' && i.purpose !== 'maskable')).toBe(true);
      expect(icons.some((i) => i.sizes === '192x192' && i.purpose === 'maskable')).toBe(true);
      expect(icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable')).toBe(true);
    });

    it('verifies that all referenced icon files physically exist and are non-empty', () => {
      const publicDir = path.join(webRoot, 'public');
      const requiredIconPaths = [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-192.png',
        'icons/icon-maskable-512.png',
        'icons/apple-touch-icon.png',
        'icons/icon.svg',
        'favicon.svg',
      ];

      requiredIconPaths.forEach((rel) => {
        const full = path.join(publicDir, rel);
        expect(fs.existsSync(full), `Missing icon file: ${rel}`).toBe(true);
        expect(fs.statSync(full).size).toBeGreaterThan(50);
      });
    });
  });

  // ===========================================================================
  // 2. Service Worker Offline Strategy & Security Gates
  // ===========================================================================
  describe('2. Service Worker Offline Strategy & Security Shielding', () => {
    const swPath = path.join(webRoot, 'public/sw.js');

    it('verifies sw.js exists in public root', () => {
      expect(fs.existsSync(swPath)).toBe(true);
    });

    it('strictly bypasses caching for APIs, Supabase calls, and financial payment routes', () => {
      const swCode = fs.readFileSync(swPath, 'utf-8');

      // Security bypass rules
      expect(swCode).toContain("url.pathname.startsWith('/api/')");
      expect(swCode).toContain("url.hostname.includes('supabase.co')");
      expect(swCode).toContain("url.pathname.includes('/payments/')");

      // Network-first navigation with offline fallback
      expect(swCode).toContain("request.mode === 'navigate'");
      expect(swCode).toContain('/offline');
    });

    it('verifies dedicated offline route /offline page component exists and contains recovery CTA', () => {
      const offlinePagePath = path.join(webRoot, 'src/app/offline/page.tsx');
      expect(fs.existsSync(offlinePagePath)).toBe(true);

      const pageContent = fs.readFileSync(offlinePagePath, 'utf-8');
      expect(pageContent).toContain("You’re Offline");
      expect(pageContent).toContain('Try Reconnecting');
    });
  });

  // ===========================================================================
  // 3. Platform Detection & Standalone Mode
  // ===========================================================================
  describe('3. Platform Detection & Standalone Mode Verification', () => {
    beforeEach(() => {
      vi.stubGlobal('window', {
        navigator: { userAgent: '', platform: '', maxTouchPoints: 0 },
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        dispatchEvent: vi.fn(),
      });
      vi.stubGlobal('document', { referrer: '' });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('detects iOS Safari environment', () => {
      vi.stubGlobal('window', {
        navigator: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1',
          platform: 'iPhone',
          maxTouchPoints: 5,
        },
      });

      const platform = detectPwaPlatform();
      expect(platform.isIOS).toBe(true);
      expect(platform.isAndroid).toBe(false);
      expect(platform.isSafari).toBe(true);
    });

    it('detects Android Chrome environment', () => {
      vi.stubGlobal('window', {
        navigator: {
          userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        },
      });

      const platform = detectPwaPlatform();
      expect(platform.isAndroid).toBe(true);
      expect(platform.isIOS).toBe(false);
      expect(platform.isChrome).toBe(true);
    });

    it('detects standalone display mode via media query', () => {
      vi.stubGlobal('window', {
        matchMedia: vi.fn((query) => ({
          matches: query === '(display-mode: standalone)',
        })),
        navigator: {},
      });
      expect(checkIsStandalone()).toBe(true);
    });
  });

  // ===========================================================================
  // 4. Analytics & Telemetry Schema
  // ===========================================================================
  describe('4. PWA Installation Analytics & Telemetry', () => {
    it('validates canonical PWA lifecycle telemetry events in @caribbean/analytics', () => {
      const pwaEvents = [
        'pwa_install_prompt_available',
        'pwa_install_prompt_shown',
        'pwa_install_clicked',
        'pwa_install_completed',
        'pwa_install_dismissed',
        'pwa_ios_install_instructions_shown',
        'pwa_already_installed',
      ] as const;

      pwaEvents.forEach((eventName) => {
        const event: AnalyticsEvent = {
          eventName,
          eventVersion: 1,
          userId: 'usr_pwa_tester',
          properties: { platform: 'ios', outcome: 'accepted' },
          occurredAt: new Date().toISOString(),
        };

        const result = validateEvent(event);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('dispatches window custom event during trackPwaEvent call', () => {
      const mockDispatch = vi.fn();
      vi.stubGlobal('window', { dispatchEvent: mockDispatch });

      trackPwaEvent('pwa_install_clicked', { platform: 'android' });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});
