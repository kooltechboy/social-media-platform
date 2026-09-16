import { describe, it, expect } from 'vitest';
import {
  isAdEligible,
  rankAndSelectAds,
  formatSponsoredFeedItem,
  injectSponsoredIntoFeed,
  type AdCandidate,
  type ViewerContext,
} from '../../packages/advertising/src/index';

describe('AdDeliveryEngine — Tukubi Self-Serve Delivery & Auction', () => {
  const baseAd: AdCandidate = {
    id: 'ad_123',
    adSetId: 'set_1',
    campaignId: 'camp_1',
    advertiserId: 'adv_99',
    advertiserName: 'Ocho Rios Jerk & Spice',
    advertiserAvatarUrl: 'https://images.tukubi.com/adv_99.jpg',
    headline: 'Authentic Scotch Bonnet Jerk Rub',
    body: 'Fresh spices shipped directly from St. Ann, Jamaica. Taste the true island flavor.',
    mediaPath: 'https://images.tukubi.com/ads/jerk-spice.jpg',
    destinationUrl: 'https://ochoriosspice.com/shop',
    ctaText: 'Shop Now',
    isApproved: true,
    campaignStatus: 'active',
    placement: 'feed',
    targetCountries: ['JAM', 'TTO', 'USA'],
    targetDiaspora: true,
    bidCpmMinor: 500, // $5.00 CPM
    budgetDailyMinor: 5000, // $50.00 daily
    spentTodayMinor: 1000, // $10.00 spent
  };

  const baseViewer: ViewerContext = {
    userId: 'user_456',
    countryIso: 'JAM',
    diasporaHub: null,
    placement: 'feed',
    now: new Date('2026-09-16T14:00:00Z'),
    dayStart: new Date('2026-09-16T00:00:00Z'),
  };

  describe('Eligibility Verification', () => {
    it('approves an active, matching ad within pacing budget', () => {
      expect(isAdEligible(baseAd, baseViewer)).toBe(true);
    });

    it('rejects unapproved ads', () => {
      expect(isAdEligible({ ...baseAd, isApproved: false }, baseViewer)).toBe(false);
    });

    it('rejects ads from non-active campaigns (e.g. paused, completed)', () => {
      expect(isAdEligible({ ...baseAd, campaignStatus: 'paused' }, baseViewer)).toBe(false);
    });

    it('rejects ads when placement does not match viewer surface', () => {
      expect(isAdEligible({ ...baseAd, placement: 'reels' }, baseViewer)).toBe(false);
    });

    it('rejects ads when viewer country does not match and diaspora targeting does not apply', () => {
      const bbdViewer: ViewerContext = { ...baseViewer, countryIso: 'BRB', diasporaHub: null };
      expect(isAdEligible(baseAd, bbdViewer)).toBe(false);
    });

    it('allows ads when diaspora viewer matches diaspora hub targeting', () => {
      const diasporaViewer: ViewerContext = { ...baseViewer, countryIso: 'GBR', diasporaHub: 'Brixton' };
      expect(isAdEligible(baseAd, diasporaViewer)).toBe(true);
    });

    it('rejects ads when daily budget is exhausted', () => {
      const exhaustedAd: AdCandidate = {
        ...baseAd,
        spentTodayMinor: 5000, // fully spent
      };
      expect(isAdEligible(exhaustedAd, baseViewer)).toBe(false);
    });
  });

  describe('Auction Ranking & Selection', () => {
    it('ranks eligible ads by highest CPM bid first', () => {
      const lowBidAd: AdCandidate = { ...baseAd, id: 'ad_low', bidCpmMinor: 250 };
      const highBidAd: AdCandidate = { ...baseAd, id: 'ad_high', bidCpmMinor: 750 };
      const midBidAd: AdCandidate = { ...baseAd, id: 'ad_mid', bidCpmMinor: 500 };

      const winners = rankAndSelectAds([lowBidAd, highBidAd, midBidAd], baseViewer, 1);
      expect(winners.length).toBe(1);
      expect(winners[0].id).toBe('ad_high');
    });

    it('returns empty array when no ads are eligible', () => {
      const winners = rankAndSelectAds([{ ...baseAd, isApproved: false }], baseViewer, 1);
      expect(winners).toHaveLength(0);
    });
  });

  describe('Sponsored Feed Item Formatting', () => {
    it('correctly maps ad candidate to feed post schema with isSponsored = true', () => {
      const item = formatSponsoredFeedItem(baseAd);
      expect(item.id).toBe('ad_ad_123');
      expect(item.isSponsored).toBe(true);
      expect(item.headline).toBe('Authentic Scotch Bonnet Jerk Rub');
      expect(item.author).toBe('Ocho Rios Jerk & Spice');
      expect(item.mediaUrls).toContain('https://images.tukubi.com/ads/jerk-spice.jpg');
      expect(item.ctaText).toBe('Shop Now');
      expect(item.destinationUrl).toBe('https://ochoriosspice.com/shop');
    });
  });

  describe('Feed Injection Cadence', () => {
    it('injects sponsored card at designated index (default 4)', () => {
      const organicPosts = [
        { id: 'post_1', content: 'Post 1' },
        { id: 'post_2', content: 'Post 2' },
        { id: 'post_3', content: 'Post 3' },
        { id: 'post_4', content: 'Post 4' },
        { id: 'post_5', content: 'Post 5' },
      ];
      const sponsoredItem = formatSponsoredFeedItem(baseAd);
      const feed = injectSponsoredIntoFeed(organicPosts, sponsoredItem, 4);

      expect(feed.length).toBe(6);
      expect(feed[4].id).toBe('ad_ad_123');
      expect(feed[4].isSponsored).toBe(true);
      expect(feed[5].id).toBe('post_5');
    });

    it('appends to end if feed has fewer items than cadence index', () => {
      const shortFeed = [{ id: 'post_1', content: 'Post 1' }];
      const sponsoredItem = formatSponsoredFeedItem(baseAd);
      const feed = injectSponsoredIntoFeed(shortFeed, sponsoredItem, 4);

      expect(feed.length).toBe(2);
      expect(feed[1].isSponsored).toBe(true);
    });

    it('returns original feed unchanged if sponsoredItem is null', () => {
      const organicPosts = [{ id: 'post_1' }, { id: 'post_2' }];
      const feed = injectSponsoredIntoFeed(organicPosts, null, 4);
      expect(feed).toEqual(organicPosts);
    });
  });
});
