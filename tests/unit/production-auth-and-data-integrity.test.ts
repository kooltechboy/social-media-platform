import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { sanitizeRedirectUrl } from '../../apps/web/src/lib/auth/redirect-utils';
import { isBannedTesterAccount } from '../../apps/web/src/lib/auth/banned-testers';
import { CARIBBEAN_SOUNDS } from '../../apps/web/src/lib/constants/caribbean-sounds';

describe('Production Authentication, Data Authenticity & Caribbean Content Integrity', () => {
  const rootDir = process.cwd();
  const middlewarePath = path.join(rootDir, 'apps/web/src/middleware.ts');
  const marketplacePagePath = path.join(rootDir, 'apps/web/src/app/marketplace/page.tsx');
  const marketplaceRailPath = path.join(rootDir, 'apps/web/src/components/rails/marketplace-rail.tsx');
  const cartDrawerPath = path.join(rootDir, 'apps/web/src/components/marketplace/cart-drawer.tsx');
  const aiShoppingAssistantPath = path.join(rootDir, 'apps/web/src/components/marketplace/ai-shopping-assistant.tsx');
  const migration00117Path = path.join(rootDir, 'supabase/migrations/00117_production_auth_rls_and_content_authenticity.sql');
  const migration00117RollbackPath = fs.existsSync(path.join(rootDir, 'supabase/rollbacks/00117_production_auth_rls_and_content_authenticity_rollback.sql'))
    ? path.join(rootDir, 'supabase/rollbacks/00117_production_auth_rls_and_content_authenticity_rollback.sql')
    : path.join(rootDir, 'supabase/migrations/00117_production_auth_rls_and_content_authenticity_rollback.sql');

  describe('1. Open-Redirect Prevention & Redirect URL Sanitization', () => {
    it('accepts valid internal application paths', () => {
      expect(sanitizeRedirectUrl('/explore')).toBe('/explore');
      expect(sanitizeRedirectUrl('/shorts')).toBe('/shorts');
      expect(sanitizeRedirectUrl('/sounds')).toBe('/sounds');
      expect(sanitizeRedirectUrl('/map')).toBe('/map');
      expect(sanitizeRedirectUrl('/events')).toBe('/events');
      expect(sanitizeRedirectUrl('/podcasts')).toBe('/podcasts');
      expect(sanitizeRedirectUrl('/marketplace')).toBe('/marketplace');
      expect(sanitizeRedirectUrl('/communities')).toBe('/communities');
      expect(sanitizeRedirectUrl('/pages')).toBe('/pages');
      expect(sanitizeRedirectUrl('/financial-center')).toBe('/financial-center');
      expect(sanitizeRedirectUrl('/creator-studio')).toBe('/creator-studio');
      expect(sanitizeRedirectUrl('/settings')).toBe('/settings');
      expect(sanitizeRedirectUrl('/profile/tukubi')).toBe('/profile/tukubi');
      expect(sanitizeRedirectUrl('/store/island-creations')).toBe('/store/island-creations');
      expect(sanitizeRedirectUrl('/terms')).toBe('/terms');
      expect(sanitizeRedirectUrl('/privacy')).toBe('/privacy');
    });

    it('preserves valid query parameters on internal routes', () => {
      expect(sanitizeRedirectUrl('/explore?geo=JAM&vibe=carnival')).toBe('/explore?geo=JAM&vibe=carnival');
      expect(sanitizeRedirectUrl('/marketplace?category=coffee&territory=JAM')).toBe('/marketplace?category=coffee&territory=JAM');
      expect(sanitizeRedirectUrl('/events?kind=in_person&city=Port-of-Spain')).toBe('/events?kind=in_person&city=Port-of-Spain');
    });

    it('rejects external absolute URLs and protocol-relative URLs (open redirect attacks)', () => {
      expect(sanitizeRedirectUrl('https://evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('http://attacker.org/phishing')).toBe('/');
      expect(sanitizeRedirectUrl('//evil.com/login')).toBe('/');
      expect(sanitizeRedirectUrl('///evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('\\evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('/\\evil.com')).toBe('/');
    });

    it('rejects path traversal, script injection, and control characters', () => {
      expect(sanitizeRedirectUrl('/explore/../../evil')).toBe('/');
      expect(sanitizeRedirectUrl('/explore\r\nevil.com')).toBe('/');
      expect(sanitizeRedirectUrl('/explore\0evil')).toBe('/');
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/');
      expect(sanitizeRedirectUrl('')).toBe('/');
      expect(sanitizeRedirectUrl(null)).toBe('/');
      expect(sanitizeRedirectUrl(undefined)).toBe('/');
    });

    it('rejects unknown or unlisted top-level path prefixes', () => {
      expect(sanitizeRedirectUrl('/unauthorized_endpoint')).toBe('/');
      expect(sanitizeRedirectUrl('/malicious/payload')).toBe('/');
    });
  });

  describe('2. Server-Side Route Protection & Middleware Audit', () => {
    it('verifies middleware.ts exists and enforces protected routes', () => {
      expect(fs.existsSync(middlewarePath)).toBe(true);
      const content = fs.readFileSync(middlewarePath, 'utf8');

      // Assert core application routes are NOT in PUBLIC_EXEMPT_ROUTES
      const exemptMatch = content.match(/const PUBLIC_EXEMPT_ROUTES = \[([\s\S]*?)\];/);
      expect(exemptMatch).not.toBeNull();
      const exemptList = exemptMatch![1];

      expect(exemptList).not.toContain("'/explore'");
      expect(exemptList).not.toContain("'/sounds'");
      expect(exemptList).not.toContain("'/map'");
      expect(exemptList).not.toContain("'/podcasts'");
      expect(exemptList).not.toContain("'/reels'");
      expect(exemptList).not.toContain("'/marketplace'");
      expect(exemptList).not.toContain("'/events'");
      expect(exemptList).not.toContain("'/communities'");
      expect(exemptList).not.toContain("'/pages'");
      expect(exemptList).not.toContain("'/profile'");
      expect(exemptList).not.toContain("'/live'");
      expect(exemptList).not.toContain("'/admin/bootstrap'");

      // Assert essential public docs and webhooks remain exempt
      expect(exemptList).toContain("'/terms'");
      expect(exemptList).toContain("'/privacy'");
      expect(exemptList).toContain("'/help'");
      expect(exemptList).toContain("'/learn'");
      expect(exemptList).toContain("'/about'");
      expect(exemptList).toContain("'/auth/callback'");
      expect(exemptList).toContain("'/api/v1/health'");

      // Assert unauthenticated redirects use sanitizeRedirectUrl and set no-store cache headers
      expect(content).toContain('sanitizeRedirectUrl');
      expect(content).toContain("loginUrl.searchParams.set('next', safeNext);");
      expect(content).toContain("redirectResponse.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');");

      // Assert root / immediately redirects unauthenticated visitors to /login (Facebook/Instagram gateway pattern)
      expect(content).toContain("if (pathname === '/')");
      expect(content).toContain("const loginUrl = new URL('/login', request.url);");

      // Assert authenticated responses set private cache-control headers
      expect(content).toContain("response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');");
    });
  });

  describe('3. Marketplace Financial Claims Truthfulness', () => {
    it('verifies removal of unsupported automated escrow claims in marketplace/page.tsx', () => {
      expect(fs.existsSync(marketplacePagePath)).toBe(true);
      const content = fs.readFileSync(marketplacePagePath, 'utf8');

      // False claims prohibited
      expect(content).not.toContain('backed by 30-day double-entry escrow buyer protection');
      expect(content).not.toContain('automated dispute settlement and escrow resolution via authorized Caribbean and international payment processors');
      expect(content).not.toContain('Authentic Caribbean offering with guaranteed buyer protection.');

      // Aligned with verified capabilities
      expect(content).toContain('TUKUBI Verified Commerce');
      expect(content).toContain('Secure payment processing via licensed payment providers');
    });

    it('verifies marketplace-rail.tsx claims are aligned with platform truth', () => {
      expect(fs.existsSync(marketplaceRailPath)).toBe(true);
      const content = fs.readFileSync(marketplaceRailPath, 'utf8');

      expect(content).not.toContain('TUKUBI Verified Escrow');
      expect(content).toContain('TUKUBI Verified Commerce');
    });

    it('verifies ai-shopping-assistant.tsx does not promise unbacked escrow resolution', () => {
      expect(fs.existsSync(aiShoppingAssistantPath)).toBe(true);
      const content = fs.readFileSync(aiShoppingAssistantPath, 'utf8');

      expect(content).not.toContain('Payments are held safely in verified escrow until delivery is confirmed');
      expect(content).toContain('verified seller credentials and secure payment processing via licensed payment providers');
    });

    it('verifies cart-drawer.tsx uses verified purchase protection copy', () => {
      expect(fs.existsSync(cartDrawerPath)).toBe(true);
      const content = fs.readFileSync(cartDrawerPath, 'utf8');

      expect(content).not.toContain('Backed by TUKUBI 30-Day Escrow Guarantee');
      expect(content).toContain('Backed by TUKUBI Verified Purchase Protection');
      expect(content).not.toContain('Securing Escrow...');
      expect(content).toContain('Processing Order...');
    });
  });

  describe('4. Caribbean Sounds & Music Catalog Integrity', () => {
    it('verifies all 12 Caribbean rhythm stems have verified licenses and metadata', () => {
      expect(CARIBBEAN_SOUNDS.length).toBe(12);

      for (const sound of CARIBBEAN_SOUNDS) {
        expect(sound.id).toBeTruthy();
        expect(sound.title).toBeTruthy();
        expect(sound.artist).toBeTruthy();
        expect(sound.countryIso).toBeTruthy();
        expect(sound.genre).toBeTruthy();
        expect(sound.durationSeconds).toBeGreaterThan(0);
        expect(sound.audioUrl).toMatch(/^https:\/\//);
        expect(sound.audioUrl).toContain('caribbean-sounds/stems');

        // Usage counts must be initialized legitimately at 0
        expect(sound.usageCount).toBe(0);

        // Licensing status must be legitimately declared
        expect(['royalty_free', 'creative_commons', 'public_domain', 'licensed']).toContain(sound.licensingStatus);
        expect(sound.attributionRequirement).toBeTruthy();
      }
    });

    it('prohibits test and banned accounts in user hydration', () => {
      expect(isBannedTesterAccount({ id: 'a5df3d20-e923-4995-ab94-544fef75a751', username: 'bravo_tester' })).toBe(true);
      expect(isBannedTesterAccount({ id: '7102174d-57f0-4140-bbba-5ac21455d777', username: 'alpha_tester' })).toBe(true);
      expect(isBannedTesterAccount({ id: '11111111-2222-3333-4444-555555555555', username: 'caribbean_creator' })).toBe(false);
    });
  });

  describe('5. Database Security, RLS & Cultural Observances Migration (00117)', () => {
    it('verifies migration 00117 exists and implements NASA-grade security standards', () => {
      expect(fs.existsSync(migration00117Path)).toBe(true);
      const content = fs.readFileSync(migration00117Path, 'utf8');

      // 1. Cultural Observances Model
      expect(content).toContain('CREATE TABLE IF NOT EXISTS public.cultural_observances');
      expect(content).toContain('historical_significance TEXT NOT NULL');
      expect(content).toContain('typical_season VARCHAR(80) NOT NULL');
      expect(content).toContain('official_authority_name TEXT NOT NULL');
      expect(content).toContain('ENABLE ROW LEVEL SECURITY');

      // 2. Events Schema & Verification Extensions
      expect(content).toContain('ADD COLUMN IF NOT EXISTS source_type');
      expect(content).toContain('ADD COLUMN IF NOT EXISTS verification_status');
      expect(content).toContain('ADD COLUMN IF NOT EXISTS official_source_url');
      expect(content).toContain('ADD COLUMN IF NOT EXISTS timezone');
      expect(content).toContain('ADD COLUMN IF NOT EXISTS cultural_observance_id');

      // 3. Events RLS Hardening (only confirmed public events visible to public)
      expect(content).toContain('verification_status = \'confirmed\'');
      expect(content).toContain('(select auth.uid()) = host_id');

      // 4. Sounds RLS Hardening (eliminated creator_id IS NULL loophole)
      expect(content).toContain('DROP POLICY IF EXISTS "sounds_creator_insert" ON public.sounds;');
      expect(content).toContain('(select auth.uid()) = creator_id');
      expect(content).not.toContain('creator_id IS NULL');

      // 5. Podcast Analytics RLS Hardening
      expect(content).toContain('DROP POLICY IF EXISTS "podcast_analytics_insert_all" ON public.podcast_analytics;');
      expect(content).toContain('(select auth.uid()) = listener_id');

      // 6. Seeded authoritative Caribbean cultural observances
      expect(content).toContain('Trinidad and Tobago Carnival');
      expect(content).toContain('Barbados Crop Over Festival');
      expect(content).toContain('The Bahamas Junkanoo Celebration');
      expect(content).toContain('Jamaica Reggae Sumfest');
      expect(content).toContain('Dominica World Creole Music Festival');
    });

    it('verifies rollback script exists for migration 00117', () => {
      expect(fs.existsSync(migration00117RollbackPath)).toBe(true);
      const content = fs.readFileSync(migration00117RollbackPath, 'utf8');

      expect(content).toContain('DROP TABLE IF EXISTS public.cultural_observances');
      expect(content).toContain('DROP COLUMN IF EXISTS cultural_observance_id');
      expect(content).toContain('CREATE POLICY "sounds_creator_insert"');
    });
  });
});
