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
