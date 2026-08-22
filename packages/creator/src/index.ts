export type SubscriptionTier = 'basic' | 'plus' | 'pro';

export const TIER_PRICES_MINOR: Record<SubscriptionTier, number> = {
  basic: 299,
  plus: 499,
  pro: 999,
};

export const SUPPORTED_CURRENCIES = ['USD', 'CAD', 'EUR', 'JMD', 'TTD', 'DOP', 'BBD', 'BSD', 'HTG'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export interface FeeStructure {
  platformCommissionBps: number;
  paymentProcessingBps: number;
  withholdingBps: number;
}

export const DEFAULT_FEES: FeeStructure = {
  platformCommissionBps: 1500,
  paymentProcessingBps: 290,
  withholdingBps: 0,
};

export interface RevenueBreakdown {
  grossMinor: number;
  platformFeeMinor: number;
  processingFeeMinor: number;
  withholdingMinor: number;
  netToCreatorMinor: number;
}

export function applyFees(grossMinor: number, fees: FeeStructure = DEFAULT_FEES): RevenueBreakdown {
  if (!Number.isInteger(grossMinor) || grossMinor <= 0) {
    throw new Error('Gross amount must be a positive integer in minor units');
  }
  const platformFeeMinor = Math.round((grossMinor * fees.platformCommissionBps) / 10000);
  const processingFeeMinor = Math.round((grossMinor * fees.paymentProcessingBps) / 10000);
  const withholdingMinor = Math.round((grossMinor * fees.withholdingBps) / 10000);
  const netToCreatorMinor = grossMinor - platformFeeMinor - processingFeeMinor - withholdingMinor;
  if (netToCreatorMinor < 0) {
    throw new Error('Fee structure produces negative creator net');
  }
  return { grossMinor, platformFeeMinor, processingFeeMinor, withholdingMinor, netToCreatorMinor };
}

export interface PayoutContext {
  availableBalanceMinor: number;
  pendingBalanceMinor: number;
  payoutThresholdMinor: number;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  fraudHold: boolean;
  chargebackReserveMinor: number;
}

export interface PayoutEvaluation {
  eligible: boolean;
  amountMinor: number;
  reasons: string[];
}

export function evaluatePayout(context: PayoutContext): PayoutEvaluation {
  const reasons: string[] = [];
  if (context.kycStatus !== 'verified') reasons.push('KYC verification required before payout');
  if (context.fraudHold) reasons.push('Payout is on fraud-review hold');
  const available = context.availableBalanceMinor - context.chargebackReserveMinor;
  if (available < context.payoutThresholdMinor) {
    reasons.push(`Available ${available} is below threshold ${context.payoutThresholdMinor}`);
  }
  return {
    eligible: reasons.length === 0,
    amountMinor: Math.max(0, available),
    reasons,
  };
}

export function nextPeriodEnd(from: Date = new Date()): Date {
  const next = new Date(from);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

export function isSubscriptionActive(status: string, currentPeriodEnd: string, now: Date = new Date()): boolean {
  if (status !== 'active' && status !== 'grace') return false;
  return new Date(currentPeriodEnd).getTime() > now.getTime();
}
