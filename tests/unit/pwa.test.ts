import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import manifestGenerator from '../../apps/web/src/app/manifest';
import {
  detectPwaPlatform,
  checkIsStandalone,
  trackPwaEvent,
} from '../../apps/web/src/lib/pwa/use-pwa-install';
import { validateEvent, type AnalyticsEvent } from '../../packages/analytics/src/index';

describe('TUKUBI PWA Implementation Suite', () => {
  describe('1. Web App Manifest Verification', () => {
    it('generates a valid, production-ready manifest matching TUKUBI branding', () => {
      const manifest = manifestGenerator();

      expect(manifest.name).toBe('TUKUBI');
      expect(manifest.short_name).toBe('TUKUBI');
      expect(manifest.description).toBe('The Caribbean Connected.');
      expect(manifest.start_url).toBe('/');
      expect(manifest.scope).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.orientation).toBe('portrait-primary');
      expect(manifest.theme_color).toBe('#0a0612');
      expect(manifest.background_color).toBe('#060A13');
      expect(manifest.categories).toContain('social');
      expect(manifest.categories).toContain('entertainment');

      // Verify Icons
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons?.length).toBeGreaterThanOrEqual(4);

      const standard192 = manifest.icons?.find(
        (i) => i.sizes === '192x192' && (i.purpose === 'any' || !i.purpose)
      );
      const standard512 = manifest.icons?.find(
        (i) => i.sizes === '512x512' && (i.purpose === 'any' || !i.purpose)
      );
      const maskable192 = manifest.icons?.find(
        (i) => i.sizes === '192x192' && i.purpose === 'maskable'
      );
      const maskable512 = manifest.icons?.find(
        (i) => i.sizes === '512x512' && i.purpose === 'maskable'
      );

      expect(standard192).toBeDefined();
      expect(standard512).toBeDefined();
      expect(maskable192).toBeDefined();
      expect(maskable512).toBeDefined();

      // Verify Shortcuts
      expect(manifest.shortcuts).toBeDefined();
      expect(manifest.shortcuts?.length).toBeGreaterThanOrEqual(3);
    });

    it('ensures static manifest.json matches manifest.ts specifications', () => {
      const staticPath = path.resolve(__dirname, '../../apps/web/public/manifest.json');
      expect(fs.existsSync(staticPath)).toBe(true);

      const raw = fs.readFileSync(staticPath, 'utf-8');
      const staticManifest = JSON.parse(raw);

      expect(staticManifest.name).toBe('TUKUBI');
      expect(staticManifest.short_name).toBe('TUKUBI');
      expect(staticManifest.display).toBe('standalone');
      expect(staticManifest.theme_color).toBe('#0a0612');
      expect(staticManifest.background_color).toBe('#060A13');
    });

    it('verifies all icon files physically exist in public directory', () => {
      const publicDir = path.resolve(__dirname, '../../apps/web/public');
      const requiredIcons = [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-192.png',
        'icons/icon-maskable-512.png',
        'icons/apple-touch-icon.png',
        'icons/icon.svg',
        'favicon.svg',
      ];

      for (const relPath of requiredIcons) {
        const fullPath = path.join(publicDir, relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(100); // Non-empty valid file
      }
    });
  });

  describe('2. Platform & Standalone Detection Logic', () => {
    const originalNavigator = global.navigator;
    const originalWindow = global.window;
    const originalDocument = global.document;

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

    it('detects iOS environment accurately', () => {
      vi.stubGlobal('window', {
        navigator: {
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          platform: 'iPhone',
          maxTouchPoints: 5,
        },
      });

      const p = detectPwaPlatform();
      expect(p.isIOS).toBe(true);
      expect(p.isAndroid).toBe(false);
      expect(p.isSafari).toBe(true);
      expect(p.isDesktop).toBe(false);
    });

    it('detects Android Chrome environment accurately', () => {
      vi.stubGlobal('window', {
        navigator: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        },
      });

      const p = detectPwaPlatform();
      expect(p.isAndroid).toBe(true);
      expect(p.isIOS).toBe(false);
      expect(p.isChrome).toBe(true);
      expect(p.isDesktop).toBe(false);
    });

    it('detects Desktop Chrome / Edge environment accurately', () => {
      vi.stubGlobal('window', {
        navigator: {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
          platform: 'Win32',
          maxTouchPoints: 0,
        },
      });

      const p = detectPwaPlatform();
      expect(p.isDesktop).toBe(true);
      expect(p.isEdge).toBe(true);
      expect(p.isIOS).toBe(false);
      expect(p.isAndroid).toBe(false);
    });

    it('detects standalone mode via matchMedia', () => {
      vi.stubGlobal('window', {
        matchMedia: vi.fn((query) => ({
          matches: query === '(display-mode: standalone)',
        })),
        navigator: {},
      });
      vi.stubGlobal('document', { referrer: '' });

      expect(checkIsStandalone()).toBe(true);
    });

    it('detects standalone mode via iOS navigator.standalone', () => {
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: { standalone: true },
      });
      vi.stubGlobal('document', { referrer: '' });

      expect(checkIsStandalone()).toBe(true);
    });

    it('returns false when running in standard browser tab', () => {
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
        navigator: { standalone: false },
      });
      vi.stubGlobal('document', { referrer: 'https://google.com' });

      expect(checkIsStandalone()).toBe(false);
    });
  });

  describe('3. Production Service Worker & Offline Strategy', () => {
    it('verifies service worker file contains security rules and offline fallback', () => {
      const swPath = path.resolve(__dirname, '../../apps/web/public/sw.js');
      expect(fs.existsSync(swPath)).toBe(true);

      const swContent = fs.readFileSync(swPath, 'utf-8');

      // Check versioning
      expect(swContent).toContain('tukubi-pwa-v1.0.0');

      // Check offline fallback precaching
      expect(swContent).toContain('/offline');

      // Check security bypasses
      expect(swContent).toContain("url.pathname.startsWith('/api/')");
      expect(swContent).toContain("url.hostname.includes('supabase.co')");
      expect(swContent).toContain("url.pathname.includes('/payments/')");

      // Check navigation network-first strategy
      expect(swContent).toContain("request.mode === 'navigate'");
      expect(swContent).toContain('cachedOffline');

      // Check skipWaiting and cache pruning
      expect(swContent).toContain('SKIP_WAITING');
      expect(swContent).toContain('caches.delete');
    });

    it('verifies offline page component exists and renders correctly', () => {
      const offlinePath = path.resolve(__dirname, '../../apps/web/src/app/offline/page.tsx');
      expect(fs.existsSync(offlinePath)).toBe(true);

      const offlineContent = fs.readFileSync(offlinePath, 'utf-8');
      expect(offlineContent).toContain("You’re Offline");
      expect(offlineContent).toContain('TUKUBI');
      expect(offlineContent).toContain('Try Reconnecting');
    });
  });

  describe('4. Middleware Security & Public Exemptions', () => {
    it('verifies manifest, service worker, and offline pages are exempted in middleware', () => {
      const middlewarePath = path.resolve(__dirname, '../../apps/web/src/middleware.ts');
      const content = fs.readFileSync(middlewarePath, 'utf-8');

      expect(content).toContain("'/manifest.webmanifest'");
      expect(content).toContain("'/manifest.json'");
      expect(content).toContain("'/sw.js'");
      expect(content).toContain("'/offline'");
    });

    it('verifies next.config.js sets appropriate headers for service worker and manifests', () => {
      const nextConfigPath = path.resolve(__dirname, '../../apps/web/next.config.js');
      const content = fs.readFileSync(nextConfigPath, 'utf-8');

      expect(content).toContain("source: '/sw.js'");
      expect(content).toContain("'Service-Worker-Allowed', value: '/'");
      expect(content).toContain("source: '/manifest.webmanifest'");
    });
  });

  describe('5. PWA Telemetry & Analytics Pipeline', () => {
    it('validates all PWA event names in @caribbean/analytics', () => {
      const pwaEvents = [
        'pwa_install_prompt_available',
        'pwa_install_prompt_shown',
        'pwa_install_clicked',
        'pwa_install_completed',
        'pwa_install_dismissed',
        'pwa_ios_install_instructions_shown',
        'pwa_already_installed',
      ] as const;

      for (const eventName of pwaEvents) {
        const testEvent: AnalyticsEvent = {
          eventName,
          eventVersion: 1,
          userId: 'test-user-uuid',
          properties: { platform: 'desktop', outcome: 'accepted' },
          occurredAt: new Date().toISOString(),
        };

        const res = validateEvent(testEvent);
        expect(res.valid).toBe(true);
        expect(res.errors).toHaveLength(0);
      }
    });

    it('dispatches custom window event during trackPwaEvent', () => {
      const mockDispatch = vi.fn();
      vi.stubGlobal('window', {
        dispatchEvent: mockDispatch,
      });

      trackPwaEvent('pwa_install_clicked', { platform: 'ios' });

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});
