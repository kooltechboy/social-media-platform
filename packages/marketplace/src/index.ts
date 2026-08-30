export interface CartLine {
  productId: string;
  sellerId: string;
  unitPriceMinor: number;
  quantity: number;
  productKind: 'physical' | 'digital' | 'service';
}

export const MARKETPLACE_COMMISSION_BPS = 0; // 0 bps on Seller Pro / Business subscription plans
export const DISPUTE_WINDOW_DAYS = 30;
export const MAX_QUANTITY_PER_LINE = 20;

export interface OrderTotals {
  subtotalMinor: number;
  platformFeeMinor: number;
  processingFeeMinor?: number;
  taxMinor?: number;
  totalMinor: number;
}

export interface ComputeOrderTotalsOptions {
  commissionBps?: number;
  fixedFeeMinor?: number;
  processingFeeBps?: number;
  processingFixedMinor?: number;
  taxBps?: number;
}

export function computeLineTotal(line: CartLine): number {
  if (!Number.isInteger(line.unitPriceMinor) || line.unitPriceMinor <= 0) {
    throw new Error('Unit price must be positive integer minor units');
  }
  if (line.quantity < 1 || line.quantity > MAX_QUANTITY_PER_LINE) {
    throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY_PER_LINE}`);
  }
  return line.unitPriceMinor * line.quantity;
}

export function computeOrderTotals(
  lines: CartLine[],
  optionsOrCommissionBps: number | ComputeOrderTotalsOptions = MARKETPLACE_COMMISSION_BPS
): OrderTotals {
  const options: ComputeOrderTotalsOptions =
    typeof optionsOrCommissionBps === 'number'
      ? { commissionBps: optionsOrCommissionBps }
      : optionsOrCommissionBps;

  const commissionBps = options.commissionBps ?? MARKETPLACE_COMMISSION_BPS;
  const fixedFeeMinor = options.fixedFeeMinor ?? 0;
  const processingFeeBps = options.processingFeeBps ?? 0;
  const processingFixedMinor = options.processingFixedMinor ?? 0;
  const taxBps = options.taxBps ?? 0;

  const subtotalMinor = lines.reduce((sum, line) => sum + computeLineTotal(line), 0);
  const platformFeeMinor = Math.round((subtotalMinor * commissionBps) / 10000) + fixedFeeMinor;
  const processingFeeMinor =
    processingFeeBps > 0 || processingFixedMinor > 0
      ? Math.round((subtotalMinor * processingFeeBps) / 10000) + processingFixedMinor
      : 0;
  const taxMinor = taxBps > 0 ? Math.round((subtotalMinor * taxBps) / 10000) : 0;

  return {
    subtotalMinor,
    platformFeeMinor,
    processingFeeMinor,
    taxMinor,
    totalMinor: subtotalMinor + platformFeeMinor + processingFeeMinor + taxMinor,
  };
}

export function validateCart(lines: CartLine[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (lines.length === 0) errors.push('Cart is empty');
  for (const line of lines) {
    try {
      computeLineTotal(line);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid cart line');
    }
  }
  return { valid: errors.length === 0, errors };
}

export type DisputeState = 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'rejected';

export interface DisputeWindowContext {
  deliveredAt: string;
  now?: Date;
}

export function disputeWindowOpen(context: DisputeWindowContext): boolean {
  const now = context.now ?? new Date();
  const delivered = new Date(context.deliveredAt);
  const deadline = new Date(delivered.getTime() + DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return now >= delivered && now <= deadline;
}

export type FulfillmentState = 'pending_payment' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';

export const FULFILLMENT_TRANSITIONS: Record<FulfillmentState, FulfillmentState[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['fulfilled', 'refunded'],
  fulfilled: ['refunded'],
  cancelled: [],
  refunded: [],
};

export function transitionOrder(from: FulfillmentState, to: FulfillmentState): FulfillmentState {
  if (!FULFILLMENT_TRANSITIONS[from].includes(to)) {
    throw new Error(`Invalid order transition: ${from} → ${to}`);
  }
  return to;
}

export function digitalGoodsRequireMobileStoreRouting(lines: CartLine[], platform: 'web' | 'ios' | 'android'): boolean {
  const hasDigital = lines.some((line) => line.productKind === 'digital');
  return hasDigital && platform !== 'web';
}
