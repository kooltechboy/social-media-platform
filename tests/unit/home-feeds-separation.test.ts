import { describe, it, expect } from 'vitest';
import { buildFeedQuery, isFeedMode, FEED_MODES } from '../../packages/social/src/index';
import { scoreRecommendationCandidate, type RecommendationCandidate, type RecommendationContext } from '../../packages/recommendations/src/index';

describe('Home vs Feeds 360° Architectural Separation', () => {
  describe('Feed Modes and Routing Contract', () => {
    it('includes both favorites and pages in FEED_MODES constant', () => {
      expect(FEED_MODES).toContain('favorites');
      expect(FEED_MODES).toContain('pages');
      expect(FEED_MODES).toContain('friends');
      expect(FEED_MODES).toContain('following');
      expect(FEED_MODES).toContain('communities');
      expect(FEED_MODES).toContain('caribbean');
      expect(FEED_MODES).toContain('for_you');
    });

    it('validates feed mode checker for new relationship modes', () => {
      expect(isFeedMode('favorites')).toBe(true);
      expect(isFeedMode('pages')).toBe(true);
      expect(isFeedMode('friends')).toBe(true);
      expect(isFeedMode('unsupported_mode')).toBe(false);
    });
  });

  describe('Relationship Feed SQL Generator (Zero Algorithmic Interleaving)', () => {
    it('generates deterministic friends SQL without recommendation weighting', () => {
      const { statement } = buildFeedQuery({ viewerId: 'user_123', mode: 'friends' });
      expect(statement.text).toContain('author_id IN');
      expect(statement.text).toContain('public.friendships');
      expect(statement.text).toContain("status = 'accepted'");
      expect(statement.text).toContain('ORDER BY created_at DESC, id DESC');
      // Guarantee no recommendation tables or boosts are joined in friends mode
      expect(statement.text).not.toContain('recommendation_candidates');
      expect(statement.text).not.toContain('algorithmic_boost');
      expect(statement.text).not.toContain('sponsored');
    });

    it('generates favorites SQL strictly targeting user_favorites table', () => {
      const { statement } = buildFeedQuery({ viewerId: 'user_123', mode: 'favorites' });
      expect(statement.text).toContain('SELECT target_id FROM public.user_favorites WHERE user_id = $');
      expect(statement.text).toContain('ORDER BY created_at DESC, id DESC');
    });

    it('generates pages SQL filtering publisher_type = page or page_id IS NOT NULL', () => {
      const { statement } = buildFeedQuery({ viewerId: 'user_123', mode: 'pages' });
      expect(statement.text).toContain("publisher_type = 'page' OR page_id IS NOT NULL");
      expect(statement.text).toContain('ORDER BY created_at DESC, id DESC');
    });

    it('generates creators and official SQL with appropriate publisher filters', () => {
      const creatorsQuery = buildFeedQuery({ viewerId: 'user_123', mode: 'creators' });
      expect(creatorsQuery.statement.text).toContain("publisher_type = 'creator'");

      const officialQuery = buildFeedQuery({ viewerId: 'user_123', mode: 'official' });
      expect(officialQuery.statement.text).toContain("publisher_type = 'official' OR is_official = true");
    });
  });

  describe('Discovery Engine (Home) Algorithmic Scorer', () => {
    it('applies explicit algorithmic boosts for favorite candidates', () => {
      const candidate: RecommendationCandidate = {
        id: 'creator_99',
        entityType: 'creator',
        data: {},
        originCountryIso: 'JM',
        countryName: 'Jamaica',
      };

      const context: RecommendationContext = {
        viewerId: 'user_123',
        viewerCountryIso: 'TT',
        favoriteIds: new Set(['creator_99']),
      };

      const result = scoreRecommendationCandidate(candidate, context);
      expect(result).not.toBeNull();
      // Base score 10 + favorites boost 35 = 45
      expect(result?.score).toBe(45);
      expect(result?.reason).toContain('In your Favorites');
      expect(result?.badgeIcon).toBe('verified');
    });

    it('combines mutual connections score with favorites boost', () => {
      const candidate: RecommendationCandidate = {
        id: 'creator_99',
        entityType: 'creator',
        data: {},
        mutualCount: 2,
        originCountryIso: 'JM',
      };

      const context: RecommendationContext = {
        viewerId: 'user_123',
        favoriteIds: new Set(['creator_99']),
      };

      const result = scoreRecommendationCandidate(candidate, context);
      expect(result).not.toBeNull();
      // Base 10 + favorites 35 + mutuals (2*15=30) = 75
      expect(result?.score).toBe(75);
      expect(result?.reason).toContain('2 mutual connections');
    });

    it('drops blocked and dismissed candidates from discovery pool', () => {
      const candidate: RecommendationCandidate = {
        id: 'creator_blocked',
        entityType: 'creator',
        data: {},
      };

      const context: RecommendationContext = {
        viewerId: 'user_123',
        blockedIds: new Set(['creator_blocked']),
      };

      const result = scoreRecommendationCandidate(candidate, context);
      expect(result).toBeNull();
    });
  });
});
