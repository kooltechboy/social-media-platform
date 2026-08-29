import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry, WebhookProcessor, type WebhookEvent } from '@caribbean/payments';
import { createServiceSupabaseClient } from '../../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await context.params;
  const registry = new ProviderRegistry();

  if (!registry.has(providerId)) {
    return NextResponse.json({ error: `Unknown provider: ${providerId}` }, { status: 400 });
  }

  const adapter = registry.get(providerId);
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || request.headers.get('x-webhook-signature') || '';

  let parsedPayload: Record<string, unknown>;
  try {
    parsedPayload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = typeof parsedPayload.id === 'string' ? parsedPayload.id : '';
  const eventType = typeof parsedPayload.type === 'string' ? parsedPayload.type : 'payment.webhook';
  const webhookEvent: WebhookEvent = {
    id: eventId,
    providerId,
    type: eventType,
    payload: rawBody,
    signature,
  };
  const processor = new WebhookProcessor((payload, sig, secret) =>
    adapter.verifyWebhook(payload, sig, secret), {
      claim: async (claimedEvent) => {
        const supabase = await createServiceSupabaseClient();
        if (!supabase) throw new Error('Webhook persistence unavailable');
        const { error } = await supabase.from('payment_webhooks').insert({
          provider_id: claimedEvent.providerId,
          event_id: claimedEvent.id,
          event_type: claimedEvent.type,
          payload: parsedPayload,
          signature_valid: true,
          processing_status: 'received',
        });
        if (error?.code === '23505') return false;
        if (error) throw error;
        return true;
      },
    });
  const outcome = await processor.process(webhookEvent);

  if (!outcome.accepted) {
    return NextResponse.json({ error: outcome.reason }, { status: outcome.reason === 'Webhook persistence unavailable' ? 503 : 400 });
  }

  if (outcome.duplicate) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  return NextResponse.json({ received: true, processed: true }, { status: 200 });
}
