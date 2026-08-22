import { describe, it, expect } from 'vitest';
import {
  validateCampaign,
  deriveMetrics,
  roas,
  dailyPacing,
  isPrivacyAwareTargeting,
  MIN_CAMPAIGN_BUDGET_MINOR,
} from '../../packages/advertising/src/index';

describe('Campaign validation', () => {
  const valid = {
    advertiserId: 'adv_1',
    name: 'Carnival Ticket Push',
    objective: 'conversions' as const,
    budgetTotalMinor: 50000,
    currency: 'USD',
    startsAt: '2026-09-01T00:00:00Z',
  };

  it('accepts a well-formed campaign', () => {
    expect(validateCampaign(valid).valid).toBe(true);
  });

  it('enforces minimum budget and daily/total consistency', () => {
    expect(validateCampaign({ ...valid, budgetTotalMinor: MIN_CAMPAIGN_BUDGET_MINOR - 1 }).valid).toBe(false);
    expect(validateCampaign({ ...valid, budgetDailyMinor: 60000 }).errors).toContain(
      'Daily budget cannot exceed total budget',
    );
    expect(validateCampaign({ ...valid, currency: 'usd' }).errors).toContain('Currency must be ISO 4217');
    expect(
      validateCampaign({ ...valid, startsAt: '2026-09-01T00:00:00Z', endsAt: '2026-08-01T00:00:00Z' }).errors[0],
    ).toContain('after start date');
  });
});

describe('Advertising metrics', () => {
  it('derives CTR, CPM, CPC and conversion rate from raw counts', () => {
    const metrics = deriveMetrics({
      impressions: 50000, reach: 32000, clicks: 1250, conversions: 100, spendMinor: 25000,
    });
    expect(metrics.ctr).toBeCloseTo(0.025, 5);
    expect(metrics.cpmMinor).toBe(500);
    expect(metrics.cpcMinor).toBe(20);
    expect(metrics.conversionRate).toBeCloseTo(0.08, 5);
  });

  it('computes ROAS safely', () => {
    expect(roas(100000, 25000)).toBe(4);
    expect(roas(100000, 0)).toBeNull();
  });
});

describe('Daily budget pacing', () => {
  const dayStart = new Date('2026-08-20T00:00:00Z');

  it('allows spend while under-utilized relative to the day', () => {
    const noon = new Date('2026-08-20T12:00:00Z');
    const pacing = dailyPacing({ budgetDailyMinor: 10000, spentTodayMinor: 4000, now: noon, dayStart });
    expect(pacing.canSpend).toBe(true);
    expect(pacing.remainingTodayMinor).toBe(6000);
  });

  it('stops spend once the daily budget is exhausted', () => {
    const noon = new Date('2026-08-20T12:00:00Z');
    const pacing = dailyPacing({ budgetDailyMinor: 10000, spentTodayMinor: 10000, now: noon, dayStart });
    expect(pacing.canSpend).toBe(false);
    expect(pacing.remainingTodayMinor).toBe(0);
  });
});

describe('Privacy-aware targeting', () => {
  it('permits only coarse, declared targeting keys', () => {
    expect(isPrivacyAwareTargeting('country')).toBe(true);
    expect(isPrivacyAwareTargeting('interest')).toBe(true);
    expect(isPrivacyAwareTargeting('device_fingerprint')).toBe(false);
    expect(isPrivacyAwareTargeting('purchase_history')).toBe(false);
  });
});
