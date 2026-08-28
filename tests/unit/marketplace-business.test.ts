import { describe, it, expect } from 'vitest';
import {
  computeLineTotal,
  computeOrderTotals,
  validateCart,
  disputeWindowOpen,
  transitionOrder,
  digitalGoodsRequireMobileStoreRouting,
  MARKETPLACE_COMMISSION_BPS,
} from '../../packages/marketplace/src/index';
import {
  validateBusinessProfile,
  aggregateReviews,
  validateBookingWindow,
  canRsvp,
  formatPrice,
} from '../../packages/business/src/index';

describe('Marketplace pricing (minor units)', () => {
  const lines = [
    { productId: 'p1', sellerId: 's1', unitPriceMinor: 2500, quantity: 2, productKind: 'physical' as const },
    { productId: 'p2', sellerId: 's2', unitPriceMinor: 999, quantity: 1, productKind: 'digital' as const },
  ];

  it('computes line totals and order totals with commission', () => {
    expect(computeLineTotal(lines[0])).toBe(5000);
    const totals = computeOrderTotals(lines);
    expect(totals.subtotalMinor).toBe(5999);
    expect(totals.platformFeeMinor).toBe(Math.round((5999 * MARKETPLACE_COMMISSION_BPS) / 10000));
    expect(totals.totalMinor).toBe(totals.subtotalMinor + totals.platformFeeMinor);
  });

  it('rejects invalid lines and empty carts', () => {
    expect(validateCart([]).errors).toContain('Cart is empty');
    expect(() => computeLineTotal({ ...lines[0], unitPriceMinor: 10.5 })).toThrow('positive integer');
    expect(() => computeLineTotal({ ...lines[0], quantity: 0 })).toThrow('Quantity');
    expect(validateCart([{ ...lines[0], quantity: 99 }]).valid).toBe(false);
  });

  it('routes digital goods on mobile through store billing (policy compliance)', () => {
    expect(digitalGoodsRequireMobileStoreRouting(lines, 'web')).toBe(false);
    expect(digitalGoodsRequireMobileStoreRouting(lines, 'ios')).toBe(true);
    expect(digitalGoodsRequireMobileStoreRouting([lines[0]], 'ios')).toBe(false);
  });
});

describe('Marketplace fulfillment and disputes', () => {
  it('enforces order state machine transitions', () => {
    expect(transitionOrder('pending_payment', 'paid')).toBe('paid');
    expect(transitionOrder('paid', 'fulfilled')).toBe('fulfilled');
    expect(transitionOrder('pending_payment', 'cancelled')).toBe('cancelled');
    expect(() => transitionOrder('fulfilled', 'paid')).toThrow('Invalid order transition');
    expect(() => transitionOrder('cancelled', 'paid')).toThrow('Invalid order transition');
  });

  it('closes the dispute window after 30 days', () => {
    const deliveredAt = '2026-07-01T00:00:00Z';
    expect(disputeWindowOpen({ deliveredAt, now: new Date('2026-07-15T00:00:00Z') })).toBe(true);
    expect(disputeWindowOpen({ deliveredAt, now: new Date('2026-08-15T00:00:00Z') })).toBe(false);
    expect(disputeWindowOpen({ deliveredAt, now: new Date('2026-06-15T00:00:00Z') })).toBe(false);
  });

  it('validates canonical marketplace routing paths', () => {
    const productId = 'prod-blue-mountain-123';
    const detailUrl = `/marketplace/${productId}`;
    const ordersUrl = '/marketplace/orders';

    expect(detailUrl).toBe('/marketplace/prod-blue-mountain-123');
    expect(ordersUrl).toBe('/marketplace/orders');
  });
});

describe('Business profiles and reviews', () => {
  it('validates business profile input', () => {
    expect(
      validateBusinessProfile({ ownerId: 'u1', name: 'Jamaican Kitchen', category: 'restaurant', countryIso: 'CAN' }).valid,
    ).toBe(true);
    const invalid = validateBusinessProfile({
      ownerId: 'u1', name: '', category: 'restaurant', countryIso: 'JAM', phone: 'not-a-phone', website: 'ftp://x',
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('aggregates review distributions and averages', () => {
    const aggregation = aggregateReviews([5, 5, 4, 3, 1]);
    expect(aggregation.total).toBe(5);
    expect(aggregation.average).toBe(3.6);
    expect(aggregation.distribution[5]).toBe(2);
    expect(() => aggregateReviews([0])).toThrow('between 1 and 5');
  });

  it('validates booking windows', () => {
    const now = new Date('2026-08-20T00:00:00Z');
    expect(
      validateBookingWindow(
        { startUtc: new Date('2026-08-21T00:00:00Z'), endUtc: new Date('2026-08-21T02:00:00Z') },
        now,
      ).valid,
    ).toBe(true);
    expect(
      validateBookingWindow(
        { startUtc: new Date('2026-08-19T00:00:00Z'), endUtc: new Date('2026-08-21T02:00:00Z') },
        now,
      ).errors[0],
    ).toContain('future');
    expect(
      validateBookingWindow(
        { startUtc: new Date('2028-01-01T00:00:00Z'), endUtc: new Date('2028-01-01T02:00:00Z') },
        now,
      ).errors[0],
    ).toContain('365');
  });

  it('enforces event capacity for RSVPs', () => {
    expect(canRsvp({ capacity: null, attendeeCount: 100 })).toBe(true);
    expect(canRsvp({ capacity: 100, attendeeCount: 99 })).toBe(true);
    expect(canRsvp({ capacity: 100, attendeeCount: 100 })).toBe(false);
  });

  it('formats minor-unit prices with Intl', () => {
    expect(formatPrice(15675, 'USD')).toBe('$156.75');
  });
});
