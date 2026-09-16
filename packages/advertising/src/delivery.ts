// Tukubi Ad Delivery Engine — Real-time Auction & Feed Pacing

import { dailyPacing, type AdPlacement } from './index';

export interface AdCandidate {
  id: string;
  adSetId: string;
  campaignId: string;
  advertiserId: string;
  advertiserName: string;
  advertiserAvatarUrl?: string | null;
  headline: string;
  body?: string | null;
  mediaPath?: string | null;
  destinationUrl: string;
  ctaText?: string;
  isApproved: boolean;
  campaignStatus: string;
  placement: AdPlacement;
  targetCountries?: string[];
  targetDiaspora?: boolean;
  bidCpmMinor: number;
  budgetDailyMinor: number;
  spentTodayMinor: number;
}

export interface ViewerContext {
  userId?: string | null;
  countryIso?: string | null;
  diasporaHub?: string | null;
  placement: AdPlacement;
  now?: Date;
  dayStart?: Date;
}

export interface SponsoredFeedItem {
  id: string;
  adId: string;
  authorId: string;
  author: string;
  handle: string;
  avatarUrl: string | null;
  headline: string;
  content: string;
  mediaUrls: string[];
  destinationUrl: string;
  ctaText: string;
  isSponsored: true;
  verified: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  bidCpmMinor: number;
  created_at: string;
}

/**
 * Evaluates whether a given ad candidate matches the viewer's context and pacing rules.
 */
export function isAdEligible(ad: AdCandidate, viewer: ViewerContext): boolean {
  if (!ad.isApproved || ad.campaignStatus !== 'active') {
    return false;
  }

  if (ad.placement !== viewer.placement) {
    return false;
  }

  // Country & Diaspora targeting verification
  if (ad.targetCountries && ad.targetCountries.length > 0) {
    const matchesCountry = viewer.countryIso ? ad.targetCountries.includes(viewer.countryIso) : false;
    const matchesDiaspora = ad.targetDiaspora && Boolean(viewer.diasporaHub);
    if (!matchesCountry && !matchesDiaspora) {
      return false;
    }
  }

  // Daily budget pacing check
  const now = viewer.now || new Date();
  const dayStart = viewer.dayStart || new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pacing = dailyPacing({
    budgetDailyMinor: ad.budgetDailyMinor,
    spentTodayMinor: ad.spentTodayMinor,
    now,
    dayStart,
  });

  return pacing.canSpend;
}

/**
 * Filters, ranks by CPM bid, and selects winning ads for a placement.
 */
export function rankAndSelectAds(
  candidates: AdCandidate[],
  viewer: ViewerContext,
  limit = 1
): AdCandidate[] {
  const eligible = candidates.filter((ad) => isAdEligible(ad, viewer));
  if (eligible.length === 0) return [];

  // Sort descending by CPM bid (highest bid wins), tie-break deterministically
  const ranked = [...eligible].sort((a, b) => {
    if (b.bidCpmMinor !== a.bidCpmMinor) {
      return b.bidCpmMinor - a.bidCpmMinor;
    }
    return a.id.localeCompare(b.id);
  });

  return ranked.slice(0, limit);
}

/**
 * Formats an ad candidate into a feed-compatible post structure.
 */
export function formatSponsoredFeedItem(ad: AdCandidate): SponsoredFeedItem {
  return {
    id: `ad_${ad.id}`,
    adId: ad.id,
    authorId: ad.advertiserId,
    author: ad.advertiserName,
    handle: ad.advertiserName.toLowerCase().replace(/[^a-z0-9]/g, ''),
    avatarUrl: ad.advertiserAvatarUrl || '/brand/tukubi-emblem.png',
    headline: ad.headline,
    content: ad.body || ad.headline,
    mediaUrls: ad.mediaPath ? [ad.mediaPath] : [],
    destinationUrl: ad.destinationUrl,
    ctaText: ad.ctaText || 'Learn More',
    isSponsored: true,
    verified: true,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    bidCpmMinor: ad.bidCpmMinor,
    created_at: new Date().toISOString(),
  };
}

/**
 * Injects a sponsored item into an array of organic feed items at the target cadence.
 */
export function injectSponsoredIntoFeed(
  posts: any[],
  sponsoredItem: SponsoredFeedItem | null,
  cadenceIndex = 4
): any[] {
  if (!sponsoredItem) return posts;
  if (posts.length < cadenceIndex) {
    return [...posts, sponsoredItem];
  }

  const updated = [...posts];
  updated.splice(cadenceIndex, 0, sponsoredItem);
  return updated;
}
