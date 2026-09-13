/**
 * TUKUBI Creator Subscription Tiers & Content Gating Subsystem
 * Access evaluation, subscription entitlement hierarchy,
 * and gated media blur / paywall state management.
 */

import { SubscriptionTier, TIER_PRICES_MINOR } from './index';

export type ContentAccessLevel =
  | 'public'
  | 'followers_only'
  | 'subscriber_basic'
  | 'subscriber_plus'
  | 'subscriber_pro';

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  basic: 1,
  plus: 2,
  pro: 3,
};

export interface ContentAccessContext {
  userId: string | null;
  creatorId: string;
  isOwner: boolean;
  isFollower: boolean;
  isSubscriber: boolean;
  subscriberTier?: SubscriptionTier | null;
}

export interface AccessEvaluationResult {
  granted: boolean;
  accessLevel: ContentAccessLevel;
  requiredTier?: SubscriptionTier;
  reason?: string;
}

/**
 * Maps ContentAccessLevel to minimum SubscriptionTier required.
 */
export function minimumTierForAccessLevel(level: ContentAccessLevel): SubscriptionTier | null {
  switch (level) {
    case 'subscriber_basic':
      return 'basic';
    case 'subscriber_plus':
      return 'plus';
    case 'subscriber_pro':
      return 'pro';
    default:
      return null;
  }
}

/**
 * Evaluates whether a user is entitled to view gated creator media (reels, podcasts, audio stems, posts).
 */
export function evaluateContentAccess(
  context: ContentAccessContext,
  requiredLevel: ContentAccessLevel
): AccessEvaluationResult {
  // 1. Creators always have full access to their own content
  if (context.isOwner) {
    return { granted: true, accessLevel: requiredLevel };
  }

  // 2. Public content is accessible to all users (including guests)
  if (requiredLevel === 'public') {
    return { granted: true, accessLevel: 'public' };
  }

  // 3. User must be logged in for non-public content
  if (!context.userId) {
    return {
      granted: false,
      accessLevel: requiredLevel,
      reason: 'Sign in to access creator content',
    };
  }

  // 4. Followers-only check
  if (requiredLevel === 'followers_only') {
    if (context.isFollower || context.isSubscriber) {
      return { granted: true, accessLevel: 'followers_only' };
    }
    return {
      granted: false,
      accessLevel: 'followers_only',
      reason: 'Follow this Caribbean creator to unlock this post',
    };
  }

  // 5. Subscription tier check
  const requiredTier = minimumTierForAccessLevel(requiredLevel);
  if (!requiredTier) {
    return { granted: true, accessLevel: requiredLevel };
  }

  if (!context.isSubscriber || !context.subscriberTier) {
    const priceFormatted = `$${(TIER_PRICES_MINOR[requiredTier] / 100).toFixed(2)}/mo`;
    return {
      granted: false,
      accessLevel: requiredLevel,
      requiredTier,
      reason: `Subscribe to the ${requiredTier.toUpperCase()} tier (${priceFormatted}) to unlock`,
    };
  }

  // Check tier level hierarchy: user's tier weight must >= required tier weight
  const userTierRank = TIER_HIERARCHY[context.subscriberTier] ?? 0;
  const requiredTierRank = TIER_HIERARCHY[requiredTier] ?? 1;

  if (userTierRank >= requiredTierRank) {
    return { granted: true, accessLevel: requiredLevel, requiredTier };
  }

  const priceFormatted = `$${(TIER_PRICES_MINOR[requiredTier] / 100).toFixed(2)}/mo`;
  return {
    granted: false,
    accessLevel: requiredLevel,
    requiredTier,
    reason: `Upgrade to ${requiredTier.toUpperCase()} tier (${priceFormatted}) to unlock`,
  };
}
