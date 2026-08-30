import { describe, it, expect } from 'vitest';
import {
  FinancialReconciliationEngine,
  type ProviderCaptureRecord,
  type SellerRecord,
  type RefundRecord,
} from '../../packages/payments/src/reconciliation';

describe('TUKUBI Financial Reconciliation Engine', () => {
  const engine = new FinancialReconciliationEngine();

  it('reconciles cleanly when ledger gross, gateway capture, and seller credits align', () => {
    const ledgerMap = new Map([
      [
        'order_101',
        {
          grossMinor: 10000, // $100.00
          feeMinor: 830, // $8.30
          sellerNetMinor: 8850, // $88.50
          currency: 'USD',
        },
      ],
      [
        'order_102',
        {
          grossMinor: 5000, // $50.00
          feeMinor: 0,
          sellerNetMinor: 4825, // $48.25
          currency: 'USD',
        },
      ],
    ]);

    const gatewayRecords: ProviderCaptureRecord[] = [
      {
        providerId: 'paypal',
        providerTransactionId: 'order_101',
        amountMinor: 10000,
        currency: 'USD',
        status: 'captured',
      },
      {
        providerId: 'stripe',
        providerTransactionId: 'order_102',
        amountMinor: 5000,
        currency: 'USD',
        status: 'captured',
      },
    ];

    const sellerRecords: SellerRecord[] = [
      {
        sellerId: 'seller_a',
        transactionId: 'order_101',
        netCreditedMinor: 8850,
        currency: 'USD',
      },
      {
        sellerId: 'seller_b',
        transactionId: 'order_102',
        netCreditedMinor: 4825,
        currency: 'USD',
      },
    ];

    const report = engine.reconcile(ledgerMap, gatewayRecords, sellerRecords);

    expect(report.status).toBe('RECONCILED');
    expect(report.matchedCount).toBe(2);
    expect(report.discrepancyCount).toBe(0);
    expect(report.totalGmvMinor).toBe(15000); // $150.00 GMV
    expect(report.totalTukubiRevenueMinor).toBe(830); // $8.30 TUKUBI Retained Revenue
    expect(report.totalDiscrepancyVarianceMinor).toBe(0);
  });

  it('detects and flags gateway discrepancy when capture amount differs from ledger', () => {
    const ledgerMap = new Map([
      [
        'order_201',
        {
          grossMinor: 10000, // $100.00
          feeMinor: 800,
          sellerNetMinor: 8900,
          currency: 'USD',
        },
      ],
    ]);

    const gatewayRecords: ProviderCaptureRecord[] = [
      {
        providerId: 'paypal',
        providerTransactionId: 'order_201',
        amountMinor: 9500, // Under-captured by $5.00
        currency: 'USD',
        status: 'captured',
      },
    ];

    const sellerRecords: SellerRecord[] = [
      {
        sellerId: 'seller_a',
        transactionId: 'order_201',
        netCreditedMinor: 8900,
        currency: 'USD',
      },
    ];

    const report = engine.reconcile(ledgerMap, gatewayRecords, sellerRecords);

    expect(report.status).toBe('DISCREPANCY_DETECTED');
    expect(report.discrepancyCount).toBe(1);
    expect(report.items[0].isMatched).toBe(false);
    expect(report.items[0].flag).toContain('Gateway mismatch');
    expect(report.totalDiscrepancyVarianceMinor).toBe(500);
  });

  it('detects missing gateway record for an order', () => {
    const ledgerMap = new Map([
      [
        'order_301',
        {
          grossMinor: 5000,
          feeMinor: 250,
          sellerNetMinor: 4600,
          currency: 'USD',
        },
      ],
    ]);

    const report = engine.reconcile(ledgerMap, [], []);
    expect(report.status).toBe('DISCREPANCY_DETECTED');
    expect(report.items[0].flag).toContain('Missing gateway capture record');
  });
});
