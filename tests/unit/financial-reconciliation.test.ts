import { describe, it, expect } from 'vitest';
import {
  FinancialReconciliationEngine,
  type ProviderCaptureRecord,
  type SellerRecord,
  type RefundRecord,
} from '../../packages/payments/src/reconciliation';

describe('TUKUBI Financial Reconciliation Engine', () => {
  const engine = new FinancialReconciliationEngine();

  it('reconciles perfectly when ledger, gateway capture, and seller credits align', () => {
    const ledgerMap = new Map([
      [
        'tx_order_1001',
        {
          grossMinor: 10000, // $100.00
          feeMinor: 1000,    // $10.00 platform fee (10%)
          sellerNetMinor: 9000, // $90.00
          currency: 'USD',
        },
      ],
      [
        'tx_order_1002',
        {
          grossMinor: 5000, // $50.00
          feeMinor: 500,    // $5.00 platform fee (10%)
          sellerNetMinor: 4500, // $45.00
          currency: 'USD',
        },
      ],
    ]);

    const gatewayRecords: ProviderCaptureRecord[] = [
      {
        providerId: 'stripe',
        providerTransactionId: 'tx_order_1001',
        amountMinor: 10000,
        currency: 'USD',
        status: 'captured',
      },
      {
        providerId: 'paypal',
        providerTransactionId: 'tx_order_1002',
        amountMinor: 5000,
        currency: 'USD',
        status: 'captured',
      },
    ];

    const sellerRecords: SellerRecord[] = [
      {
        sellerId: 'seller_carib_1',
        transactionId: 'tx_order_1001',
        netCreditedMinor: 9000,
        currency: 'USD',
      },
      {
        sellerId: 'seller_carib_2',
        transactionId: 'tx_order_1002',
        netCreditedMinor: 4500,
        currency: 'USD',
      },
    ];

    const report = engine.reconcile(ledgerMap, gatewayRecords, sellerRecords);

    expect(report.status).toBe('RECONCILED');
    expect(report.totalTransactionsEvaluated).toBe(2);
    expect(report.matchedCount).toBe(2);
    expect(report.discrepancyCount).toBe(0);
    expect(report.totalGmvMinor).toBe(15000);
    expect(report.totalTukubiRevenueMinor).toBe(1500);
    expect(report.totalDiscrepancyVarianceMinor).toBe(0);
    expect(report.items.every((i) => i.isMatched)).toBe(true);
  });

  it('detects and flags gateway amount discrepancy', () => {
    const ledgerMap = new Map([
      [
        'tx_discrepancy_01',
        {
          grossMinor: 10000,
          feeMinor: 1000,
          sellerNetMinor: 9000,
          currency: 'USD',
        },
      ],
    ]);

    // Gateway captured $95.00 instead of $100.00
    const gatewayRecords: ProviderCaptureRecord[] = [
      {
        providerId: 'stripe',
        providerTransactionId: 'tx_discrepancy_01',
        amountMinor: 9500,
        currency: 'USD',
        status: 'captured',
      },
    ];

    const sellerRecords: SellerRecord[] = [
      {
        sellerId: 'seller_1',
        transactionId: 'tx_discrepancy_01',
        netCreditedMinor: 9000,
        currency: 'USD',
      },
    ];

    const report = engine.reconcile(ledgerMap, gatewayRecords, sellerRecords);

    expect(report.status).toBe('DISCREPANCY_DETECTED');
    expect(report.matchedCount).toBe(0);
    expect(report.discrepancyCount).toBe(1);
    expect(report.totalDiscrepancyVarianceMinor).toBe(500); // $5.00 variance
    expect(report.items[0]?.isMatched).toBe(false);
    expect(report.items[0]?.flag).toContain('Gateway mismatch: expected 10000, got 9500');
  });

  it('flags missing gateway records', () => {
    const ledgerMap = new Map([
      [
        'tx_unsettled_orphan',
        {
          grossMinor: 2500,
          feeMinor: 250,
          sellerNetMinor: 2250,
          currency: 'USD',
        },
      ],
    ]);

    const report = engine.reconcile(ledgerMap, [], []);

    expect(report.status).toBe('DISCREPANCY_DETECTED');
    expect(report.discrepancyCount).toBe(1);
    expect(report.items[0]?.flag).toContain('Missing gateway capture record');
  });

  it('correctly accounts for completed refunds', () => {
    const ledgerMap = new Map([
      [
        'tx_refunded_order',
        {
          grossMinor: 10000,
          feeMinor: 1000,
          sellerNetMinor: 9000,
          currency: 'USD',
        },
      ],
    ]);

    const gatewayRecords: ProviderCaptureRecord[] = [
      {
        providerId: 'stripe',
        providerTransactionId: 'tx_refunded_order',
        amountMinor: 10000,
        currency: 'USD',
        status: 'refunded',
      },
    ];

    // Full refund of $100.00: effective seller expected = 9000 - 9000 = 0
    const refundRecords: RefundRecord[] = [
      {
        refundId: 'ref_01',
        originalTransactionId: 'tx_refunded_order',
        amountRefundedMinor: 10000,
        currency: 'USD',
        status: 'completed',
      },
    ];

    const sellerRecords: SellerRecord[] = [
      {
        sellerId: 'seller_1',
        transactionId: 'tx_refunded_order',
        netCreditedMinor: 0,
        currency: 'USD',
      },
    ];

    const report = engine.reconcile(ledgerMap, gatewayRecords, sellerRecords, refundRecords);

    expect(report.status).toBe('RECONCILED');
    expect(report.matchedCount).toBe(1);
    expect(report.discrepancyCount).toBe(0);
  });
});
