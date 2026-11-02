import { isFeedMode, type FeedMode } from '@caribbean/social';

export type { FeedMode };

const ALIAS_MAP: Record<string, FeedMode> = {
  'for-you': 'for_you',
  'foryou': 'for_you',
  'creator': 'creators',
  'community': 'communities',
  'page': 'pages',
  'businesses': 'pages',
  'feed': 'for_you',
};

const TITLE_MAP: Record<FeedMode, string> = {
  for_you: 'For You',
  friends: 'Friends Only',
  following: 'Following',
  creators: 'Creators & Artists',
  official: 'Official Platform News',
  caribbean: 'Caribbean Pulse',
  communities: 'Diaspora Communities',
  pages: 'Pages & Businesses',
  favorites: 'Favorites',
  local: 'Local Hubs',
  latest: 'Latest Posts',
};

export function normalizeFeedMode(raw: string | null | undefined): FeedMode {
  if (!raw) return 'for_you';
  const clean = String(raw).trim().toLowerCase();

  if (ALIAS_MAP[clean]) {
    return ALIAS_MAP[clean];
  }

  const underscoreClean = clean.replace(/-/g, '_');
  if (isFeedMode(underscoreClean)) {
    return underscoreClean;
  }

  if (isFeedMode(clean)) {
    return clean;
  }

  return 'for_you';
}

export function feedModeToSlug(mode: FeedMode): string {
  return mode.replace(/_/g, '-');
}

export function getFeedModeTitle(mode: FeedMode): string {
  return TITLE_MAP[mode] || 'Caribbean Feed';
}
