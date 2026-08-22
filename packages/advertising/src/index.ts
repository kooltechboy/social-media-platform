export type CampaignObjective = 'awareness' | 'traffic' | 'engagement' | 'conversions';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'rejected';

export interface CampaignInput {
  advertiserId: string;
  name: string;
  objective: CampaignObjective;
  budgetTotalMinor: number;
  budgetDailyMinor?: number;
  currency: string;
  startsAt: string;
  endsAt?: string;
}

export const MIN_CAMPAIGN_BUDGET_MINOR = 1000;

export function validateCampaign(input: CampaignInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.name.trim()) errors.push('Campaign name is required');
  if (!Number.isInteger(input.budgetTotalMinor) || input.budgetTotalMinor < MIN_CAMPAIGN_BUDGET_MINOR) {
    errors.push(`Total budget must be at least ${MIN_CAMPAIGN_BUDGET_MINOR} minor units`);
  }
  if (input.budgetDailyMinor !== undefined && input.budgetDailyMinor <= 0) {
    errors.push('Daily budget must be positive');
  }
  if (input.budgetDailyMinor !== undefined && input.budgetDailyMinor > input.budgetTotalMinor) {
    errors.push('Daily budget cannot exceed total budget');
  }
  if (!/^[A-Z]{3}$/.test(input.currency)) errors.push('Currency must be ISO 4217');
  const start = new Date(input.startsAt);
  if (Number.isNaN(start.getTime())) errors.push('Invalid start date');
  if (input.endsAt) {
    const end = new Date(input.endsAt);
    if (Number.isNaN(end.getTime())) errors.push('Invalid end date');
    else if (end <= start) errors.push('End date must be after start date');
  }
  return { valid: errors.length === 0, errors };
}

export interface CampaignMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  spendMinor: number;
}

export function deriveMetrics(metrics: CampaignMetrics): {
  ctr: number;
  cpmMinor: number;
  cpcMinor: number;
  roas: number | null;
  conversionRate: number;
} {
  const ctr = metrics.impressions === 0 ? 0 : metrics.clicks / metrics.impressions;
  const cpmMinor = metrics.impressions === 0 ? 0 : Math.round((metrics.spendMinor / metrics.impressions) * 1000);
  const cpcMinor = metrics.clicks === 0 ? 0 : Math.round(metrics.spendMinor / metrics.clicks);
  const conversionRate = metrics.clicks === 0 ? 0 : metrics.conversions / metrics.clicks;
  return { ctr, cpmMinor, cpcMinor, roas: null, conversionRate };
}

export function roas(revenueMinor: number, spendMinor: number): number | null {
  if (spendMinor <= 0) return null;
  return revenueMinor / spendMinor;
}

export interface PacingContext {
  budgetDailyMinor: number;
  spentTodayMinor: number;
  now: Date;
  dayStart: Date;
}

export function dailyPacing(context: PacingContext): { canSpend: boolean; remainingTodayMinor: number; utilization: number } {
  const dayMs = 24 * 60 * 60 * 1000;
  const elapsed = Math.min(Math.max(context.now.getTime() - context.dayStart.getTime(), 0), dayMs);
  const expectedUtilization = elapsed / dayMs;
  const actualUtilization = context.budgetDailyMinor === 0 ? 1 : context.spentTodayMinor / context.budgetDailyMinor;
  const remainingTodayMinor = Math.max(0, context.budgetDailyMinor - context.spentTodayMinor);
  const canSpend = remainingTodayMinor > 0 && actualUtilization <= expectedUtilization + 0.1;
  return { canSpend, remainingTodayMinor, utilization: actualUtilization };
}

export const ALLOWED_TARGETING_KEYS = [
  'country', 'interest', 'placement', 'language', 'community',
] as const;
export type AllowedTargetingKey = (typeof ALLOWED_TARGETING_KEYS)[number];

export function isPrivacyAwareTargeting(key: string): key is AllowedTargetingKey {
  return (ALLOWED_TARGETING_KEYS as readonly string[]).includes(key);
}
