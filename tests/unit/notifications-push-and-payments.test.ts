import { describe, it, expect, vi } from 'vitest';
import {
  formatPushPayload,
  resolveDeepLink,
} from '../../packages/notifications/src';

import {
  WiPayAdapter,
  WIPAY_SUPPORTED_CURRENCIES,
} from '../../packages/payments/src/adapters/wipay';
import { CXPayAdapter } from '../../packages/payments/src/adapters/cxpay';

describe('Web Push Subsystem (@caribbean/notifications)', () => {
  it('formats reaction push notifications with deep links to reels', () => {
    const payload = formatPushPayload({
      kind: 'reaction',
      actorName: 'Kofi Kingston',
      entityId: 'reel-jam-123',
    });

    expect(payload.title).toContain('Reel Reaction');
    expect(payload.body).toContain('Kofi Kingston loved your Caribbean reel');
    expect(payload.data.url).toBe('/reels?id=reel-jam-123');
    expect(payload.data.kind).toBe('reaction');
    expect(payload.data.actions).toBeDefined();
    expect(payload.icon).toBe('/icons/icon-192.png');
    expect(payload.badge).toBe('/favicon.svg');
  });

  it('formats payment received push notifications linking to wallet', () => {
    const payload = formatPushPayload({
      kind: 'payment_received',
      customMessage: 'You received $150.00 TTD for Carnival pass #402',
    });

    expect(payload.title).toContain('Payment Received');
    expect(payload.body).toContain('$150.00 TTD');
    expect(payload.data.url).toBe('/financial-center/transactions');
    expect(payload.data.kind).toBe('payment_received');
  });

  it('correctly maps various deep link destinations', () => {
    expect(resolveDeepLink('comment', 'reel-456')).toBe('/reels?id=reel-456');
    expect(resolveDeepLink('follow', 'kofi')).toBe('/profile/kofi');
    expect(resolveDeepLink('community_post', 'island-roots')).toBe('/communities/island-roots');
    expect(resolveDeepLink('event_reminder', 'carnival-2026')).toBe('/events/carnival-2026');
    expect(resolveDeepLink('payout_completed')).toBe('/financial-center/transactions');
  });
});

describe('Regional Caribbean Payment Rails (@caribbean/payments)', () => {
  it('validates supported Caribbean regional currencies for WiPay', async () => {
    expect(WIPAY_SUPPORTED_CURRENCIES).toContain('TTD');
    expect(WIPAY_SUPPORTED_CURRENCIES).toContain('JMD');
    expect(WIPAY_SUPPORTED_CURRENCIES).toContain('USD');
    expect(WIPAY_SUPPORTED_CURRENCIES).toContain('XCD');

    const adapter = new WiPayAdapter({
      accountNumber: '123456',
      apiKey: 'test-api-key',
      environment: 'sandbox',
    });

    // Valid regional currency charge check
    // Fetch is not mocked here, but currency validation passes and proceeds to fetch
    const invalidResult = await adapter.charge({
      amountMinor: 5000,
      currency: 'GBP', // Not in WIPAY_SUPPORTED_CURRENCIES
      idempotencyKey: 'idem_test_1',
    });

    expect(invalidResult.success).toBe(false);
    expect(invalidResult.status).toBe('error');
    expect(invalidResult.errorMessage).toContain('WiPay does not support currency GBP');
  });

  it('fails gracefully when WiPay credentials are missing', async () => {
    const unconfigured = new WiPayAdapter({});
    expect(unconfigured.isConfigured).toBe(false);

    const result = await unconfigured.charge({
      amountMinor: 2500,
      currency: 'TTD',
      idempotencyKey: 'idem_test_2',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('error');
    expect(result.errorMessage).toContain('WiPay credentials are unavailable');
  });

  it('fails gracefully when CX Pay credentials are missing', async () => {
    const unconfigured = new CXPayAdapter({});
    expect(unconfigured.isConfigured).toBe(false);

    const result = await unconfigured.charge({
      amountMinor: 1000,
      currency: 'USD',
      idempotencyKey: 'idem_cx_1',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('error');
    expect(result.errorMessage).toContain('CX Pay credentials are unavailable');
  });
});
