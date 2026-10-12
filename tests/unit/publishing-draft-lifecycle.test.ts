import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hasMeaningfulDraftContent,
  saveComposerDraft,
  loadComposerDraft,
  clearComposerDraft,
  subscribeToDraftChanges,
  DRAFT_STORAGE_KEY,
} from '../../apps/web/src/lib/social/draft-manager';
import { isSafeEmbedUrl, ALLOWED_EMBED_ORIGINS } from '../../apps/web/src/components/media/rich-media-player';
import {
  colors as designSystemColors,
  motion as designSystemMotion,
  localeLayout as designSystemLocaleLayout,
  DEFAULT_THEME,
} from '../../packages/design-system/src/index';
import { TOKENS as mobileTokens } from '../../apps/mobile/src/theme/tokens';
import { buildRlsAssertion } from '../../packages/database/src/index';

describe('TUKUBI-RTP-001 — Publishing, Media, Draft Lifecycle & Design System Verification', () => {
  // Mock window & localStorage for draft-manager behavioral tests
  const mockStorage = new Map<string, string>();
  const listeners = new Map<string, Set<EventListener>>();

  beforeEach(() => {
    mockStorage.clear();
    listeners.clear();

    class MockCustomEvent<T = unknown> {
      type: string;
      detail: T;
      constructor(type: string, init?: { detail?: T }) {
        this.type = type;
        this.detail = init?.detail as T;
      }
    }

    const storageApi = {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, val: string) => mockStorage.set(key, val),
      removeItem: (key: string) => mockStorage.delete(key),
    };

    vi.stubGlobal('CustomEvent', MockCustomEvent);
    vi.stubGlobal('localStorage', storageApi);
    vi.stubGlobal('sessionStorage', storageApi);
    vi.stubGlobal('window', {
      localStorage: storageApi,
      sessionStorage: storageApi,
      addEventListener: (type: string, listener: EventListener) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(listener);
      },
      removeEventListener: (type: string, listener: EventListener) => {
        listeners.get(type)?.delete(listener);
      },
      dispatchEvent: (event: { type: string; detail?: unknown }) => {
        const set = listeners.get(event.type);
        if (set) {
          for (const fn of set) {
            fn(event as unknown as Event);
          }
        }
        return true;
      },
    });
  });

  // ===========================================================================
  // 1. Draft Lifecycle & Abandoned Draft Cleanup (Phase 2 P0 Fix)
  // ===========================================================================
  describe('1. Unified Composer Draft Lifecycle & Phantom Draft Prevention', () => {
    it('ignores un-uploaded local media attachments when evaluating hasMeaningfulDraftContent', () => {
      // A local file selected in the browser without a persisted uploadedUrl cannot be restored
      // across page reloads and must NOT trigger a phantom "Unfinished Post Draft" banner.
      const unuploadedOnly = {
        content: '   ',
        mediaSummary: [
          { name: 'beach.jpg', kind: 'image' as const, status: 'uploading' },
        ],
      };
      expect(hasMeaningfulDraftContent(unuploadedOnly)).toBe(false);
    });

    it('recognizes persisted uploadedUrl in mediaSummary as meaningful draft content', () => {
      const uploadedMediaDraft = {
        content: '',
        mediaSummary: [
          {
            name: 'carnival.jpg',
            kind: 'image' as const,
            status: 'ready',
            uploadedUrl: 'https://cdn.tukubi.com/posts/carnival.jpg',
          },
        ],
      };
      expect(hasMeaningfulDraftContent(uploadedMediaDraft)).toBe(true);
    });

    it('recognizes non-empty text, linkPreviews, or taggedProductIds as meaningful draft content', () => {
      expect(hasMeaningfulDraftContent({ content: 'Hello Caribbean!' })).toBe(true);
      expect(
        hasMeaningfulDraftContent({
          content: '',
          linkPreviews: [
            {
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              provider: 'youtube',
              contentType: 'video',
            },
          ],
        })
      ).toBe(true);
      expect(
        hasMeaningfulDraftContent({
          content: '',
          taggedProductIds: ['prod_123'],
        })
      ).toBe(true);
    });

    it('notifies subscribers and clears storage when clearComposerDraft is called externally', () => {
      const events: Array<any> = [];
      const unsubscribe = subscribeToDraftChanges((draft) => {
        events.push(draft);
      });

      saveComposerDraft({
        content: 'Draft in progress',
        audience: 'public',
        mediaSummary: [],
      });

      expect(loadComposerDraft()?.content).toBe('Draft in progress');
      expect(events.length).toBe(1);
      expect(events[0]?.content).toBe('Draft in progress');

      // Simulate external Discard Draft button click (e.g. from CreateHubClient banner)
      clearComposerDraft();

      expect(loadComposerDraft()).toBeNull();
      expect(mockStorage.has(DRAFT_STORAGE_KEY)).toBe(false);
      expect(events[events.length - 1]).toBeNull();

      unsubscribe();
    });
  });

  // ===========================================================================
  // 2. External Embed Security & YouTube Allowlist Verification
  // ===========================================================================
  describe('2. External Media & YouTube Embed Allowlist Security', () => {
    it('allows canonical HTTPS embed origins including YouTube, YouTube NoCookie, Vimeo, Spotify, SoundCloud, and TikTok', () => {
      expect(isSafeEmbedUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(true);
      expect(isSafeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
      expect(isSafeEmbedUrl('https://player.vimeo.com/video/123456')).toBe(true);
      expect(isSafeEmbedUrl('https://open.spotify.com/embed/track/123')).toBe(true);
      expect(isSafeEmbedUrl('https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1')).toBe(true);
      expect(isSafeEmbedUrl('https://www.tiktok.com/embed/v2/123456789')).toBe(true);
    });

    it('rejects non-HTTPS, javascript:, data:, and untrusted third-party iframe origins', () => {
      expect(isSafeEmbedUrl('http://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(false);
      expect(isSafeEmbedUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeEmbedUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeEmbedUrl('https://evil-phishing.example.com/embed/123')).toBe(false);
      expect(ALLOWED_EMBED_ORIGINS.length).toBeGreaterThanOrEqual(10);
    });
  });

  // ===========================================================================
  // 3. Brand, Design System & WCAG 2.2 AA Contrast Token Governance (Phase 3)
  // ===========================================================================
  describe('3. Design System Tokens (Ocean Depth, Island Daylight & WCAG 2.2 AA Contrast)', () => {
    it('preserves Island Vibes (#110D17) as default theme while exporting Ocean Depth (#0B1F33) and Island Daylight', () => {
      expect(DEFAULT_THEME).toBe('island-vibes');
      expect(designSystemColors.brand.twilight).toBe('#110D17');
      expect(designSystemColors.brand.oceanDepth).toBe('#0B1F33');
      expect(designSystemColors.islandVibes.surfaceTrust).toBe('#0B1F33');
      expect(designSystemColors.islandDaylight.canvas).toBe('#FFFDF9');
      expect(designSystemColors.islandDaylight.surfaceTrust).toBe('#0B1F33');
    });

    it('enforces WCAG 2.2 AA contrast tokens for primary coral buttons and muted text', () => {
      // Dark twilight text (#110D17) on Sunrise Coral (#FF7A59) yields 7.48:1 AAA contrast
      expect(designSystemColors.islandVibes.onPrimary).toBe('#110D17');
      // Upgraded textDim (#A1A1AA) on #110D17 yields 7.36:1 AAA contrast
      expect(designSystemColors.islandVibes.textDim).toBe('#A1A1AA');
      // Mobile token parity
      expect(mobileTokens.oceanDepth).toBe('#0B1F33');
      expect(mobileTokens.actionText).toBe('#110D17');
    });

    it('exports motion tokens and 4-locale expansion budgets (EN, ES, FR, HT)', () => {
      expect(designSystemMotion.durationFast).toBe('150ms');
      expect(designSystemLocaleLayout.textExpansionFactor).toBeGreaterThanOrEqual(1.3);
      expect(designSystemLocaleLayout.minTouchTargetPx).toBe(44);
    });
  });

  // ===========================================================================
  // 4. Authoritative Database Table Registry Sync
  // ===========================================================================
  describe('4. @caribbean/database Authoritative Table Registry', () => {
    it('supports RLS assertions for newly registered social, publishing, and creator draft tables', () => {
      const postMediaRls = buildRlsAssertion({
        table: 'post_media',
        operation: 'SELECT',
        role: { role: 'authenticated' },
        shouldSeeRows: true,
      });
      const creatorDraftsRls = buildRlsAssertion({
        table: 'creator_content_drafts',
        operation: 'DELETE',
        role: { role: 'owner', userId: '00000000-0000-0000-0000-000000000001' },
        shouldSeeRows: true,
      });
      expect(postMediaRls.statement.text).toContain('public.post_media');
      expect(creatorDraftsRls.statement.text).toContain('public.creator_content_drafts');
    });
  });

  // ===========================================================================
  // 5. Post-Transformation Assurance Regression Suite (P0/P1 Hardening)
  // ===========================================================================
  describe('5. Post-Transformation Assurance Regression Checks', () => {
    it('preserves RETURNS JSONB and all 6 identity keys in migration 00108 get_available_identities while enforcing auth.uid() IDOR guard', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const sql = fs.readFileSync(
        path.resolve(__dirname, '../../supabase/migrations/00108_phase2_security_rls_and_publishing_lifecycle.sql'),
        'utf-8'
      );
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_available_identities(p_user_id UUID)');
      expect(sql).toContain('RETURNS JSONB');
      expect(sql).not.toContain('RETURNS TABLE');
      expect(sql).toContain("'personal', v_personal");
      expect(sql).toContain("'official', v_official");
      expect(sql).toContain("'creator', v_creator");
      expect(sql).toContain("'businesses', v_businesses");
      expect(sql).toContain("'communities', v_communities");
      expect(sql).toContain("'active', COALESCE(v_active");
      expect(sql).toContain("cm.role IN ('admin', 'moderator')");
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.place_order_with_escrow');
      expect(sql).toContain('REVOKE INSERT ON public.relief_donations FROM anon');
    });

    it('guards auto-save clearComposerDraft in UniversalComposer with isAutoSaveClearingRef so un-uploaded local media is not wiped on backspace', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const composerSrc = fs.readFileSync(
        path.resolve(__dirname, '../../apps/web/src/components/universal-composer.tsx'),
        'utf-8'
      );
      expect(composerSrc).toContain('isAutoSaveClearingRef');
      expect(composerSrc).toContain('if (!draft && !isAutoSaveClearingRef.current)');
    });

    it('resolves free_starter as an alias for creator_free in EntitlementEngine', async () => {
      const { EntitlementEngine } = await import('../../packages/payments/src/entitlements');
      const engine = new EntitlementEngine();
      expect(engine.getEntitlements('free_starter')).toEqual(engine.getEntitlements('creator_free'));
      expect(engine.canMonetize('free_starter')).toBe(true);
    });
  });
});
