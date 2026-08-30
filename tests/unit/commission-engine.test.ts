import { describe, it, expect } from 'vitest';
import {
  CommissionEngine,
  CANONICAL_COMMISSION_RULES,
  type CommissionRule,
  type CommissionSnapshot,
} from '../../packages/payments/src/commission-engine';

describe('TUKUBI Universal Commission Engine', () => {
  const engine = new CommissionEngine();

  describe('Seller Tier-Dependent Rates', () => {
    it('applies standard commission (8% + $0.30) to Free Merchant transactions', () => {
      const result = engine.calculate({
        grossMinor: 10000, // $100.00
        currency: 'USD',
        sellerCategory: 'merchant',
        sellerTierCode: 'free',
        productType: 'physical',
      });

      expect(result.commissionRateBps).toBe(800); // 8%
      expect(result.commissionMinor).toBe(800); // $8.00
      expect(result.fixedFeeMinor).toBe(30); // $0.30
      expect(result.tukubiRevenueMinor).toBe(830); // $8.30
      expect(result.processingCostMinor).toBe(320); // 2.9% + 30¢ = $3.20
      expect(result.sellerNetMinor).toBe(8850); // $100.00 - $8.30 - $3.20 = $88.50
    });

    it('applies preferential 0% platform commission to Seller Pro merchants', () => {
      const result = engine.calculate({
        grossMinor: 10000, // $100.00
        currency: 'USD',
        sellerCategory: 'merchant',
        sellerTierCode: 'pro',
        productType: 'physical',
      });

      expect(result.commissionRateBps).toBe(0);
      expect(result.commissionMinor).toBe(0);
      expect(result.fixedFeeMinor).toBe(0);
      expect(result.tukubiRevenueMinor).toBe(0);
      expect(result.processingCostMinor).toBe(320); // Pass-through processing only
      expect(result.sellerNetMinor).toBe(9680); // $96.80
    });

    it('applies preferential 0% platform commission to Business+ accounts', () => {
      const result = engine.calculate({
        grossMinor: 25000, // $250.00
        currency: 'USD',
        sellerCategory: 'business',
        sellerTierCode: 'business_plus',
        productType: 'physical',
      });

      expect(result.commissionRateBps).toBe(0);
      expect(result.commissionMinor).toBe(0);
      expect(result.tukubiRevenueMinor).toBe(0);
    });
  });

  describe('Creator Economy Monetization', () => {
    it('applies 10% platform fee to Free Creator fan tips', () => {
      const result = engine.calculate({
        grossMinor: 5000, // $50.00 tip
        currency: 'USD',
        sellerCategory: 'creator',
        sellerTierCode: 'free',
        productType: 'creator_tip',
      });

      expect(result.commissionRateBps).toBe(1000); // 10%
      expect(result.commissionMinor).toBe(500); // $5.00
      expect(result.fixedFeeMinor).toBe(0);
      expect(result.tukubiRevenueMinor).toBe(500);
    });

    it('applies reduced 5% platform fee to Creator Plus fan tips', () => {
      const result = engine.calculate({
        grossMinor: 5000, // $50.00 tip
        currency: 'USD',
        sellerCategory: 'creator',
        sellerTierCode: 'plus',
        productType: 'creator_tip',
      });

      expect(result.commissionRateBps).toBe(500); // 5%
      expect(result.commissionMinor).toBe(250); // $2.50
      expect(result.tukubiRevenueMinor).toBe(250);
    });

    it('applies 0% platform fee to Creator Pro fan tips', () => {
      const result = engine.calculate({
        grossMinor: 5000, // $50.00 tip
        currency: 'USD',
        sellerCategory: 'creator',
        sellerTierCode: 'pro',
        productType: 'creator_tip',
      });

      expect(result.commissionRateBps).toBe(0);
      expect(result.commissionMinor).toBe(0);
      expect(result.tukubiRevenueMinor).toBe(0);
    });
  });

  describe('Category Standards', () => {
    it('applies 10% rate to digital goods marketplace sales', () => {
      const result = engine.calculate({
        grossMinor: 2000, // $20.00 digital file
        currency: 'USD',
        sellerCategory: 'user',
        sellerTierCode: 'free',
        productType: 'digital',
      });

      expect(result.commissionRateBps).toBe(1000); // 10%
      expect(result.commissionMinor).toBe(200); // $2.00
    });

    it('applies 5% + $0.50 to event ticket sales', () => {
      const result = engine.calculate({
        grossMinor: 5000, // $50.00 ticket
        currency: 'USD',
        sellerCategory: 'business',
        sellerTierCode: 'free',
        productType: 'event_ticket',
      });

      expect(result.commissionRateBps).toBe(500); // 5%
      expect(result.commissionMinor).toBe(250); // $2.50
      expect(result.fixedFeeMinor).toBe(50); // $0.50
      expect(result.tukubiRevenueMinor).toBe(300); // $3.00
    });

    it('applies 6% + $0.50 to service bookings', () => {
      const result = engine.calculate({
        grossMinor: 15000, // $150.00 service
        currency: 'USD',
        sellerCategory: 'business',
        sellerTierCode: 'free',
        productType: 'service',
      });

      expect(result.commissionRateBps).toBe(600); // 6%
      expect(result.commissionMinor).toBe(900); // $9.00
      expect(result.fixedFeeMinor).toBe(50); // $0.50
      expect(result.tukubiRevenueMinor).toBe(950); // $9.50
    });
  });

  describe('Promotional Commission Windows', () => {
    it('activates promotional rate within promo window and expires cleanly', () => {
      const promoRule: CommissionRule = {
        id: 'rule_carnival_promo',
        version: 1,
        ruleName: 'Carnival Launch Promo',
        accountCategory: 'merchant',
        tierCode: 'free',
        productType: 'physical',
        percentageBps: 800,
        fixedFeeMinor: 30,
        promotionalRateBps: 200, // 2% promo
        promotionalFixedMinor: 0,
        promoStartsAt: '2026-07-01T00:00:00Z',
        promoEndsAt: '2026-07-31T23:59:59Z',
        effectiveFrom: '2026-01-01T00:00:00Z',
      };

      const promoEngine = new CommissionEngine([promoRule, ...CANONICAL_COMMISSION_RULES]);

      // 1. During promo window (July 15, 2026)
      const duringPromo = promoEngine.calculate({
        grossMinor: 10000,
        sellerCategory: 'merchant',
        sellerTierCode: 'free',
        productType: 'physical',
        referenceDate: new Date('2026-07-15T12:00:00Z'),
      });
      expect(duringPromo.isPromotional).toBe(true);
      expect(duringPromo.commissionRateBps).toBe(200); // 2%
      expect(duringPromo.commissionMinor).toBe(200); // $2.00
      expect(duringPromo.fixedFeeMinor).toBe(0);

      // 2. After promo window (August 15, 2026)
      const afterPromo = promoEngine.calculate({
        grossMinor: 10000,
        sellerCategory: 'merchant',
        sellerTierCode: 'free',
        productType: 'physical',
        referenceDate: new Date('2026-08-15T12:00:00Z'),
      });
      expect(afterPromo.isPromotional).toBe(false);
      expect(afterPromo.commissionRateBps).toBe(800); // Standard 8%
      expect(afterPromo.commissionMinor).toBe(800);
      expect(afterPromo.fixedFeeMinor).toBe(30);
    });
  });

  describe('Commission Versioning & Historical Snapshot Preservation', () => {
    it('preserves historical transaction rates when commission rules are updated', () => {
      // Historical rule v1: 5%
      const v1Rule: CommissionRule = {
        id: 'rule_v1',
        version: 1,
        ruleName: 'Legacy Merchant Rule',
        accountCategory: 'merchant',
        tierCode: 'free',
        productType: 'physical',
        percentageBps: 500, // 5%
        fixedFeeMinor: 0,
        effectiveFrom: '2026-01-01T00:00:00Z',
      };

      const versionEngine = new CommissionEngine([v1Rule]);

      // Calculate transaction in January 2026
      const tx1 = versionEngine.calculate({
        grossMinor: 10000,
        sellerCategory: 'merchant',
        sellerTierCode: 'free',
        productType: 'physical',
      });
      expect(tx1.commissionRateBps).toBe(500);
      expect(tx1.commissionMinor).toBe(500);

      // Create snapshot for tx1
      const snapshot: Omit<CommissionSnapshot, 'id'> = versionEngine.createSnapshotPayload(
        tx1,
        'order_historical_001',
        'buyer_usr_1',
        'seller_usr_2'
      );
      expect(snapshot.commissionRateBps).toBe(500);
      expect(snapshot.commissionAmountMinor).toBe(500);
      expect(snapshot.commissionRuleVersion).toBe(1);

      // Now administrator introduces v2 in July 2026: 4%
      const v2Rule: CommissionRule = {
        id: 'rule_v2',
        version: 2,
        ruleName: 'Revised Merchant Rule',
        accountCategory: 'merchant',
        tierCode: 'free',
        productType: 'physical',
        percentageBps: 400, // 4%
        fixedFeeMinor: 0,
        effectiveFrom: '2026-07-01T00:00:00Z',
      };
      versionEngine.registerRule(v2Rule);

      // New transaction in July 2026 gets v2 (4%)
      const tx2 = versionEngine.calculate({
        grossMinor: 10000,
        sellerCategory: 'merchant',
        sellerTierCode: 'free',
        productType: 'physical',
        referenceDate: new Date('2026-07-15T00:00:00Z'),
      });
      expect(tx2.commissionRateBps).toBe(400);
      expect(tx2.commissionMinor).toBe(400);
      expect(tx2.ruleVersion).toBe(2);

      // CRITICAL INVARIANT: The historical snapshot of tx1 remains unchanged at 5% (500 minor units)!
      expect(snapshot.commissionRateBps).toBe(500);
      expect(snapshot.commissionAmountMinor).toBe(500);
    });
  });

  describe('Refund Economics (Full & Partial)', () => {
    it('calculates full refund proportional reversal', () => {
      const mockSnapshot: CommissionSnapshot = {
        id: 'snap_1',
        transactionId: 'tx_full_refund',
        payerId: 'buyer_1',
        sellerId: 'seller_1',
        accountCategory: 'merchant',
        sellerTier: 'free',
        productType: 'physical',
        grossAmountMinor: 10000, // $100.00
        currency: 'USD',
        commissionRuleVersion: 1,
        commissionRateBps: 800,
        commissionAmountMinor: 800, // $8.00
        fixedPlatformFeeMinor: 30, // $0.30
        paymentProcessingFeeMinor: 320,
        taxAmountMinor: 0,
        sellerNetMinor: 8850, // $88.50
        tukubiRevenueMinor: 830, // $8.30
        refundedAmountMinor: 0,
        commissionRefundedMinor: 0,
        isSettled: true,
        createdAt: '2026-08-01T00:00:00Z',
      };

      const refund = engine.calculateRefund(mockSnapshot, 10000);
      expect(refund.buyerRefundMinor).toBe(10000);
      expect(refund.commissionReversalMinor).toBe(830); // Full platform fee reversal
      expect(refund.sellerReversalMinor).toBe(9170); // Seller reversal
      expect(refund.remainingRefundableGrossMinor).toBe(0);
    });

    it('calculates partial refund proportional reversal', () => {
      const mockSnapshot: CommissionSnapshot = {
        id: 'snap_2',
        transactionId: 'tx_partial_refund',
        payerId: 'buyer_1',
        sellerId: 'seller_1',
        accountCategory: 'merchant',
        sellerTier: 'free',
        productType: 'physical',
        grossAmountMinor: 10000, // $100.00
        currency: 'USD',
        commissionRuleVersion: 1,
        commissionRateBps: 800,
        commissionAmountMinor: 800, // $8.00
        fixedPlatformFeeMinor: 0,
        paymentProcessingFeeMinor: 320,
        taxAmountMinor: 0,
        sellerNetMinor: 8880,
        tukubiRevenueMinor: 800, // $8.00
        refundedAmountMinor: 0,
        commissionRefundedMinor: 0,
        isSettled: true,
        createdAt: '2026-08-01T00:00:00Z',
      };

      // 50% partial refund ($50.00)
      const partial = engine.calculateRefund(mockSnapshot, 5000);
      expect(partial.buyerRefundMinor).toBe(5000);
      expect(partial.commissionReversalMinor).toBe(400); // 50% of $8.00 = $4.00
      expect(partial.sellerReversalMinor).toBe(4600);
      expect(partial.remainingRefundableGrossMinor).toBe(5000);
    });

    it('rejects refund exceeding remaining refundable balance', () => {
      const mockSnapshot: CommissionSnapshot = {
        id: 'snap_3',
        transactionId: 'tx_excessive',
        payerId: 'buyer_1',
        sellerId: 'seller_1',
        accountCategory: 'merchant',
        sellerTier: 'free',
        productType: 'physical',
        grossAmountMinor: 5000,
        currency: 'USD',
        commissionRuleVersion: 1,
        commissionRateBps: 500,
        commissionAmountMinor: 250,
        fixedPlatformFeeMinor: 0,
        paymentProcessingFeeMinor: 175,
        taxAmountMinor: 0,
        sellerNetMinor: 4575,
        tukubiRevenueMinor: 250,
        refundedAmountMinor: 4000, // Already refunded $40
        commissionRefundedMinor: 200,
        isSettled: true,
        createdAt: '2026-08-01T00:00:00Z',
      };

      // Remaining refundable is only $10 (1000 minor units); attempting $20 should throw
      expect(() => engine.calculateRefund(mockSnapshot, 2000)).toThrow('exceeds remaining refundable balance');
    });
  });
});
