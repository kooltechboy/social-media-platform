// TUKUBI Universal Financial Reconciliation Engine
// Reconciles platform ledger, payment gateway provider records (PayPal/Stripe), seller credits, and refunds.

export interface LedgerSummaryRecord {
  transactionId: string;
  totalDebitsMinor: number;
  totalCreditsMinor: number;
  netZeroVerified: boolean;
  currency: string;
}

export interface ProviderCaptureRecord {
  providerId: string;
  providerTransactionId: string;
  amountMinor: number;
  currency: string;
  status: 'captured' | 'settled' | 'refunded' | 'disputed';
}

export interface SellerRecord {
  sellerId: string;
  transactionId: string;
  netCreditedMinor: number;
  currency: string;
}

export interface RefundRecord {
  refundId: string;
  originalTransactionId: string;
  amountRefundedMinor: number;
  currency: string;
  status: 'completed' | 'pending';
}

export interface SubscriptionRecord {
  subscriptionId: string;
  subscriberId: string;
  amountMinor: number;
  currency: string;
  status: 'active' | 'canceled' | 'past_due';
}

export interface ReconciliationItemResult {
  transactionId: string;
  isMatched: boolean;
  ledgerAmountMinor: number;
  gatewayAmountMinor: number;
  sellerAmountMinor: number;
  platformFeeMinor: number;
  varianceMinor: number;
  flag?: string;
}

export interface FinancialReconciliationReport {
  reconciledAt: string;
  totalTransactionsEvaluated: number;
  matchedCount: number;
  discrepancyCount: number;
  totalGmvMinor: number;
  totalTukubiRevenueMinor: number;
  totalDiscrepancyVarianceMinor: number;
  items: ReconciliationItemResult[];
  status: 'RECONCILED' | 'DISCREPANCY_DETECTED';
}

export class FinancialReconciliationEngine {
  /**
   * Evaluates and cross-checks platform ledger entries against gateway capture records and seller credits.
   */
  public reconcile(
    ledgerMap: Map<string, { grossMinor: number; feeMinor: number; sellerNetMinor: number; currency: string }>,
    gatewayRecords: ProviderCaptureRecord[],
    sellerRecords: SellerRecord[],
    refundRecords: RefundRecord[] = []
  ): FinancialReconciliationReport {
    const gatewayMap = new Map<string, ProviderCaptureRecord>();
    for (const gw of gatewayRecords) {
      gatewayMap.set(gw.providerTransactionId, gw);
    }

    const sellerMap = new Map<string, number>();
    for (const sel of sellerRecords) {
      sellerMap.set(sel.transactionId, (sellerMap.get(sel.transactionId) ?? 0) + sel.netCreditedMinor);
    }

    const refundMap = new Map<string, number>();
    for (const ref of refundRecords) {
      if (ref.status === 'completed') {
        refundMap.set(ref.originalTransactionId, (refundMap.get(ref.originalTransactionId) ?? 0) + ref.amountRefundedMinor);
      }
    }

    const items: ReconciliationItemResult[] = [];
    let matchedCount = 0;
    let discrepancyCount = 0;
    let totalGmvMinor = 0;
    let totalTukubiRevenueMinor = 0;
    let totalVarianceMinor = 0;

    for (const [txId, ledger] of ledgerMap.entries()) {
      totalGmvMinor += ledger.grossMinor;
      totalTukubiRevenueMinor += ledger.feeMinor;

      const gw = gatewayMap.get(txId);
      const sellerCredited = sellerMap.get(txId) ?? 0;
      const refunded = refundMap.get(txId) ?? 0;

      const expectedGross = ledger.grossMinor;
      const actualGatewayGross = gw ? gw.amountMinor : 0;
      const expectedSellerNet = ledger.sellerNetMinor;

      let isMatched = true;
      const flags: string[] = [];

      // Check 1: Gateway amount matches ledger gross
      if (gw && gw.amountMinor !== expectedGross) {
        isMatched = false;
        flags.push(`Gateway mismatch: expected ${expectedGross}, got ${gw.amountMinor}`);
      } else if (!gw) {
        isMatched = false;
        flags.push('Missing gateway capture record');
      }

      // Check 2: Seller net credited matches ledger seller net (accounting for refunds)
      const effectiveSellerExpected = expectedSellerNet - (refunded > 0 ? Math.round(refunded * (expectedSellerNet / expectedGross)) : 0);
      if (sellerCredited !== effectiveSellerExpected && sellerCredited !== expectedSellerNet) {
        isMatched = false;
        flags.push(`Seller credit mismatch: expected ${effectiveSellerExpected}, recorded ${sellerCredited}`);
      }

      const variance = Math.abs(expectedGross - actualGatewayGross);
      if (variance > 0) {
        totalVarianceMinor += variance;
      }

      if (isMatched) {
        matchedCount++;
      } else {
        discrepancyCount++;
      }

      items.push({
        transactionId: txId,
        isMatched,
        ledgerAmountMinor: expectedGross,
        gatewayAmountMinor: actualGatewayGross,
        sellerAmountMinor: sellerCredited,
        platformFeeMinor: ledger.feeMinor,
        varianceMinor: variance,
        flag: flags.length > 0 ? flags.join('; ') : undefined,
      });
    }

    return {
      reconciledAt: new Date().toISOString(),
      totalTransactionsEvaluated: ledgerMap.size,
      matchedCount,
      discrepancyCount,
      totalGmvMinor,
      totalTukubiRevenueMinor,
      totalDiscrepancyVarianceMinor: totalVarianceMinor,
      items,
      status: discrepancyCount === 0 ? 'RECONCILED' : 'DISCREPANCY_DETECTED',
    };
  }
}
