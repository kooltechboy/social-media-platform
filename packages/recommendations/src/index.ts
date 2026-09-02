export interface CaribbeanGraphSignals {
  relationshipScore: number;
  recencyHours: number;
  engagementScore: number;
  contentQualityScore: number;
  creatorAffinityScore: number;
  communityAffinityScore: number;
  geographicRelevanceScore: number;
  caribbeanRelevanceScore: number;
  languageMatchScore: number;
  negativeFeedbackPenalty: number;
  safetyScore: number;
}

export interface RankedCandidate<T = unknown> {
  item: T;
  signals: CaribbeanGraphSignals;
  score: number;
}

export interface RankerWeights {
  relationship: number;
  recency: number;
  engagement: number;
  contentQuality: number;
  creatorAffinity: number;
  communityAffinity: number;
  geographicRelevance: number;
  caribbeanRelevance: number;
  languageMatch: number;
  negativeFeedback: number;
  safety: number;
}

export const DEFAULT_WEIGHTS: RankerWeights = {
  relationship: 0.20,
  recency: 0.15,
  engagement: 0.10,
  contentQuality: 0.10,
  creatorAffinity: 0.10,
  communityAffinity: 0.08,
  geographicRelevance: 0.07,
  caribbeanRelevance: 0.08,
  languageMatch: 0.05,
  negativeFeedback: 0.04,
  safety: 0.03,
};

const RECENCY_HALF_LIFE_HOURS = 24;

export function recencyDecay(hours: number): number {
  return Math.pow(0.5, hours / RECENCY_HALF_LIFE_HOURS);
}

export const MIN_SAFETY_SCORE = 0.6;

export class CaribbeanFeedRanker {
  private readonly weights: RankerWeights;

  public constructor(weights: RankerWeights = DEFAULT_WEIGHTS) {
    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 1) > 0.001) {
      throw new Error('Ranker weights must sum to 1');
    }
    this.weights = weights;
  }

  public score(signals: CaribbeanGraphSignals): number {
    if (signals.safetyScore < MIN_SAFETY_SCORE) {
      return 0;
    }
    const positive =
      signals.relationshipScore * this.weights.relationship +
      recencyDecay(signals.recencyHours) * this.weights.recency +
      signals.engagementScore * this.weights.engagement +
      signals.contentQualityScore * this.weights.contentQuality +
      signals.creatorAffinityScore * this.weights.creatorAffinity +
      signals.communityAffinityScore * this.weights.communityAffinity +
      signals.geographicRelevanceScore * this.weights.geographicRelevance +
      signals.caribbeanRelevanceScore * this.weights.caribbeanRelevance +
      signals.languageMatchScore * this.weights.languageMatch +
      signals.safetyScore * this.weights.safety;
    return Math.max(0, positive - signals.negativeFeedbackPenalty * this.weights.negativeFeedback);
  }

  public rank<T>(candidates: Array<{ item: T; signals: CaribbeanGraphSignals }>): RankedCandidate<T>[] {
    return candidates
      .map(({ item, signals }) => ({ item, signals, score: this.score(signals) }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score);
  }
}

export interface UserSatisfactionContext {
  recentDwellTimeSeconds: number;
  negativeActionsLast7Days: number;
  reportedContentSeenLast7Days: number;
}

export function wellbeingAdjustment(context: UserSatisfactionContext): number {
  const overexposurePenalty = Math.min(0.2, context.reportedContentSeenLast7Days * 0.04);
  const fatiguePenalty = Math.min(0.1, Math.max(0, context.negativeActionsLast7Days - 10) * 0.01);
  return 1 - overexposurePenalty - fatiguePenalty;
}

// =============================================================================
// UNIVERSAL SOCIAL & ENTITY RECOMMENDATION PIPELINE
// =============================================================================

export type RecommendationEntityType =
  | 'profile'
  | 'creator'
  | 'business'
  | 'merchant'
  | 'page'
  | 'community'
  | 'event'
  | 'product';

export interface RecommendationCandidate<T = unknown> {
  id: string;
  entityType: RecommendationEntityType;
  data: T;
  mutualCount?: number;
  originCountryIso?: string | null;
  countryName?: string | null;
  category?: string | null;
  isVerified?: boolean;
  isOfficial?: boolean;
  memberCount?: number;
  followersCount?: number;
  sharedInterests?: string[];
  engagementScore?: number;
  isDismissed?: boolean;
}

export interface ScoredRecommendation<T = unknown> {
  candidate: RecommendationCandidate<T>;
  score: number;
  reason: string;
  badgeIcon?: 'mutual' | 'island' | 'creator' | 'verified' | 'hub' | 'trending' | 'business';
}

export interface RecommendationContext {
  viewerId?: string | null;
  viewerCountryIso?: string | null;
  viewerInterests?: string[];
  friendIds?: Set<string>;
  followingIds?: Set<string>;
  blockedIds?: Set<string>;
  dismissedIds?: Set<string>;
}

/**
 * Computes recommendation score and explanation for social graph and multi-entity discovery.
 */
export function scoreRecommendationCandidate<T>(
  candidate: RecommendationCandidate<T>,
  context: RecommendationContext
): ScoredRecommendation<T> | null {
  // Hard filters: self, blocked, already following/friends, dismissed
  if (context.viewerId && candidate.id === context.viewerId) return null;
  if (context.blockedIds?.has(candidate.id)) return null;
  if (context.dismissedIds?.has(candidate.id)) return null;
  if (candidate.isDismissed) return null;

  let baseScore = 10;
  let reason = 'Suggested for you';
  let badgeIcon: ScoredRecommendation['badgeIcon'] = 'trending';

  // 1. Social Graph Signals (Mutual Connections)
  const mutuals = candidate.mutualCount ?? 0;
  if (mutuals > 0) {
    baseScore += Math.min(mutuals * 15, 60);
    reason = `👥 ${mutuals} mutual ${mutuals === 1 ? 'connection' : 'connections'}`;
    badgeIcon = 'mutual';
  } else if (candidate.originCountryIso && context.viewerCountryIso && candidate.originCountryIso.toUpperCase() === context.viewerCountryIso.toUpperCase()) {
    // 2. Geographic & Caribbean Diaspora Affinity
    baseScore += 30;
    reason = candidate.countryName
      ? `🌴 Based in ${candidate.countryName}`
      : `🌴 From your Caribbean territory (${candidate.originCountryIso})`;
    badgeIcon = 'island';
  } else if (candidate.isOfficial) {
    baseScore += 45;
    reason = '✨ Official Tukubi Platform Account';
    badgeIcon = 'verified';
  } else if (candidate.isVerified) {
    baseScore += 25;
    reason = candidate.entityType === 'creator'
      ? '🎨 Verified Caribbean Creator'
      : candidate.entityType === 'business'
      ? '🏢 Verified Caribbean Business'
      : '⭐ Verified Member';
    badgeIcon = candidate.entityType === 'creator' ? 'creator' : 'verified';
  } else if (candidate.entityType === 'community' && (candidate.memberCount ?? 0) > 0) {
    baseScore += Math.min((candidate.memberCount ?? 0) * 2, 25);
    reason = `🏝️ Active Caribbean Hub (${candidate.memberCount} members)`;
    badgeIcon = 'hub';
  } else if (candidate.category) {
    baseScore += 15;
    reason = `Caribbean ${candidate.category}`;
    badgeIcon = candidate.entityType === 'business' ? 'business' : 'trending';
  }

  // Bonus for shared interests
  if (candidate.sharedInterests && context.viewerInterests) {
    const shared = candidate.sharedInterests.filter((i) => context.viewerInterests?.includes(i));
    if (shared.length > 0) {
      baseScore += shared.length * 10;
      if (mutuals === 0) {
        reason = `🎯 Shared interests in ${shared.slice(0, 2).join(', ')}`;
      }
    }
  }

  return {
    candidate,
    score: baseScore,
    reason,
    badgeIcon,
  };
}

/**
 * Re-ranks recommendations to guarantee diversity across categories (people, creators, businesses, hubs).
 */
export function diversifyRecommendations<T>(
  scoredList: ScoredRecommendation<T>[],
  maxItems = 20
): ScoredRecommendation<T>[] {
  const sorted = [...scoredList].sort((a, b) => b.score - a.score);
  const byType: Record<string, ScoredRecommendation<T>[]> = {};

  for (const item of sorted) {
    const type = item.candidate.entityType;
    if (!byType[type]) byType[type] = [];
    byType[type].push(item);
  }

  const result: ScoredRecommendation<T>[] = [];
  const types = Object.keys(byType);
  let index = 0;

  while (result.length < maxItems && types.some((t) => (byType[t]?.length ?? 0) > index)) {
    for (const type of types) {
      const items = byType[type];
      if (items && items[index] && result.length < maxItems) {
        result.push(items[index]);
      }
    }
    index++;
  }

  return result;
}
