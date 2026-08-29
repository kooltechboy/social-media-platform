import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) },
}));

vi.mock('../../apps/web/src/lib/supabase/server', () => ({
  createServiceSupabaseClient: vi.fn(async () => null),
}));

const request = (body: string, headers: Record<string, string> = {}) => new Request('http://localhost/api/webhook', {
  method: 'POST',
  body,
  headers: { 'content-type': 'application/json', ...headers },
});

describe('Stripe webhook route containment', () => {
  beforeEach(() => vi.resetModules());

  it('rejects a request without Stripe signature before persistence', async () => {
    const { POST } = await import('../../apps/web/src/app/api/webhooks/stripe/route');
    const response = await POST(request(JSON.stringify({ id: 'evt_1', type: 'payment' })) as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'Missing stripe-signature header' });
  });

  it('rejects an invalid JSON payload', async () => {
    const { POST } = await import('../../apps/web/src/app/api/webhooks/stripe/route');
    const response = await POST(request('{', { 'stripe-signature': 'sig' }) as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'Invalid JSON' });
  });
});

describe('provider-neutral webhook route containment', () => {
  beforeEach(() => vi.resetModules());

  it('rejects a payload without a provider event ID instead of synthesizing one', async () => {
    const { POST } = await import('../../apps/web/src/app/api/payments/webhooks/[provider]/route');
    const response = await POST(
      request(JSON.stringify({ type: 'payment' }), { 'x-webhook-signature': 'present' }) as never,
      { params: Promise.resolve({ provider: 'paypal' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'Missing provider event ID' });
  });

  it('rejects unsigned non-Stripe provider webhooks', async () => {
    const { POST } = await import('../../apps/web/src/app/api/payments/webhooks/[provider]/route');
    const response = await POST(
      request(JSON.stringify({ id: 'provider_evt_1', type: 'payment' })) as never,
      { params: Promise.resolve({ provider: 'paypal' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'Missing webhook signature' });
  });
});
