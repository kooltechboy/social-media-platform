import { describe, it, expect } from 'vitest';
import { CommissionEngine } from '../../packages/payments/src/commission-engine';
import { LedgerOrchestrator } from '../../packages/payments/src/ledger';
import { EntitlementEngine } from '../../packages/payments/src/entitlements';
import { computeLineTotal, computeOrderTotals } from '../../packages/marketplace/src/index';

describe('TUKUBI Anti-Manipulation & Financial Security Invariants', () => {
  const commissionEngine = new CommissionEngine();
  const ledger = new LedgerOrchestrator();
  const entitlementEngine = new EntitlementEngine();

  describe('Server-Side Price & Quantity Integrity', () => {
    it('rejects zero or negative unit price', () => {
      expect(() =>
        computeLineTotal({
          productId: 'prod_1',
          sellerId: 'sel_1',
          unitPriceMinor: 0,
          quantity: 1,
          productKind: 'physical',
        })
      ).toThrow('positive integer minor units');

      expect(() =>
        computeLineTotal({
          productId: 'prod_1',
          sellerId: 'sel_1',
          unitPriceMinor: -1500,
          quantity: 1,
          productKind: 'physical',
        })
      ).toThrow('positive integer minor units');
    });

    it('rejects fractional minor units (floating-point injection)', () => {
      expect(() =>
        computeLineTotal({
          productId: 'prod_1',
          sellerId: 'sel_1',
          unitPriceMinor: 10.99,
          quantity: 1,
          productKind: 'physical',
        })
      ).toThrow('positive integer minor units');
    });

    it('rejects quantities out of bounds (< 1 or > 20 per line)', () => {
      expect(() =>
        computeLineTotal({
          productId: 'prod_1',
          sellerId: 'sel_1',
          unitPriceMinor: 1000,
          quantity: 0,
          productKind: 'physical',
        })
      ).toThrow('between 1 and 20');

      expect(() =>
        computeLineTotal({
          productId: 'prod_1',
          sellerId: 'sel_1',
          unitPriceMinor: 1000,
          quantity: 99,
          productKind: 'physical',
        })
      ).toThrow('between 1 and 20');
    });
  });

  describe('Commission Engine Tamper Resistance', () => {
    it('rejects negative gross amounts in commission calculation', () => {
      expect(() =>
        commissionEngine.calculate({
          grossMinor: -5000,
          sellerCategory: 'merchant',
          sellerTierCode: 'free',
          productType: 'physical',
        })
      ).toThrow('positive integer in minor units');
    });

    it('rejects floating point amounts in commission calculation', () => {
      expect(() =>
        commissionEngine.calculate({
          grossMinor: 100.5,
          sellerCategory: 'merchant',
          sellerTierCode: 'free',
          productType: 'physical',
        })
      ).toThrow('positive integer in minor units');
    });

    it('prevents total deductions from exceeding gross amount', () => {
      // In the rare scenario where deductions > gross, calculation must reject rather than create negative seller net
      expect(() =>
        commissionEngine.calculate({
          grossMinor: 20, // 20 cents
          sellerCategory: 'merchant',
          sellerTierCode: 'free',
          productType: 'physical',
          processingCostBps: 290,
          processingCostFixedMinor: 50, // Fixed fee $0.50 alone exceeds $0.20
        })
      ).toThrow('exceed gross transaction amount');
    });
  });

  describe('Double-Entry Ledger Integrity & Balance Equations', () => {
    it('verifies multi-split transaction debits and credits strictly sum to zero', () => {
      const payload = ledger.createMultiSplitTransactionPayload({
        transactionId: 'tx_multisplit_test',
        buyerAccountId: 'acc_buyer',
        sellerAccountId: 'acc_seller',
        platformRevenueAccountId: 'acc_platform',
        processingClearingAccountId: 'acc_proc',
        taxClearingAccountId: 'acc_tax',
        grossMinor: 10000, // $100.00
        commissionMinor: 800, // $8.00
        fixedFeeMinor: 30, // $0.30
        processingFeeMinor: 320, // $3.20
        taxMinor: 500, // $5.00
        sellerNetMinor: 8350, // $83.50
        currency: 'USD',
        idempotencyKey: 'idemp_multi_001',
        description: 'Order #1001 purchase',
      });

      expect(payload.netZeroVerified).toBe(true);
      expect(payload.totalDebitMinor).toBe(10000);
      expect(payload.totalCreditMinor).toBe(10000);

      const sum = payload.entries.reduce((acc, e) => acc + e.amount, 0);
      expect(sum).toBe(0);
    });

    it('rejects unbalanced multi-split transactions before writing', () => {
      expect(() =>
        ledger.createMultiSplitTransactionPayload({
          transactionId: 'tx_unbalanced',
          buyerAccountId: 'acc_buyer',
          sellerAccountId: 'acc_seller',
          platformRevenueAccountId: 'acc_platform',
          processingClearingAccountId: 'acc_proc',
          grossMinor: 10000,
          commissionMinor: 800,
          fixedFeeMinor: 30,
          processingFeeMinor: 320,
          sellerNetMinor: 8000, // Misallocated! Sum is 9150 != 10000
          currency: 'USD',
          idempotencyKey: 'idemp_unbal',
          description: 'Unbalanced tx',
        })
      ).toThrow('Ledger integrity violation');
    });
  });

  describe('Entitlement Protection & Privilege Escalation Defense', () => {
    it('denies enterprise/pro tools to free tiers regardless of client assertions', () => {
      expect(entitlementEngine.hasEntitlement('merchant_free', 'unlimited_listings')).toBe(false);
      expect(entitlementEngine.hasEntitlement('merchant_free', 'ai_tools')).toBe(false);
      expect(entitlementEngine.hasEntitlement('merchant_free', 'advanced_crm')).toBe(false);
      expect(entitlementEngine.hasEntitlement('creator_free', 'zero_tip_commission')).toBe(false);
      expect(entitlementEngine.hasEntitlement('user_free', 'patron_badge')).toBe(false);
    });
  });
});
