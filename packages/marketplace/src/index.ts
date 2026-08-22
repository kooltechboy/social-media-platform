export interface CartLine {
  productId: string;
  sellerId: string;
  unitPriceMinor: number;
  quantity: number;
  productKind: 'physical' | 'digital' | 'service';
}

export const MARKETPLACE_COMMISSION_BPS = 800;
export const DISPUTE_WINDOW_DAYS = 30;
export const MAX_QUANTITY_PER_LINE = 20;

export interface OrderTotals {
  subtotalMinor: number;
  platformFeeMinor: number;
  totalMinor: number;
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

export function computeOrderTotals(lines: CartLine[]): OrderTotals {
  const subtotalMinor = lines.reduce((sum, line) => sum + computeLineTotal(line), 0);
  const platformFeeMinor = Math.round((subtotalMinor * MARKETPLACE_COMMISSION_BPS) / 10000);
  return {
    subtotalMinor,
    platformFeeMinor,
    totalMinor: subtotalMinor + platformFeeMinor,
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
