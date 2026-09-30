import { describe, it, expect } from 'vitest';
import {
  validateCampaign,
  deriveMetrics,
  roas,
  dailyPacing,
  isPrivacyAwareTargeting,
  MIN_CAMPAIGN_BUDGET_MINOR,
  type CampaignInput,
  type CampaignMetrics,
} from '../../packages/advertising/src/index';
import {
  isAdEligible,
  rankAndSelectAds,
  type AdCandidate,
  type ViewerContext,
} from '../../packages/advertising/src/delivery';

describe('Phase 19 — Advertising & Campaign Delivery Engine Certification', () => {
  // ===========================================================================
  // 1. Campaign Validation & Budget Constraints
  // ===========================================================================
  describe('1. Campaign Validation & Budget Constraints', () => {
    const validCampaign: CampaignInput = {
      advertiserId: 'adv_caribbean_airlines',
      name: 'Summer Fete Flights 2027',
      objective: 'conversions',
      budgetTotalMinor: 50000, // $500.00
      budgetDailyMinor: 5000,  // $50.00 / day
      currency: 'USD',
      startsAt: '2026-10-01T00:00:00Z',
      endsAt: '2026-10-10T23:59:59Z',
    };

    it('approves a compliant advertising campaign', () => {
      const res = validateCampaign(validCampaign);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });

    it('rejects campaigns below minimum budget or where daily exceeds total', () => {
      const lowBudget = validateCampaign({
        ...validCampaign,
        budgetTotalMinor: 500, // < 1000 minor minimum
      });
      expect(lowBudget.valid).toBe(false);
      expect(lowBudget.errors[0]).toContain(`at least ${MIN_CAMPAIGN_BUDGET_MINOR}`);

      const excessiveDaily = validateCampaign({
        ...validCampaign,
        budgetDailyMinor: 60000, // > 50000 total
      });
      expect(excessiveDaily.valid).toBe(false);
      expect(excessiveDaily.errors).toContain('Daily budget cannot exceed total budget');
    });

    it('enforces chronological end date after start date', () => {
      const invertedDates = validateCampaign({
        ...validCampaign,
        startsAt: '2026-10-10T00:00:00Z',
        endsAt: '2026-10-01T00:00:00Z',
      });
      expect(invertedDates.valid).toBe(false);
      expect(invertedDates.errors).toContain('End date must be after start date');
    });
  });

  // ===========================================================================
  // 2. Budget Pacing & Throttle Algorithm
  // ===========================================================================
  describe('2. Smooth Daily Budget Pacing Algorithm', () => {
    const dayStart = new Date('2026-09-01T00:00:00Z');

    it('allows spend during early hours if spending is within expected trajectory', () => {
      // 6 hours into day (25% of day), spent 20% of daily budget
      const now = new Date('2026-09-01T06:00:00Z');
      const pacing = dailyPacing({
        budgetDailyMinor: 10000, // $100.00 / day
        spentTodayMinor: 2000,   // $20.00 spent
        now,
        dayStart,
      });

      expect(pacing.canSpend).toBe(true);
      expect(pacing.remainingTodayMinor).toBe(8000);
      expect(pacing.utilization).toBe(0.2);
    });

    it('throttles ad delivery when budget is exhausting too rapidly early in the day', () => {
      // 1 hour into day (4.1% of day), spent 40% of daily budget
      const now = new Date('2026-09-01T01:00:00Z');
      const pacing = dailyPacing({
        budgetDailyMinor: 10000,
        spentTodayMinor: 4000,
        now,
        dayStart,
      });

      // Pacing tolerance exceeded (40% > 4.1% + 10%)
      expect(pacing.canSpend).toBe(false);
      expect(pacing.remainingTodayMinor).toBe(6000);
    });

    it('halts ad delivery when daily budget is completely exhausted', () => {
      const now = new Date('2026-09-01T18:00:00Z');
      const pacing = dailyPacing({
        budgetDailyMinor: 10000,
        spentTodayMinor: 10000,
        now,
        dayStart,
      });

      expect(pacing.canSpend).toBe(false);
      expect(pacing.remainingTodayMinor).toBe(0);
    });
  });

  // ===========================================================================
  // 3. Real-Time Auction & Target Delivery
  // ===========================================================================
  describe('3. Real-time CPM Auction & Targeting Filters', () => {
    const baseCandidate: AdCandidate = {
      id: 'ad_promo_001',
      adSetId: 'adset_001',
      campaignId: 'camp_001',
      advertiserId: 'adv_001',
      advertiserName: 'Island Delights',
      headline: 'Taste the Caribbean Sunset',
      destinationUrl: 'https://islanddelights.caribbean',
      isApproved: true,
      campaignStatus: 'active',
      placement: 'feed',
      targetCountries: ['TTO', 'JAM', 'BRB'],
      targetDiaspora: true,
      bidCpmMinor: 500, // $5.00 CPM
      budgetDailyMinor: 10000,
      spentTodayMinor: 1000,
    };

    const viewerContext: ViewerContext = {
      countryIso: 'JAM',
      diasporaHub: null,
      placement: 'feed',
      now: new Date('2026-09-01T12:00:00Z'),
      dayStart: new Date('2026-09-01T00:00:00Z'),
    };

    it('qualifies matching candidate for target audience and placement', () => {
      expect(isAdEligible(baseCandidate, viewerContext)).toBe(true);
    });

    it('disqualifies candidate when target country does not match and no diaspora match', () => {
      const nonMatchingViewer: ViewerContext = {
        ...viewerContext,
        countryIso: 'CAN',
        diasporaHub: null,
      };
      expect(isAdEligible(baseCandidate, nonMatchingViewer)).toBe(false);
    });

    it('ranks eligible ads by CPM bid and selects highest bidder', () => {
      const candidateLowBid: AdCandidate = {
        ...baseCandidate,
        id: 'ad_low',
        bidCpmMinor: 300,
      };

      const candidateHighBid: AdCandidate = {
        ...baseCandidate,
        id: 'ad_high',
        bidCpmMinor: 850,
      };

      const candidateMidBid: AdCandidate = {
        ...baseCandidate,
        id: 'ad_mid',
        bidCpmMinor: 550,
      };

      const winners = rankAndSelectAds(
        [candidateLowBid, candidateHighBid, candidateMidBid],
        viewerContext,
        1
      );

      expect(winners.length).toBe(1);
      expect(winners[0].id).toBe('ad_high');
      expect(winners[0].bidCpmMinor).toBe(850);
    });
  });

  // ===========================================================================
  // 4. Performance Metrics Derivation & Privacy Safeguards
  // ===========================================================================
  describe('4. Advertising Metrics & Privacy Targeting', () => {
    it('derives CTR, CPM, CPC, and conversion rates accurately in integer minor units', () => {
      const rawMetrics: CampaignMetrics = {
        impressions: 10000,
        reach: 8500,
        clicks: 500,
        conversions: 50,
        spendMinor: 5000, // $50.00
      };

      const derived = deriveMetrics(rawMetrics);
      // CTR: 500 / 10000 = 0.05 (5%)
      expect(derived.ctr).toBe(0.05);
      // CPM: (5000 / 10000) * 1000 = 500 minor units ($5.00)
      expect(derived.cpmMinor).toBe(500);
      // CPC: 5000 / 500 = 10 minor units ($0.10)
      expect(derived.cpcMinor).toBe(10);
      // Conversion Rate: 50 / 500 = 0.10 (10%)
      expect(derived.conversionRate).toBe(0.1);
    });

    it('calculates ROAS properly and returns null when spend is zero', () => {
      expect(roas(15000, 5000)).toBe(3.0); // 3x return
      expect(roas(5000, 0)).toBeNull();
    });

    it('enforces privacy-preserving targeting key boundaries', () => {
      expect(isPrivacyAwareTargeting('country')).toBe(true);
      expect(isPrivacyAwareTargeting('interest')).toBe(true);
      expect(isPrivacyAwareTargeting('placement')).toBe(true);
      expect(isPrivacyAwareTargeting('ssn_or_credit_score')).toBe(false);
      expect(isPrivacyAwareTargeting('invasive_health_status')).toBe(false);
    });
  });
});
