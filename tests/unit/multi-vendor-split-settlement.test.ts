import { describe, it, expect } from 'vitest';
import {
  computeOrderTotals,
  groupCartBySeller,
  computeMultiSellerOrderTotals,
  estimateCaribbeanCustomsDuties,
  calculateAffiliateCommission,
  type CartLine,
} from '../../packages/marketplace/src/index';

interface DoubleEntryPosting {
  account: string;
  entryType: 'debit' | 'credit';
  amountMinor: number;
}

function computeMultiVendorSplitSettlement(params: {
  cartLines: CartLine[];
  originCountryIso: string;
  destinationCountryIso: string;
  prepayDuties: boolean;
  commissionBps?: number;
  creatorReferralBps?: number;
}) {
  const commissionBps = params.commissionBps ?? 500; // 5% standard commission
  const multiTotals = computeMultiSellerOrderTotals(params.cartLines, { commissionBps });
  const sellerBreakdown = multiTotals.sellerBreakdown;

  let aggregateSubtotalMinor = multiTotals.grandTotal.subtotalMinor;
  let aggregatePlatformFeeMinor = multiTotals.grandTotal.platformFeeMinor;
  let aggregateTotalMinor = multiTotals.grandTotal.totalMinor;

  const subOrders: Array<{
    sellerId: string;
    subtotalMinor: number;
    platformFeeMinor: number;
    sellerNetMinor: number;
    totalMinor: number;
  }> = [];

  for (const [sellerId, entry] of Object.entries(sellerBreakdown)) {
    const totals = entry.totals;
    const sellerNetMinor = totals.subtotalMinor - totals.platformFeeMinor;
    subOrders.push({
      sellerId,
      subtotalMinor: totals.subtotalMinor,
      platformFeeMinor: totals.platformFeeMinor,
      sellerNetMinor,
      totalMinor: totals.totalMinor,
    });
  }

  // Cross-border duties calculation
  let dutiesTotalMinor = 0;
  let customsEstimate = null;
  if (params.prepayDuties) {
    customsEstimate = estimateCaribbeanCustomsDuties({
      itemValueMinor: aggregateSubtotalMinor,
      originCountryIso: params.originCountryIso,
      destinationCountryIso: params.destinationCountryIso,
      prepayDuties: true,
    });
    dutiesTotalMinor = customsEstimate.totalEstimatedDutiesMinor;
  }

  const grandTotalPaidByBuyerMinor = aggregateTotalMinor + dutiesTotalMinor;

  // Affiliate commission calculation
  let affiliateCommissionMinor = 0;
  if (params.creatorReferralBps && params.creatorReferralBps > 0) {
    affiliateCommissionMinor = calculateAffiliateCommission(
      aggregateSubtotalMinor,
      params.creatorReferralBps
    );
  }

  // Generate double-entry ledger postings to verify zero-sum invariant
  const ledgerPostings: DoubleEntryPosting[] = [];

  // 1. Buyer Cash Inflow
  ledgerPostings.push({
    account: 'clearing:customer_inflow',
    entryType: 'debit',
    amountMinor: grandTotalPaidByBuyerMinor,
  });
  ledgerPostings.push({
    account: 'liability:customer_funds_held',
    entryType: 'credit',
    amountMinor: grandTotalPaidByBuyerMinor,
  });

  // 2. Customs Escrow Allocation (if prepaid)
  if (dutiesTotalMinor > 0) {
    ledgerPostings.push({
      account: 'liability:customer_funds_held',
      entryType: 'debit',
      amountMinor: dutiesTotalMinor,
    });
    ledgerPostings.push({
      account: 'escrow:customs_tariffs',
      entryType: 'credit',
      amountMinor: dutiesTotalMinor,
    });
  }

  // 3. Merchant Sub-Order Escrow Allocation
  for (const sub of subOrders) {
    // Release from customer held funds into merchant settlement escrow
    ledgerPostings.push({
      account: 'liability:customer_funds_held',
      entryType: 'debit',
      amountMinor: sub.totalMinor,
    });

    // Seller gross earnings to merchant payable escrow
    ledgerPostings.push({
      account: `escrow:merchant_payable:${sub.sellerId}`,
      entryType: 'credit',
      amountMinor: sub.subtotalMinor,
    });

    // Platform fee revenue
    ledgerPostings.push({
      account: 'revenue:platform_marketplace_fee',
      entryType: 'credit',
      amountMinor: sub.platformFeeMinor,
    });
  }

  // 4. Affiliate Referral Allocation (funded from platform fee)
  if (affiliateCommissionMinor > 0) {
    ledgerPostings.push({
      account: 'revenue:platform_marketplace_fee',
      entryType: 'debit',
      amountMinor: affiliateCommissionMinor,
    });
    ledgerPostings.push({
      account: 'payable:creator_affiliate_commission',
      entryType: 'credit',
      amountMinor: affiliateCommissionMinor,
    });
  }

  const totalDebits = ledgerPostings
    .filter((p) => p.entryType === 'debit')
    .reduce((sum, p) => sum + p.amountMinor, 0);

  const totalCredits = ledgerPostings
    .filter((p) => p.entryType === 'credit')
    .reduce((sum, p) => sum + p.amountMinor, 0);

  return {
    parentOrder: {
      subtotalMinor: aggregateSubtotalMinor,
      platformFeeMinor: aggregatePlatformFeeMinor,
      dutiesTotalMinor,
      grandTotalPaidByBuyerMinor,
    },
    subOrders,
    affiliateCommissionMinor,
    ledgerPostings,
    totalDebits,
    totalCredits,
    isZeroSumBalanced: totalDebits === totalCredits,
  };
}

describe('Multi-Vendor Split-Checkout & Double-Entry Ledger Safety (Phase 16)', () => {
  it('groups items by seller and computes exact parent & sub-order totals', () => {
    const cart: CartLine[] = [
      {
        productId: 'p-101',
        sellerId: 'merchant-kingston',
        unitPriceMinor: 5000, // $50
        quantity: 2,           // $100
        productKind: 'physical',
      },
      {
        productId: 'p-102',
        sellerId: 'merchant-kingston',
        unitPriceMinor: 2500, // $25
        quantity: 1,           // $25
        productKind: 'physical',
      },
      {
        productId: 'p-201',
        sellerId: 'merchant-bridgetown',
        unitPriceMinor: 8000, // $80
        quantity: 1,           // $80
        productKind: 'physical',
      },
    ];

    const result = computeMultiVendorSplitSettlement({
      cartLines: cart,
      originCountryIso: 'JAM',
      destinationCountryIso: 'JAM',
      prepayDuties: false,
    });

    expect(result.subOrders).toHaveLength(2);

    const kingstonOrder = result.subOrders.find((s) => s.sellerId === 'merchant-kingston')!;
    const bridgetownOrder = result.subOrders.find((s) => s.sellerId === 'merchant-bridgetown')!;

    // Kingston: $100 + $25 = $125 (12500 minor)
    expect(kingstonOrder.subtotalMinor).toBe(12500);
    expect(kingstonOrder.platformFeeMinor).toBe(625); // 5% fee = $6.25
    expect(kingstonOrder.totalMinor).toBe(13125); // $131.25

    // Bridgetown: $80 (8000 minor)
    expect(bridgetownOrder.subtotalMinor).toBe(8000);
    expect(bridgetownOrder.platformFeeMinor).toBe(400); // 5% fee = $4.00
    expect(bridgetownOrder.totalMinor).toBe(8400); // $84.00

    // Parent Order Aggregate: Subtotal $205 + Fee $10.25 = $215.25 (21525 minor)
    expect(result.parentOrder.subtotalMinor).toBe(20500);
    expect(result.parentOrder.platformFeeMinor).toBe(1025);
    expect(result.parentOrder.grandTotalPaidByBuyerMinor).toBe(21525);
    expect(result.isZeroSumBalanced).toBe(true);
  });

  it('guarantees double-entry ledger zero-sum balance invariant across multi-vendor checkout', () => {
    const cart: CartLine[] = [
      {
        productId: 'p-1',
        sellerId: 'seller-a',
        unitPriceMinor: 15000,
        quantity: 1,
        productKind: 'physical',
      },
      {
        productId: 'p-2',
        sellerId: 'seller-b',
        unitPriceMinor: 9500,
        quantity: 2,
        productKind: 'physical',
      },
      {
        productId: 'p-3',
        sellerId: 'seller-c',
        unitPriceMinor: 4500,
        quantity: 1,
        productKind: 'digital',
      },
    ];

    const result = computeMultiVendorSplitSettlement({
      cartLines: cart,
      originCountryIso: 'JAM',
      destinationCountryIso: 'JAM',
      prepayDuties: false,
    });

    expect(result.isZeroSumBalanced).toBe(true);
    expect(result.totalDebits).toBe(result.totalCredits);
    expect(result.totalDebits).toBeGreaterThan(0);
  });

  it('preserves double-entry balance when Delivered Duty Paid (DDP) is added to cross-border order', () => {
    const cart: CartLine[] = [
      {
        productId: 'p-us-1',
        sellerId: 'seller-miami-diaspora',
        unitPriceMinor: 12000, // $120
        quantity: 1,
        productKind: 'physical',
      },
    ];

    const result = computeMultiVendorSplitSettlement({
      cartLines: cart,
      originCountryIso: 'USA',
      destinationCountryIso: 'JAM',
      prepayDuties: true,
    });

    expect(result.parentOrder.dutiesTotalMinor).toBeGreaterThan(0);
    expect(result.parentOrder.grandTotalPaidByBuyerMinor).toBe(
      result.parentOrder.subtotalMinor +
        result.parentOrder.platformFeeMinor +
        result.parentOrder.dutiesTotalMinor
    );
    expect(result.isZeroSumBalanced).toBe(true);
    expect(result.totalDebits).toBe(result.totalCredits);
  });

  it('correctly allocates creator affiliate commission without breaking zero-sum ledger balance', () => {
    const cart: CartLineItem[] = [
      {
        productId: 'p-creator-1',
        sellerId: 'seller-artisan',
        unitPriceMinor: 20000, // $200
        quantity: 1,
        productKind: 'physical',
      },
    ];

    const result = computeMultiVendorSplitSettlement({
      cartLines: cart,
      originCountryIso: 'TTO',
      destinationCountryIso: 'TTO',
      prepayDuties: false,
      creatorReferralBps: 500, // 5% creator commission
    });

    // Subtotal = $200 (20000 minor)
    // Affiliate commission = 5% of 20000 = 1000 minor ($10)
    expect(result.affiliateCommissionMinor).toBe(1000);
    expect(result.isZeroSumBalanced).toBe(true);
    expect(result.totalDebits).toBe(result.totalCredits);
  });
});
