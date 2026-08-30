// TUKUBI Universal Commission Engine & Revenue Calculator
// Implements versioned rules, transparent buyer/seller economics, and immutable snapshots.

import type { AccountCategory, CommissionRule, CommissionSnapshot } from './types';

export interface CommissionCalculationInput {
  grossMinor: number;
  currency?: string;
  sellerCategory: AccountCategory;
  sellerTierCode?: string; // 'free', 'starter', 'plus', 'pro', 'business_plus', 'enterprise'
  productType: string; // 'physical', 'digital', 'service', 'event_ticket', 'creator_tip', 'live_gift', etc.
  countryIso?: string;
  customRule?: CommissionRule; // Overriding or historical snapshot rule
  processingCostBps?: number; // e.g. 290 for 2.9%
  processingCostFixedMinor?: number; // e.g. 30 for 30 cents
  taxRateBps?: number; // Jurisdictional tax basis points if applicable
  referenceDate?: Date; // For promotional window evaluation
}

export interface CommissionCalculationResult {
  grossMinor: number;
  currency: string;
  sellerCategory: AccountCategory;
  sellerTierCode: string;
  productType: string;
  commissionRateBps: number;
  commissionMinor: number;
  fixedFeeMinor: number;
  processingCostMinor: number;
  taxMinor: number;
  sellerNetMinor: number;
  tukubiRevenueMinor: number; // commissionMinor + fixedFeeMinor
  ruleId?: string;
  ruleVersion: number;
  isPromotional: boolean;
  appliedAt: string;
}

export interface RefundBreakdownResult {
  originalGrossMinor: number;
  refundGrossMinor: number;
  proportionalFactor: number;
  buyerRefundMinor: number;
  sellerReversalMinor: number;
  commissionReversalMinor: number;
  newTukubiRevenueMinor: number;
  remainingRefundableGrossMinor: number;
}

export const CANONICAL_COMMISSION_RULES: CommissionRule[] = [
  // 1. Merchant Tier Rules
  {
    id: 'rule_merchant_free',
    version: 1,
    ruleName: 'Free Merchant Marketplace Standard',
    accountCategory: 'merchant',
    tierCode: 'free',
    productType: 'physical',
    percentageBps: 800, // 8.0%
    fixedFeeMinor: 30, // $0.30
    minCommissionMinor: 50,
    effectiveFrom: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule_seller_pro',
    version: 1,
    ruleName: 'Seller Pro Preferential Marketplace Rate',
    accountCategory: 'merchant',
    tierCode: 'pro',
    productType: 'physical',
    percentageBps: 0, // 0% on Pro plan
    fixedFeeMinor: 0,
    isExempt: true,
    effectiveFrom: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule_business_plus',
    version: 1,
    ruleName: 'Business+ Preferential Marketplace Rate',
    accountCategory: 'business',
    tierCode: 'business_plus',
    productType: 'physical',
    percentageBps: 0,
    fixedFeeMinor: 0,
    isExempt: true,
    effectiveFrom: '2026-01-01T00:00:00Z',
  },

  // 2. Creator Tier Rules
  {
    id: 'rule_creator_free_tips',
    version: 1,
    ruleName: 'Creator Free Fan Tips Platform Fee',
    accountCategory: 'creator',
    tierCode: 'free',
    productType: 'creator_tip',
    percentageBps: 1000, // 10%
    fixedFeeMinor: 0,
    effectiveFrom: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule_creator_plus_tips',
    version: 1,
    ruleName: 'Creator Plus Fan Tips Reduced Fee',
    accountCategory: 'creator',
    tierCode: 'plus',
    productType: 'creator_tip',
    percentageBps: 500, // 5%
    fixedFeeMinor: 0,
    effectiveFrom: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule_creator_pro_tips',
    version: 1,
    ruleName: 'Creator Pro Fan Tips Exemption',
    accountCategory: 'creator',
    tierCode: 'pro',
    productType: 'creator_tip',
    percentageBps: 0, // 0%
    fixedFeeMinor: 0,
    isExempt: true,
    effectiveFrom: '2026-01-01T00:00:00Z',
  },

  // 3. Category Standards
  {
    id: 'rule_digital_goods',
    version: 1,
    ruleName: 'Digital Goods Marketplace Standard',
    accountCategory: '*',
    tierCode: '*',
    productType: 'digital',
    percentageBps: 1000, // 10%
    fixedFeeMinor: 0,
    effectiveFrom: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule_event_tickets',
    version: 1,
    ruleName: 'Event Ticket Processing Standard',
    accountCategory: '*',
    tierCode: '*',
    productType: 'event_ticket',
    percentageBps: 500, // 5%
    fixedFeeMinor: 50, // $0.50
    effectiveFrom: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule_service_booking',
    version: 1,
    ruleName: 'Service Booking Standard',
    accountCategory: '*',
    tierCode: '*',
    productType: 'service',
    percentageBps: 600, // 6%
    fixedFeeMinor: 50, // $0.50
    effectiveFrom: '2026-01-01T00:00:00Z',
  },

  // 4. Default Fallback
  {
    id: 'rule_default_general',
    version: 1,
    ruleName: 'Default Baseline Commission',
    accountCategory: '*',
    tierCode: '*',
    productType: '*',
    percentageBps: 500, // 5%
    fixedFeeMinor: 0,
    effectiveFrom: '2026-01-01T00:00:00Z',
  },
];

export class CommissionEngine {
  private rules: CommissionRule[];

  constructor(customRules?: CommissionRule[]) {
    this.rules = customRules ?? [...CANONICAL_COMMISSION_RULES];
  }

  /**
   * Registers a new versioned rule or updates rule set.
   * Does not mutate existing snapshots.
   */
  public registerRule(rule: CommissionRule): void {
    this.rules.unshift(rule);
  }

  /**
   * Resolves the matching commission rule for the given transaction parameters and reference date.
   */
  public resolveRule(
    sellerCategory: AccountCategory,
    sellerTierCode: string,
    productType: string,
    referenceDate: Date = new Date()
  ): CommissionRule {
    const timestamp = referenceDate.getTime();

    // Priority hierarchy:
    // 1. Exact match (category + tier + productType)
    // 2. Category + productType wildcard tier
    // 3. Category + tier wildcard productType
    // 4. ProductType wildcard category & tier
    // 5. Global default fallback
    for (const rule of this.rules) {
      const from = new Date(rule.effectiveFrom).getTime();
      const to = rule.effectiveTo ? new Date(rule.effectiveTo).getTime() : Infinity;
      if (timestamp < from || timestamp > to) continue;

      const categoryMatch = rule.accountCategory === '*' || rule.accountCategory === sellerCategory;
      const tierMatch = rule.tierCode === '*' || rule.tierCode === sellerTierCode;
      const productMatch = rule.productType === '*' || rule.productType === productType;

      if (categoryMatch && tierMatch && productMatch) {
        return rule;
      }
    }

    return this.rules[this.rules.length - 1]; // Fallback to last rule
  }

  /**
   * Authoritatively computes seller net, platform commission, fees, and TUKUBI revenue.
   * Calculations strictly use integer arithmetic in minor units (cents).
   */
  public calculate(input: CommissionCalculationInput): CommissionCalculationResult {
    if (!Number.isSafeInteger(input.grossMinor) || input.grossMinor <= 0) {
      throw new Error('Gross transaction amount must be a positive integer in minor units');
    }

    const tier = input.sellerTierCode || 'free';
    const currency = input.currency || 'USD';
    const refDate = input.referenceDate || new Date();

    const rule = input.customRule ?? this.resolveRule(input.sellerCategory, tier, input.productType, refDate);

    let isPromotional = false;
    let effectiveBps = rule.percentageBps;
    let effectiveFixedMinor = rule.fixedFeeMinor;

    // Check promotional rate applicability
    if (rule.promotionalRateBps !== undefined && rule.promoStartsAt && rule.promoEndsAt) {
      const pStart = new Date(rule.promoStartsAt).getTime();
      const pEnd = new Date(rule.promoEndsAt).getTime();
      const nowMs = refDate.getTime();
      if (nowMs >= pStart && nowMs <= pEnd) {
        effectiveBps = rule.promotionalRateBps;
        if (rule.promotionalFixedMinor !== undefined) {
          effectiveFixedMinor = rule.promotionalFixedMinor;
        }
        isPromotional = true;
      }
    }

    // Exempt rule means 0 commission and 0 fixed fee
    if (rule.isExempt) {
      effectiveBps = 0;
      effectiveFixedMinor = 0;
    }

    // Calculate Commission
    let rawCommissionMinor = Math.round((input.grossMinor * effectiveBps) / 10000);

    // Apply min/max bounds if defined
    if (rule.minCommissionMinor && rawCommissionMinor < rule.minCommissionMinor && effectiveBps > 0) {
      rawCommissionMinor = rule.minCommissionMinor;
    }
    if (rule.maxCommissionMinor && rawCommissionMinor > rule.maxCommissionMinor) {
      rawCommissionMinor = rule.maxCommissionMinor;
    }

    const commissionMinor = rawCommissionMinor;
    const fixedFeeMinor = effectiveFixedMinor;

    // Processing Cost (standard payment gateway pass-through: 2.9% + 30¢ default if applicable)
    const procBps = input.processingCostBps ?? 290;
    const procFixed = input.processingCostFixedMinor ?? 30;
    const processingCostMinor = Math.round((input.grossMinor * procBps) / 10000) + procFixed;

    // Optional Tax
    const taxBps = input.taxRateBps ?? 0;
    const taxMinor = taxBps > 0 ? Math.round((input.grossMinor * taxBps) / 10000) : 0;

    // Seller Net = Gross - Commission - Fixed Platform Fee - Processing Cost - Tax
    const totalDeductions = commissionMinor + fixedFeeMinor + processingCostMinor + taxMinor;
    const sellerNetMinor = input.grossMinor - totalDeductions;

    if (sellerNetMinor < 0) {
      throw new Error(`Total deductions (${totalDeductions}) exceed gross transaction amount (${input.grossMinor})`);
    }

    // TUKUBI Revenue = Commission + Fixed Platform Fee
    const tukubiRevenueMinor = commissionMinor + fixedFeeMinor;

    return {
      grossMinor: input.grossMinor,
      currency,
      sellerCategory: input.sellerCategory,
      sellerTierCode: tier,
      productType: input.productType,
      commissionRateBps: effectiveBps,
      commissionMinor,
      fixedFeeMinor,
      processingCostMinor,
      taxMinor,
      sellerNetMinor,
      tukubiRevenueMinor,
      ruleId: rule.id,
      ruleVersion: rule.version,
      isPromotional,
      appliedAt: refDate.toISOString(),
    };
  }

  /**
   * Calculates proportional financial reversal for full or partial refunds.
   * Historical rule rate is preserved from the snapshot.
   */
  public calculateRefund(
    snapshot: CommissionSnapshot,
    refundGrossMinor: number
  ): RefundBreakdownResult {
    if (!Number.isSafeInteger(refundGrossMinor) || refundGrossMinor <= 0) {
      throw new Error('Refund amount must be a positive integer in minor units');
    }

    const remainingGross = snapshot.grossAmountMinor - snapshot.refundedAmountMinor;
    if (refundGrossMinor > remainingGross) {
      throw new Error(`Refund amount (${refundGrossMinor}) exceeds remaining refundable balance (${remainingGross})`);
    }

    const factor = refundGrossMinor / snapshot.grossAmountMinor;

    // Proportional reversal of seller net and platform commission
    const commissionReversalMinor = Math.round(snapshot.commissionAmountMinor * factor);
    const fixedFeeReversalMinor = Math.round(snapshot.fixedPlatformFeeMinor * factor);
    const totalPlatformReversalMinor = commissionReversalMinor + fixedFeeReversalMinor;

    const sellerReversalMinor = refundGrossMinor - totalPlatformReversalMinor;
    const newTukubiRevenueMinor = snapshot.tukubiRevenueMinor - totalPlatformReversalMinor;

    return {
      originalGrossMinor: snapshot.grossAmountMinor,
      refundGrossMinor,
      proportionalFactor: factor,
      buyerRefundMinor: refundGrossMinor,
      sellerReversalMinor,
      commissionReversalMinor: totalPlatformReversalMinor,
      newTukubiRevenueMinor,
      remainingRefundableGrossMinor: remainingGross - refundGrossMinor,
    };
  }

  /**
   * Creates an immutable point-of-sale snapshot record ready for database persistence.
   */
  public createSnapshotPayload(
    calc: CommissionCalculationResult,
    transactionId: string,
    payerId: string,
    sellerId: string,
    options: {
      orderId?: string;
      paymentIntentId?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Omit<CommissionSnapshot, 'id'> {
    return {
      transactionId,
      orderId: options.orderId,
      paymentIntentId: options.paymentIntentId,
      payerId,
      sellerId,
      accountCategory: calc.sellerCategory,
      sellerTier: calc.sellerTierCode,
      productType: calc.productType,
      grossAmountMinor: calc.grossMinor,
      currency: calc.currency,
      commissionRuleId: calc.ruleId,
      commissionRuleVersion: calc.ruleVersion,
      commissionRateBps: calc.commissionRateBps,
      commissionAmountMinor: calc.commissionMinor,
      fixedPlatformFeeMinor: calc.fixedFeeMinor,
      paymentProcessingFeeMinor: calc.processingCostMinor,
      taxAmountMinor: calc.taxMinor,
      sellerNetMinor: calc.sellerNetMinor,
      tukubiRevenueMinor: calc.tukubiRevenueMinor,
      refundedAmountMinor: 0,
      commissionRefundedMinor: 0,
      isSettled: false,
      metadata: options.metadata,
      createdAt: calc.appliedAt,
    };
  }
}
