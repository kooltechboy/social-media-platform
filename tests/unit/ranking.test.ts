import { describe, it, expect, vi } from 'vitest';
import {
  CaribbeanFeedRanker,
  DEFAULT_WEIGHTS,
  recencyDecay,
  wellbeingAdjustment,
  MIN_SAFETY_SCORE,
} from '../../packages/recommendations/src/index';
import { buildRankedFeed } from '../../apps/web/src/lib/feed/ranking';
type SupabaseClient = any;
import { encodeCursor } from '../../packages/database/src/index'; // assume it's here or similar

const safeSignals = {
  relationshipScore: 0.8,
  recencyHours: 2,
  engagementScore: 0.6,
  contentQualityScore: 0.7,
  creatorAffinityScore: 0.5,
  communityAffinityScore: 0.4,
  geographicRelevanceScore: 0.9,
  caribbeanRelevanceScore: 0.9,
  languageMatchScore: 1,
  negativeFeedbackPenalty: 0,
  safetyScore: 1,
};

describe('Caribbean Graph feed ranker', () => {
  it('rejects weight sets that do not sum to one', () => {
    expect(() => new CaribbeanFeedRanker({ ...DEFAULT_WEIGHTS, relationship: 0.9 })).toThrow('sum to 1');
  });

  it('zeroes unsafe candidates regardless of other signals', () => {
    const ranker = new CaribbeanFeedRanker();
    const score = ranker.score({ ...safeSignals, safetyScore: MIN_SAFETY_SCORE - 0.01 });
    expect(score).toBe(0);
  });

  it('ranks fresh Caribbean-relevant content above stale distant content', () => {
    const ranker = new CaribbeanFeedRanker();
    const ranked = ranker.rank([
      { item: 'caribbean-fresh', signals: { ...safeSignals } },
      {
        item: 'stale-foreign',
        signals: { ...safeSignals, recencyHours: 240, caribbeanRelevanceScore: 0.1, relationshipScore: 0.1 },
      },
    ]);
    expect(ranked[0].item).toBe('caribbean-fresh');
    expect(ranked).toHaveLength(2);
  });

  it('applies negative feedback penalties', () => {
    const ranker = new CaribbeanFeedRanker();
    const clean = ranker.score(safeSignals);
    const penalized = ranker.score({ ...safeSignals, negativeFeedbackPenalty: 1 });
    expect(penalized).toBeLessThan(clean);
  });

  it('decays recency with a 24h half-life', () => {
    expect(recencyDecay(0)).toBe(1);
    expect(recencyDecay(24)).toBeCloseTo(0.5, 5);
    expect(recencyDecay(48)).toBeCloseTo(0.25, 5);
  });
});

describe('User satisfaction adjustment (objective function guard)', () => {
  it('reduces amplification for users with negative experiences', () => {
    expect(wellbeingAdjustment({ recentDwellTimeSeconds: 600, negativeActionsLast7Days: 0, reportedContentSeenLast7Days: 0 })).toBe(1);
    const adjusted = wellbeingAdjustment({ recentDwellTimeSeconds: 600, negativeActionsLast7Days: 30, reportedContentSeenLast7Days: 5 });
    expect(adjusted).toBeLessThan(1);
    expect(adjusted).toBeGreaterThan(0.7);
  });
});

describe('buildRankedFeed integration', () => {
  const createMockSupabase = (posts: any[], featureFlagEnabled: boolean, follows: any[] = []): SupabaseClient => {
    const mockQuery: any = Promise.resolve({ data: posts, error: null });
    mockQuery.select = () => mockQuery;
    mockQuery.order = () => mockQuery;
    mockQuery.limit = () => mockQuery;
    mockQuery.eq = () => mockQuery;
    mockQuery.in = () => mockQuery;
    mockQuery.not = () => mockQuery;
    mockQuery.or = () => mockQuery;
    mockQuery.lt = () => mockQuery;

    const fromMock = (table: string) => {
      if (table === 'feature_flags') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { is_enabled: featureFlagEnabled }, error: null })
            })
          })
        };
      }
      if (table === 'follows') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: follows, error: null })
          })
        };
      }
      if (table === 'friendships') {
        return {
          select: () => ({
            or: () => Promise.resolve({ data: [], error: null }),
            eq: () => ({
              eq: () => Promise.resolve({ data: [], error: null })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { country_id: 'TT' }, error: null })
            })
          })
        };
      }
      return mockQuery; // posts and others
    };

    return { from: fromMock } as unknown as SupabaseClient;
  };

  const oldPost = {
    id: '1',
    author_id: 'a1',
    created_at: new Date(Date.now() - 100000000).toISOString(),
    likes_count: 500,
    comments_count: 50,
    shares_count: 10,
    country_id: 'TT',
    content: 'Very popular old post',
  };

  const recentPost = {
    id: '2',
    author_id: 'a2',
    created_at: new Date(Date.now() - 1000).toISOString(),
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    country_id: 'US',
    content: 'New but no engagement',
  };

  it('Feed ranking produces different order than chronological', async () => {
    // They are returned from DB in chronological order (recentPost first)
    const supabase = createMockSupabase([recentPost, oldPost], true);
    const result = await buildRankedFeed('u1', 'for_you', supabase);
    
    // Ranked should put oldPost first due to engagement
    expect(result.data?.[0].id).toBe('1');
    expect(result.data?.[1].id).toBe('2');
  });

  it('Feature flag disabled -> chronological order returned', async () => {
    const supabase = createMockSupabase([recentPost, oldPost], false);
    const result = await buildRankedFeed('u1', 'for_you', supabase);
    
    // Chronological order preserved
    expect(result.data?.[0].id).toBe('2');
    expect(result.data?.[1].id).toBe('1');
  });

  it('Relationship score boosts followed authors above strangers', async () => {
    // Both same recency and engagement
    const friendPost = { ...recentPost, id: '3', author_id: 'friend' };
    const strangerPost = { ...recentPost, id: '4', author_id: 'stranger' };
    
    const supabase = createMockSupabase([strangerPost, friendPost], true, [{ following_id: 'friend' }]);
    const result = await buildRankedFeed('u1', 'for_you', supabase);
    
    // Friend ranks higher
    expect(result.data?.[0].id).toBe('3');
    expect(result.data?.[1].id).toBe('4');
  });

  it('mode = following -> skip ranking, return chronological subset', async () => {
    const supabase = createMockSupabase([recentPost, oldPost], true);
    const result = await buildRankedFeed('u1', 'following', supabase);
    
    // Feature flag is true, but mode is following so ranking should be skipped
    expect(result.data?.[0].id).toBe('2');
    expect(result.data?.[1].id).toBe('1');
  });
});
