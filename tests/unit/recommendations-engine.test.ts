import { describe, it, expect } from 'vitest';
import {
  scoreRecommendationCandidate,
  diversifyRecommendations,
  type RecommendationCandidate,
  type RecommendationContext,
} from '../../packages/recommendations/src/index';

describe('Universal Recommendations & Discovery Engine', () => {
  const viewerContext: RecommendationContext = {
    viewerId: 'usr_viewer_1',
    viewerCountryIso: 'JM',
    viewerInterests: ['reggae', 'carnival', 'tech'],
    blockedIds: new Set(['usr_blocked']),
    dismissedIds: new Set(['usr_dismissed']),
  };

  it('filters out self, blocked candidates, and dismissed recommendations', () => {
    const selfCandidate: RecommendationCandidate = {
      id: 'usr_viewer_1',
      entityType: 'profile',
      data: { name: 'Viewer Self' },
    };
    expect(scoreRecommendationCandidate(selfCandidate, viewerContext)).toBeNull();

    const blockedCandidate: RecommendationCandidate = {
      id: 'usr_blocked',
      entityType: 'profile',
      data: { name: 'Blocked User' },
    };
    expect(scoreRecommendationCandidate(blockedCandidate, viewerContext)).toBeNull();

    const dismissedCandidate: RecommendationCandidate = {
      id: 'usr_dismissed',
      entityType: 'profile',
      data: { name: 'Dismissed User' },
    };
    expect(scoreRecommendationCandidate(dismissedCandidate, viewerContext)).toBeNull();
  });

  it('boosts candidates with mutual connections and provides transparent context', () => {
    const mutualCandidate: RecommendationCandidate = {
      id: 'usr_candidate_1',
      entityType: 'profile',
      data: { name: 'Aaliyah Brown' },
      mutualCount: 4,
    };

    const scored = scoreRecommendationCandidate(mutualCandidate, viewerContext);
    expect(scored).not.toBeNull();
    expect(scored!.score).toBeGreaterThan(50);
    expect(scored!.reason).toContain('4 mutual connections');
    expect(scored!.badgeIcon).toBe('mutual');
  });

  it('scores Caribbean diaspora and territory affinity when no mutuals exist', () => {
    const jamaicanCandidate: RecommendationCandidate = {
      id: 'usr_candidate_jm',
      entityType: 'profile',
      data: { name: 'Kareem Campbell' },
      originCountryIso: 'JM',
      countryName: 'Jamaica',
    };

    const scored = scoreRecommendationCandidate(jamaicanCandidate, viewerContext);
    expect(scored).not.toBeNull();
    expect(scored!.reason).toContain('Based in Jamaica');
    expect(scored!.badgeIcon).toBe('island');
  });

  it('highlights official platform accounts with top priority', () => {
    const officialCandidate: RecommendationCandidate = {
      id: 'usr_tukubi_official',
      entityType: 'profile',
      data: { name: 'Tukubi Official' },
      isOfficial: true,
    };

    const scored = scoreRecommendationCandidate(officialCandidate, viewerContext);
    expect(scored).not.toBeNull();
    expect(scored!.reason).toContain('Official Tukubi Platform Account');
    expect(scored!.badgeIcon).toBe('verified');
  });

  it('diversifies recommendations across people, creators, businesses, and communities', () => {
    const candidates = [
      { candidate: { id: 'p1', entityType: 'profile' as const, data: 'Person 1' }, score: 90, reason: 'r1' },
      { candidate: { id: 'p2', entityType: 'profile' as const, data: 'Person 2' }, score: 85, reason: 'r2' },
      { candidate: { id: 'p3', entityType: 'profile' as const, data: 'Person 3' }, score: 80, reason: 'r3' },
      { candidate: { id: 'c1', entityType: 'creator' as const, data: 'Creator 1' }, score: 75, reason: 'r4' },
      { candidate: { id: 'b1', entityType: 'business' as const, data: 'Business 1' }, score: 70, reason: 'r5' },
      { candidate: { id: 'h1', entityType: 'community' as const, data: 'Hub 1' }, score: 65, reason: 'r6' },
    ];

    const diversified = diversifyRecommendations(candidates, 4);
    const types = diversified.map((d) => d.candidate.entityType);

    expect(types).toContain('profile');
    expect(types).toContain('creator');
    expect(types).toContain('business');
    expect(types).toContain('community');
  });
});
