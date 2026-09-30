import { describe, it, expect } from 'vitest';
import {
  Money,
  LedgerOrchestrator,
  CommissionEngine,
  calculateCommission,
  calculateProportionalRefund,
  CANONICAL_COMMISSION_RULES,
  sumLedgerMinorUnits,
} from '../../packages/payments/src';

describe('Phase 8 — Double-Entry Financial Center & Multi-Currency Ledger Certification', () => {
  const orchestrator = new LedgerOrchestrator();

  // ===========================================================================
  // 1. Integer Minor Units & Floating-Point Prohibition
  // ===========================================================================
  describe('1. Minor Unit Integrity & ISO 4217 Currency Safety', () => {
    it('creates Money objects strictly with integer minor units', () => {
      const money = new Money(5000, 'USD'); // $50.00
      expect(money.amountMinor).toBe(5000);
      expect(money.currency).toBe('USD');
      expect(money.toDecimal()).toBe(50.0);
    });

    it('strictly throws when a floating-point or non-integer minor unit is supplied', () => {
      expect(() => new Money(19.99 as any, 'USD')).toThrow(
        'Money amount must be an integer in minor units'
      );
      expect(() => new Money(NaN as any, 'USD')).toThrow(
        'Money amount must be an integer in minor units'
      );
    });

    it('strictly enforces 3-letter uppercase ISO 4217 currency format', () => {
      expect(() => new Money(1000, 'usd')).toThrow('Money currency must be an ISO 4217 code');
      expect(() => new Money(1000, 'US')).toThrow('Money currency must be an ISO 4217 code');
      expect(() => new Money(1000, 'DOLLARS')).toThrow('Money currency must be an ISO 4217 code');

      // Valid Caribbean and international currencies
      expect(new Money(1000, 'JMD').currency).toBe('JMD');
      expect(new Money(1000, 'TTD').currency).toBe('TTD');
      expect(new Money(1000, 'BBD').currency).toBe('BBD');
      expect(new Money(1000, 'XCD').currency).toBe('XCD');
    });

    it('performs exact addition, subtraction, and basis points arithmetic without drift', () => {
      const a = new Money(2500, 'USD'); // $25.00
      const b = new Money(750, 'USD');  // $7.50

      const sum = a.add(b);
      expect(sum.amountMinor).toBe(3250);

      const diff = a.subtract(b);
      expect(diff.amountMinor).toBe(1750);

      // 10% fee (1000 bps) on $25.00 = $2.50 (250 minor units)
      const fee = a.percentage(1000);
      expect(fee.amountMinor).toBe(250);
    });

    it('strictly prevents arithmetic operations across mismatched currencies', () => {
      const usd = new Money(1000, 'USD');
      const jmd = new Money(1000, 'JMD');

      expect(() => usd.add(jmd)).toThrow(/Currency mismatch/);
      expect(() => usd.subtract(jmd)).toThrow(/Currency mismatch/);
    });
  });

  // ===========================================================================
  // 2. Double-Entry Zero-Sum Invariant
  // ===========================================================================
  describe('2. Double-Entry Zero-Sum Balancing & Reversals', () => {
    it('creates debit and credit pairs that sum exactly to zero', () => {
      const payload = orchestrator.createDoubleEntryPayload({
        transactionId: 'tx-order-001',
        sourceAccountId: 'acc-buyer-wallet',
        destinationAccountId: 'acc-escrow-hold',
        amount: 8500, // $85.00
        currency: 'USD',
        idempotencyKey: 'idem-tx-001',
        description: 'Order #001 Escrow Hold',
      });

      expect(payload.debitEntry.amount).toBe(-8500);
      expect(payload.creditEntry.amount).toBe(8500);

      const netSum = payload.debitEntry.amount + payload.creditEntry.amount;
      expect(netSum).toBe(0);

      expect(sumLedgerMinorUnits([payload.debitEntry, payload.creditEntry])).toBe(0);
    });

    it('rejects double-entry generation when source and destination accounts are identical', () => {
      expect(() =>
        orchestrator.createDoubleEntryPayload({
          transactionId: 'tx-self-transfer',
          sourceAccountId: 'acc-same',
          destinationAccountId: 'acc-same',
          amount: 5000,
          currency: 'USD',
          idempotencyKey: 'idem-err',
          description: 'Self-transfer attempt',
        })
      ).toThrow('Source and destination accounts must be distinct.');
    });

    it('rejects non-positive and fractional amounts in ledger generation', () => {
      expect(() =>
        orchestrator.createDoubleEntryPayload({
          transactionId: 'tx-zero',
          sourceAccountId: 'acc-1',
          destinationAccountId: 'acc-2',
          amount: 0,
          currency: 'USD',
          idempotencyKey: 'idem-0',
          description: 'Zero transfer',
        })
      ).toThrow('Financial transaction amount must be strictly greater than zero.');

      expect(() =>
        orchestrator.createDoubleEntryPayload({
          transactionId: 'tx-fraction',
          sourceAccountId: 'acc-1',
          destinationAccountId: 'acc-2',
          amount: 15.5,
          currency: 'USD',
          idempotencyKey: 'idem-frac',
          description: 'Fractional transfer',
        })
      ).toThrow('Ledger amount must be an integer in minor units.');
    });

    it('generates compensating reversal entries without mutating original rows', () => {
      const reversal = orchestrator.createReversalPayload(
        'tx-original',
        'tx-reversal',
        'acc-buyer',
        'acc-escrow',
        8500,
        'idem-rev-1',
        'Order cancelled by buyer before shipment'
      );

      // Reversal inverts destination -> source
      expect(reversal.debitEntry.account_id).toBe('acc-escrow');
      expect(reversal.debitEntry.amount).toBe(-8500);

      expect(reversal.creditEntry.account_id).toBe('acc-buyer');
      expect(reversal.creditEntry.amount).toBe(8500);

      expect(reversal.debitEntry.amount + reversal.creditEntry.amount).toBe(0);
    });
  });

  // ===========================================================================
  // 3. Commission Engine & Multi-Vendor Split Settlements
  // ===========================================================================
  describe('3. Multi-Vendor Commission Engine & Revenue Mathematics', () => {
    const commissionEngine = new CommissionEngine();

    it('calculates standard merchant marketplace commission and verifies zero-loss settlement', () => {
      // 8.0% commission + $0.30 fixed fee on $100.00 gross order
      const res = commissionEngine.calculate({
        grossMinor: 10000,
        sellerCategory: 'merchant',
        sellerTierCode: 'free',
        productType: 'physical',
        processingCostBps: 0,
        processingCostFixedMinor: 0,
      });

      expect(res.grossMinor).toBe(10000);
      expect(res.commissionMinor).toBe(800); // 8% of $100 = $8.00
      expect(res.fixedFeeMinor).toBe(30);   // $0.30
      expect(res.tukubiRevenueMinor).toBe(830); // $8.30 total platform cut
      expect(res.sellerNetMinor).toBe(9170); // $91.70 seller net

      // Conservation of funds: sellerNet + platformRevenue === gross
      expect(res.sellerNetMinor + res.tukubiRevenueMinor).toBe(res.grossMinor);
    });

    it('calculates 0% commission for Pro Seller Plan members with zero platform deduction', () => {
      const proRule = CANONICAL_COMMISSION_RULES.find((r) => r.id === 'rule_seller_pro');
      expect(proRule).toBeDefined();

      const res = commissionEngine.calculate({
        grossMinor: 15000,
        sellerCategory: 'merchant',
        sellerTierCode: 'pro',
        productType: 'physical',
        customRule: proRule,
        processingCostBps: 0,
        processingCostFixedMinor: 0,
      });

      expect(res.commissionMinor).toBe(0);
      expect(res.fixedFeeMinor).toBe(0);
      expect(res.sellerNetMinor).toBe(15000);
      expect(res.sellerNetMinor + res.tukubiRevenueMinor).toBe(res.grossMinor);
    });

    it('computes proportional refunds preserving integer balance', () => {
      const snapshot = {
        ruleId: 'rule-1',
        ruleVersion: 1,
        grossAmountMinor: 10000,
        currency: 'USD',
        commissionRateBps: 800,
        commissionAmountMinor: 800,
        fixedPlatformFeeMinor: 30,
        sellerNetMinor: 9170,
        tukubiRevenueMinor: 830,
        refundedAmountMinor: 0,
        snapshotCreatedAt: new Date().toISOString(),
      };

      const refund = commissionEngine.calculateRefund(snapshot, 5000);

      expect(refund.proportionalFactor).toBe(0.5);
      expect(refund.buyerRefundMinor).toBe(5000);
      expect(refund.sellerReversalMinor + refund.commissionReversalMinor).toBe(refund.buyerRefundMinor);
    });
  });
});
