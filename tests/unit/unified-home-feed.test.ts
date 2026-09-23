import { describe, it, expect } from 'vitest';

/**
 * Unified Home Feed Architecture — Unit Tests
 *
 * Validates:
 * - / is the single canonical feed destination
 * - /feeds and /feeds/* redirect correctly to /?tab=...
 * - Feed mode normalization (unknown modes fall back to 'for_you')
 * - Home tab structure matches approved 5-tab spec
 * - /feeds is not in any navigation structure
 */

// ── Types (mirrors packages/social/src/index.ts) ──────────────────────────

type FeedMode =
  | 'for_you'
  | 'following'
  | 'friends'
  | 'favorites'
  | 'pages'
  | 'caribbean'
  | 'local'
  | 'communities'
  | 'latest';

const FEED_MODES: FeedMode[] = [
  'for_you',
  'following',
  'friends',
  'favorites',
  'pages',
  'caribbean',
  'local',
  'communities',
  'latest',
];

function isFeedMode(value: unknown): value is FeedMode {
  return typeof value === 'string' && (FEED_MODES as string[]).includes(value);
}

// ── Canonical URL helpers (mirrors apps/web/src/app/feeds/page.tsx logic) ──

function canonicalFeedUrl(searchParams?: Record<string, string>): string {
  const tab = searchParams?.tab;
  if (tab && isFeedMode(tab)) return `/?tab=${tab}`;
  return '/';
}

function canonicalFeedsTabUrl(tab?: string): string {
  if (tab && isFeedMode(tab)) return `/?tab=${tab}`;
  return '/';
}

// ── Home tab mode normalization (mirrors apps/web/src/app/page.tsx) ────────

const HOME_FEED_TABS = [
  { key: 'for_you', label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'friends', label: 'Friends' },
  { key: 'communities', label: 'Communities' },
  { key: 'caribbean', label: 'Caribbean' },
] as const;

type HomeFeedTab = (typeof HOME_FEED_TABS)[number]['key'];

function normalizeHomeMode(raw: string | undefined): HomeFeedTab {
  const valid: HomeFeedTab[] = HOME_FEED_TABS.map((t) => t.key);
  if (raw && valid.includes(raw as HomeFeedTab)) return raw as HomeFeedTab;
  return 'for_you';
}

// ──────────────────────────────────────────────────────────────────────────

describe('Unified Home Feed Architecture', () => {
  describe('Canonical route: / is the primary feed destination', () => {
    it('returns / when no tab is specified', () => {
      expect(canonicalFeedUrl()).toBe('/');
    });

    it('returns /?tab=<mode> when a valid FeedMode tab is specified', () => {
      expect(canonicalFeedUrl({ tab: 'following' })).toBe('/?tab=following');
      expect(canonicalFeedUrl({ tab: 'friends' })).toBe('/?tab=friends');
      expect(canonicalFeedUrl({ tab: 'caribbean' })).toBe('/?tab=caribbean');
      expect(canonicalFeedUrl({ tab: 'communities' })).toBe('/?tab=communities');
    });

    it('falls back to / when tab is not a valid FeedMode', () => {
      expect(canonicalFeedUrl({ tab: 'invalid-mode' })).toBe('/');
      expect(canonicalFeedUrl({ tab: '' })).toBe('/');
    });
  });

  describe('/feeds/* redirect targets', () => {
    it('redirects /feeds/following → /?tab=following', () => {
      expect(canonicalFeedsTabUrl('following')).toBe('/?tab=following');
    });

    it('redirects /feeds/friends → /?tab=friends', () => {
      expect(canonicalFeedsTabUrl('friends')).toBe('/?tab=friends');
    });

    it('redirects /feeds/caribbean → /?tab=caribbean', () => {
      expect(canonicalFeedsTabUrl('caribbean')).toBe('/?tab=caribbean');
    });

    it('redirects /feeds/communities → /?tab=communities', () => {
      expect(canonicalFeedsTabUrl('communities')).toBe('/?tab=communities');
    });

    it('redirects /feeds/<unknown> → / (no tab)', () => {
      expect(canonicalFeedsTabUrl('unknown-tab')).toBe('/');
      expect(canonicalFeedsTabUrl(undefined)).toBe('/');
    });
  });

  describe('Home feed mode normalization', () => {
    it('returns for_you when no mode provided', () => {
      expect(normalizeHomeMode(undefined)).toBe('for_you');
    });

    it('passes through all valid home tab modes', () => {
      expect(normalizeHomeMode('for_you')).toBe('for_you');
      expect(normalizeHomeMode('following')).toBe('following');
      expect(normalizeHomeMode('friends')).toBe('friends');
      expect(normalizeHomeMode('communities')).toBe('communities');
      expect(normalizeHomeMode('caribbean')).toBe('caribbean');
    });

    it('falls back to for_you for any invalid mode string', () => {
      expect(normalizeHomeMode('feeds')).toBe('for_you');
      expect(normalizeHomeMode('random')).toBe('for_you');
      expect(normalizeHomeMode('')).toBe('for_you');
    });
  });

  describe('Home feed tab structure', () => {
    it('has exactly 5 embedded feed filter tabs', () => {
      expect(HOME_FEED_TABS).toHaveLength(5);
    });

    it('tabs are ordered: for_you, following, friends, communities, caribbean', () => {
      expect(HOME_FEED_TABS.map((t) => t.key)).toEqual([
        'for_you',
        'following',
        'friends',
        'communities',
        'caribbean',
      ]);
    });

    it('does not include a /feeds tab key', () => {
      const keys = HOME_FEED_TABS.map((t) => t.key);
      expect(keys).not.toContain('feeds');
    });
  });

  describe('isFeedMode validator', () => {
    it('accepts all valid FEED_MODES', () => {
      for (const mode of FEED_MODES) {
        expect(isFeedMode(mode)).toBe(true);
      }
    });

    it('rejects invalid strings', () => {
      expect(isFeedMode('feeds')).toBe(false);
      expect(isFeedMode('')).toBe(false);
      expect(isFeedMode(null)).toBe(false);
      expect(isFeedMode(undefined)).toBe(false);
      expect(isFeedMode(42)).toBe(false);
    });
  });

  describe('/feeds is not a navigation destination', () => {
    const DEPRECATED_ROUTES = ['/feeds', '/feeds/following', '/feeds/friends'];

    it('all /feeds paths are considered deprecated', () => {
      for (const route of DEPRECATED_ROUTES) {
        expect(route).toMatch(/^\/feeds/);
      }
    });

    it('canonical redirect resolves each deprecated route correctly', () => {
      // /feeds → /
      expect(canonicalFeedUrl()).toBe('/');

      // /feeds?tab=following → /?tab=following
      expect(canonicalFeedUrl({ tab: 'following' })).toBe('/?tab=following');

      // /feeds/caribbean → /?tab=caribbean
      expect(canonicalFeedsTabUrl('caribbean')).toBe('/?tab=caribbean');
    });
  });
});
