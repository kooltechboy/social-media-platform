import { describe, it, expect } from 'vitest';
import {
  CARIBBEAN_CURRENCIES,
  formatCaribbeanMoney,
  isCaribbeanCurrency,
  type CaribbeanCurrencyCode,
  LedgerOrchestrator,
  PaymentPolicyEngine,
  FinancialReconciliationEngine,
  Money,
} from '../packages/payments/src/index';
import { canTransitionEscrow, type EscrowStatus } from '../packages/marketplace/src/tagging';

describe('Phase 4: Multi-Currency Financial Ledger & Social Commerce Suite', () => {
  const orchestrator = new LedgerOrchestrator();

  // =========================================================================
  // 1. Caribbean Regional Currency Registry
  // =========================================================================
  describe('1. Caribbean Currency Registry & Minor Units', () => {
    it('contains all core Caribbean basin and diaspora currencies with 2 decimal exponents', () => {
      const expectedCurrencies = [
        'USD', 'JMD', 'TTD', 'XCD', 'BBD', 'BSD', 'GYD', 'SRD', 'HTG', 'DOP',
        'ANG', 'AWG', 'KYD', 'BZD', 'EUR', 'GBP', 'CAD',
      ];

      for (const code of expectedCurrencies) {
        expect(isCaribbeanCurrency(code)).toBe(true);
        const meta = CARIBBEAN_CURRENCIES[code as CaribbeanCurrencyCode];
        expect(meta).toBeDefined();
        expect(meta.minorExponent).toBe(2);
        expect(meta.name.length).toBeGreaterThan(0);
        expect(meta.symbol.length).toBeGreaterThan(0);
      }
    });

    it('formats Caribbean amounts authentically with correct currency symbol', () => {
      // 5000 JMD minor = $50.00 JMD
      const formattedJMD = formatCaribbeanMoney(5000, 'JMD');
      expect(formattedJMD).toContain('50.00');
      expect(formattedJMD).toContain('J$');

      // 1000 TTD minor = $10.00 TTD
      const formattedTTD = formatCaribbeanMoney(1000, 'TTD');
      expect(formattedTTD).toContain('10.00');
      expect(formattedTTD).toContain('TT$');

      // 2500 USD minor = $25.00 USD
      const formattedUSD = formatCaribbeanMoney(2500, 'USD');
      expect(formattedUSD).toContain('$25.00');
    });

    it('rejects invalid or non-integer minor unit amounts', () => {
      expect(() => formatCaribbeanMoney(12.34, 'USD')).toThrow('integer in minor units');
    });
  });

  // =========================================================================
  // 2. Double-Entry Reversal & Multi-Split Refund Invariants
  // =========================================================================
  describe('2. Double-Entry Reversals & Multi-Split Refund Engine', () => {
    it('creates a reversal payload preserving the transaction currency (not hardcoded to USD)', () => {
      const reversal = orchestrator.createReversalPayload(
        'tx_jmd_101',
        'tx_jmd_101_rev',
        'acc_buyer_jmd',
        'acc_seller_jmd',
        500000, // 5,000.00 JMD
        'idemp_jmd_rev_1',
        'Merchant requested cancellation',
        'JMD'
      );

      expect(reversal.debitEntry.amount + reversal.creditEntry.amount).toBe(0);
      expect(reversal.debitEntry.account_id).toBe('acc_seller_jmd');
      expect(reversal.creditEntry.account_id).toBe('acc_buyer_jmd');
      expect(reversal.debitEntry.amount).toBe(-500000);
      expect(reversal.creditEntry.amount).toBe(500000);
    });

    it('creates a balanced multi-split refund payload reversing buyer, seller, platform, and tax proportionately', () => {
      // Original: Gross 10,000 (100.00), Seller Net 8,500, Platform Rev 1,000, Proc Fee 300, Tax 200
      // 50% partial refund: Gross 5,000, Seller Net 4,250, Platform Rev 500, Proc Fee 0 (retained by PSP), Tax 250
      const refundPayload = orchestrator.createMultiSplitRefundPayload({
        refundTransactionId: 'tx_refund_999',
        originalTransactionId: 'tx_orig_123',
        buyerAccountId: 'acc_buyer_wallet',
        sellerAccountId: 'acc_seller_pending',
        platformRevenueAccountId: 'acc_platform_rev',
        taxClearingAccountId: 'acc_tax_clearing',
        refundGrossMinor: 5000,
        sellerRefundDebitMinor: 4350,
        platformCommissionRefundDebitMinor: 500,
        taxRefundDebitMinor: 150,
        currency: 'USD',
        idempotencyKey: 'idemp_refund_999',
        reason: 'Customer returned damaged item',
      });

      expect(refundPayload.netZeroVerified).toBe(true);
      expect(refundPayload.totalCreditMinor).toBe(5000);
      expect(refundPayload.totalDebitMinor).toBe(5000);

      const sum = refundPayload.entries.reduce((acc, e) => acc + e.amount, 0);
      expect(sum).toBe(0);

      // Verify entries composition
      const buyerCredit = refundPayload.entries.find((e) => e.entry_type === 'CREDIT' && e.account_id === 'acc_buyer_wallet');
      const sellerDebit = refundPayload.entries.find((e) => e.entry_type === 'DEBIT' && e.account_id === 'acc_seller_pending');
      const platformDebit = refundPayload.entries.find((e) => e.entry_type === 'DEBIT' && e.account_id === 'acc_platform_rev');
      const taxDebit = refundPayload.entries.find((e) => e.entry_type === 'DEBIT' && e.account_id === 'acc_tax_clearing');

      expect(buyerCredit?.amount).toBe(5000);
      expect(sellerDebit?.amount).toBe(-4350);
      expect(platformDebit?.amount).toBe(-500);
      expect(taxDebit?.amount).toBe(-150);
    });

    it('rejects refund payload if debits do not equal gross credit', () => {
      expect(() =>
        orchestrator.createMultiSplitRefundPayload({
          refundTransactionId: 'tx_bad_refund',
          originalTransactionId: 'tx_orig_123',
          buyerAccountId: 'acc_buyer_wallet',
          sellerAccountId: 'acc_seller_pending',
          platformRevenueAccountId: 'acc_platform_rev',
          refundGrossMinor: 5000,
          sellerRefundDebitMinor: 4000, // Missing 1000!
          platformCommissionRefundDebitMinor: 0,
          currency: 'USD',
          idempotencyKey: 'idemp_bad_refund',
          reason: 'Mismatch test',
        })
      ).toThrow('Ledger integrity violation: Total debits (4000) must equal refund gross (5000)');
    });
  });

  // =========================================================================
  // 3. Social Commerce Escrow & Store Policy Compliance
  // =========================================================================
  describe('3. Social Commerce Escrow State Transitions & Store Policy', () => {
    it('permits valid legal escrow state transitions', () => {
      expect(canTransitionEscrow('held', 'releasing')).toBe(true);
      expect(canTransitionEscrow('releasing', 'released')).toBe(true);
      expect(canTransitionEscrow('held', 'disputed')).toBe(true);
      expect(canTransitionEscrow('disputed', 'refunded')).toBe(true);
      expect(canTransitionEscrow('held', 'refunded')).toBe(true);
    });

    it('strictly forbids illegal or backwards escrow transitions once settled', () => {
      expect(canTransitionEscrow('released', 'held')).toBe(false);
      expect(canTransitionEscrow('released', 'releasing')).toBe(false);
      expect(canTransitionEscrow('refunded', 'held')).toBe(false);
      expect(canTransitionEscrow('refunded', 'released')).toBe(false);
      expect(canTransitionEscrow('held', 'held')).toBe(false);
    });

    it('enforces store policy separation: digital subscriptions on mobile route via Apple/Google IAP', () => {
      const policy = new PaymentPolicyEngine();

      const iosDecision = policy.decide({
        countryIso: 'US',
        platform: 'ios',
        productType: 'digital_subscription',
        amountMinor: 999,
      });

      expect(iosDecision.compliant).toBe(true);
      expect(iosDecision.permittedProviders).toContain('apple_pay');
      expect(iosDecision.permittedProviders).not.toContain('stripe');

      const androidDecision = policy.decide({
        countryIso: 'US',
        platform: 'android',
        productType: 'digital_subscription',
        amountMinor: 999,
      });

      expect(androidDecision.compliant).toBe(true);
      expect(androidDecision.permittedProviders).toContain('google_pay');
      expect(androidDecision.permittedProviders).not.toContain('paypal');
    });

    it('allows multimodal rails on web for marketplace physical goods', () => {
      const policy = new PaymentPolicyEngine();

      const webDecision = policy.decide({
        countryIso: 'US',
        platform: 'web',
        productType: 'physical_goods',
        amountMinor: 4999,
      });

      expect(webDecision.compliant).toBe(true);
      expect(webDecision.permittedProviders).toContain('stripe');
      expect(webDecision.permittedProviders).toContain('paypal');
    });
  });

  // =========================================================================
  // 4. Financial Reconciliation Engine with Multi-Currency & Refunds
  // =========================================================================
  describe('4. Financial Reconciliation Engine Multi-Currency Integrity', () => {
    const reconEngine = new FinancialReconciliationEngine();

    it('successfully reconciles multi-currency transaction sets with completed refunds', () => {
      const ledgerMap = new Map([
        ['tx_jmd_01', { grossMinor: 100000, feeMinor: 10000, sellerNetMinor: 90000, currency: 'JMD' }],
        ['tx_usd_02', { grossMinor: 5000, feeMinor: 500, sellerNetMinor: 4500, currency: 'USD' }],
      ]);

      const gatewayRecords = [
        { providerId: 'paypal', providerTransactionId: 'tx_jmd_01', amountMinor: 100000, currency: 'JMD', status: 'settled' as const },
        { providerId: 'stripe', providerTransactionId: 'tx_usd_02', amountMinor: 5000, currency: 'USD', status: 'settled' as const },
      ];

      const sellerRecords = [
        { sellerId: 'sel_jm', transactionId: 'tx_jmd_01', netCreditedMinor: 90000, currency: 'JMD' },
        { sellerId: 'sel_us', transactionId: 'tx_usd_02', netCreditedMinor: 4500, currency: 'USD' },
      ];

      const refundRecords = [
        { refundId: 'ref_01', originalTransactionId: 'tx_usd_02', amountRefundedMinor: 2000, currency: 'USD', status: 'completed' as const },
      ];

      const report = reconEngine.reconcile(ledgerMap, gatewayRecords, sellerRecords, refundRecords);

      expect(report.totalTransactionsEvaluated).toBe(2);
      expect(report.discrepancyCount).toBe(0);
      expect(report.status).toBe('RECONCILED');
    });

    it('detects discrepancy when gateway capture differs from ledger gross', () => {
      const ledgerMap = new Map([
        ['tx_disc_01', { grossMinor: 10000, feeMinor: 1000, sellerNetMinor: 9000, currency: 'USD' }],
      ]);

      const gatewayRecords = [
        { providerId: 'stripe', providerTransactionId: 'tx_disc_01', amountMinor: 8000, currency: 'USD', status: 'settled' as const }, // Mismatch: 8000 != 10000
      ];

      const sellerRecords = [
        { sellerId: 'sel_disc', transactionId: 'tx_disc_01', netCreditedMinor: 9000, currency: 'USD' },
      ];

      const report = reconEngine.reconcile(ledgerMap, gatewayRecords, sellerRecords);

      expect(report.discrepancyCount).toBe(1);
      expect(report.status).toBe('DISCREPANCY_DETECTED');
      expect(report.items[0].varianceMinor).toBe(2000);
    });
  });
});
