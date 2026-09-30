import { describe, it, expect } from 'vitest';
import {
  SubscriptionTier,
  TIER_PRICES_MINOR,
  SUPPORTED_CURRENCIES,
  isSupportedCurrency,
  applyFees,
  DEFAULT_FEES,
  evaluatePayout,
  PayoutContext,
  isSubscriptionActive,
  calculateAffiliateCommission,
  aggregateCreatorStreams,
  CREATOR_PLATFORM_TIERS,
  hasCreatorEntitlement,
  canTeamRolePerform,
  evaluateContentAccess,
  minimumTierForAccessLevel,
  ContentAccessContext,
} from '../../packages/creator/src/index';

describe('Phase 10 — Creator Studio & Monetization Architecture Certification', () => {
  // ===========================================================================
  // 1. Multi-Stream Creator Revenue & Fee Mathematical Invariants
  // ===========================================================================
  describe('1. Multi-Stream Creator Revenue & Split Settlements', () => {
    it('aggregates multi-stream creator earnings into total gross without precision loss', () => {
      const streams = aggregateCreatorStreams({
        subscriptionsMinor: 50000,       // $500.00
        tipsMinor: 12500,                // $125.00
        liveGiftsMinor: 8500,            // $85.00
        digitalSalesMinor: 45000,        // $450.00
        affiliateCommissionsMinor: 6250, // $62.50
      }, 'USD');

      expect(streams.totalGrossMinor).toBe(122250); // $1,222.50
      expect(streams.currency).toBe('USD');
    });

    it('calculates platform commission, processing fees, and net to creator accurately', () => {
      const gross = 10000; // $100.00
      // 15% platform fee (1500 bps), 2.9% processing (290 bps)
      const res = applyFees(gross, DEFAULT_FEES);

      expect(res.grossMinor).toBe(10000);
      expect(res.platformFeeMinor).toBe(1500); // $15.00
      expect(res.processingFeeMinor).toBe(290); // $2.90
      expect(res.withholdingMinor).toBe(0);
      expect(res.netToCreatorMinor).toBe(8210); // $82.10

      // Zero-loss conservation: platform + processing + withholding + net === gross
      expect(
        res.platformFeeMinor + res.processingFeeMinor + res.withholdingMinor + res.netToCreatorMinor
      ).toBe(res.grossMinor);
    });

    it('rejects invalid gross amounts or fees that exceed 100%', () => {
      expect(() => applyFees(0)).toThrow('Gross amount must be a positive integer in minor units');
      expect(() => applyFees(-500)).toThrow('Gross amount must be a positive integer in minor units');
      expect(() => applyFees(19.99 as any)).toThrow('Gross amount must be a positive integer in minor units');

      expect(() =>
        applyFees(10000, {
          platformCommissionBps: 8000,
          paymentProcessingBps: 3000,
          withholdingBps: 0,
        })
      ).toThrow('Fee structure produces negative creator net');
    });

    it('calculates affiliate referrals within strictly clamped bps bounds', () => {
      const affiliate = calculateAffiliateCommission({
        creatorId: 'creator_barbados',
        productId: 'prod_rum_masterclass',
        orderTotalMinor: 5000, // $50.00
        commissionBps: 1000,   // 10%
        currency: 'USD',
      });

      expect(affiliate.commissionMinor).toBe(500); // $5.00
      expect(affiliate.creatorId).toBe('creator_barbados');

      // Clamping: max 50% commission
      expect(() =>
        calculateAffiliateCommission({
          creatorId: 'creator_barbados',
          productId: 'prod_rum_masterclass',
          orderTotalMinor: 5000,
          commissionBps: 6000,
          currency: 'USD',
        })
      ).toThrow('Affiliate commission rate must be between 0% and 50%');
    });

    it('validates supported Caribbean and diaspora regional currencies', () => {
      ['USD', 'JMD', 'TTD', 'BBD', 'BSD', 'DOP', 'HTG', 'EUR', 'CAD'].forEach((curr) => {
        expect(isSupportedCurrency(curr)).toBe(true);
      });
      expect(isSupportedCurrency('XYZ')).toBe(false);
    });
  });

  // ===========================================================================
  // 2. Content Gating & Paywall Access Evaluation
  // ===========================================================================
  describe('2. Content Gating Hierarchy & Entitlement Engine', () => {
    it('always grants creator full access to their own gated content', () => {
      const ctx: ContentAccessContext = {
        userId: 'creator_1',
        creatorId: 'creator_1',
        isOwner: true,
        isFollower: false,
        isSubscriber: false,
      };

      const res = evaluateContentAccess(ctx, 'subscriber_pro');
      expect(res.granted).toBe(true);
    });

    it('allows anyone to view public content without authentication', () => {
      const ctx: ContentAccessContext = {
        userId: null,
        creatorId: 'creator_1',
        isOwner: false,
        isFollower: false,
        isSubscriber: false,
      };

      const res = evaluateContentAccess(ctx, 'public');
      expect(res.granted).toBe(true);
      expect(res.accessLevel).toBe('public');
    });

    it('blocks unauthenticated visitors from followers-only and subscriber tiers', () => {
      const ctx: ContentAccessContext = {
        userId: null,
        creatorId: 'creator_1',
        isOwner: false,
        isFollower: false,
        isSubscriber: false,
      };

      const res = evaluateContentAccess(ctx, 'followers_only');
      expect(res.granted).toBe(false);
      expect(res.reason).toBe('Sign in to access creator content');
    });

    it('allows followers to access followers_only tier but denies access if not following', () => {
      const nonFollowerCtx: ContentAccessContext = {
        userId: 'user_fan',
        creatorId: 'creator_1',
        isOwner: false,
        isFollower: false,
        isSubscriber: false,
      };
      expect(evaluateContentAccess(nonFollowerCtx, 'followers_only').granted).toBe(false);

      const followerCtx: ContentAccessContext = {
        ...nonFollowerCtx,
        isFollower: true,
      };
      expect(evaluateContentAccess(followerCtx, 'followers_only').granted).toBe(true);
    });

    it('evaluates subscription tiers hierarchically (pro unlocks plus and basic)', () => {
      const basicFan: ContentAccessContext = {
        userId: 'user_fan',
        creatorId: 'creator_1',
        isOwner: false,
        isFollower: true,
        isSubscriber: true,
        subscriberTier: 'basic',
      };

      expect(evaluateContentAccess(basicFan, 'subscriber_basic').granted).toBe(true);
      expect(evaluateContentAccess(basicFan, 'subscriber_plus').granted).toBe(false);
      expect(evaluateContentAccess(basicFan, 'subscriber_pro').granted).toBe(false);

      const proFan: ContentAccessContext = {
        ...basicFan,
        subscriberTier: 'pro',
      };

      expect(evaluateContentAccess(proFan, 'subscriber_basic').granted).toBe(true);
      expect(evaluateContentAccess(proFan, 'subscriber_plus').granted).toBe(true);
      expect(evaluateContentAccess(proFan, 'subscriber_pro').granted).toBe(true);
    });
  });

  // ===========================================================================
  // 3. Creator Payout Safeguards & Financial Risk Controls
  // ===========================================================================
  describe('3. Payout Risk Controls & Fraud Safeguards', () => {
    const baseContext: PayoutContext = {
      availableBalanceMinor: 25000,    // $250.00
      pendingBalanceMinor: 10000,      // $100.00
      payoutThresholdMinor: 5000,      // $50.00 threshold
      kycStatus: 'verified',
      fraudHold: false,
      chargebackReserveMinor: 2500,    // $25.00 reserved
    };

    it('permits payout when balance exceeds threshold and KYC is verified with no holds', () => {
      const res = evaluatePayout(baseContext);
      expect(res.eligible).toBe(true);
      expect(res.amountMinor).toBe(22500); // 25000 - 2500 reserve
      expect(res.reasons.length).toBe(0);
    });

    it('blocks payout if KYC verification is missing or pending', () => {
      const unverified: PayoutContext = { ...baseContext, kycStatus: 'unverified' };
      const res = evaluatePayout(unverified);
      expect(res.eligible).toBe(false);
      expect(res.reasons).toContain('KYC verification required before payout');
    });

    it('blocks payout if account is on fraud review hold', () => {
      const held: PayoutContext = { ...baseContext, fraudHold: true };
      const res = evaluatePayout(held);
      expect(res.eligible).toBe(false);
      expect(res.reasons).toContain('Payout is on fraud-review hold');
    });

    it('blocks payout if net balance after chargeback reserve is below threshold', () => {
      const lowBalance: PayoutContext = {
        ...baseContext,
        availableBalanceMinor: 6000,
        chargebackReserveMinor: 2000, // net = 4000 < 5000 threshold
      };
      const res = evaluatePayout(lowBalance);
      expect(res.eligible).toBe(false);
      expect(res.reasons[0]).toContain('below threshold');
    });
  });

  // ===========================================================================
  // 4. Creator Platform Tiers & Team Role Governance
  // ===========================================================================
  describe('4. Platform Studio Tiers & Role Governance', () => {
    it('defines clear capability progression across platform tiers', () => {
      expect(hasCreatorEntitlement('free_starter', 'creator_storefront')).toBe(true);
      expect(hasCreatorEntitlement('free_starter', 'live_broadcast_studio')).toBe(false);

      expect(hasCreatorEntitlement('creator_plus', 'live_broadcast_studio')).toBe(true);
      expect(hasCreatorEntitlement('creator_plus', 'media_4k_uploads')).toBe(false);

      expect(hasCreatorEntitlement('creator_pro', 'media_4k_uploads')).toBe(true);
      expect(hasCreatorEntitlement('creator_pro', 'instant_settlement')).toBe(true);

      expect(hasCreatorEntitlement('creator_vip', 'verified_creator_badge')).toBe(true);
    });

    it('downgrades expired or canceled paid tiers to free starter entitlements', () => {
      expect(hasCreatorEntitlement('creator_pro', 'media_4k_uploads', 'canceled')).toBe(false);
      expect(hasCreatorEntitlement('creator_pro', 'creator_storefront', 'canceled')).toBe(true);
    });

    it('enforces least-privilege permissions across Creator Studio team roles', () => {
      // Admin: full access
      expect(canTeamRolePerform('admin', 'manage_monetization')).toBe(true);
      expect(canTeamRolePerform('admin', 'publish_content')).toBe(true);

      // Editor: can manage content, cannot publish or manage monetization
      expect(canTeamRolePerform('editor', 'manage_content')).toBe(true);
      expect(canTeamRolePerform('editor', 'publish_content')).toBe(false);
      expect(canTeamRolePerform('editor', 'manage_monetization')).toBe(false);

      // Publisher: can publish content, cannot manage monetization
      expect(canTeamRolePerform('publisher', 'publish_content')).toBe(true);
      expect(canTeamRolePerform('publisher', 'manage_monetization')).toBe(false);

      // Analyst: read-only analytics
      expect(canTeamRolePerform('analyst', 'view_analytics')).toBe(true);
      expect(canTeamRolePerform('analyst', 'manage_content')).toBe(false);

      // Moderator: chat moderation and analytics
      expect(canTeamRolePerform('moderator', 'moderate_chat')).toBe(true);
      expect(canTeamRolePerform('moderator', 'publish_content')).toBe(false);
    });
  });
});
