import { describe, it, expect } from 'vitest';
import {
  CaribbeanFeedRanker,
  DEFAULT_WEIGHTS,
  recencyDecay,
  wellbeingAdjustment,
  MIN_SAFETY_SCORE,
} from '../../packages/recommendations/src/index';

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
