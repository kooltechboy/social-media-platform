import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry, WebhookProcessor } from '@caribbean/payments';
import { createSupabaseServerClient } from '../../../../../lib/supabase/server';

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

  const processor = new WebhookProcessor((payload, sig, secret) =>
    adapter.verifyWebhook(payload, sig, secret)
  );

  const eventId = request.headers.get('x-event-id') || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const outcome = processor.process({
    id: eventId,
    providerId,
    type: 'payment.webhook',
    payload: rawBody,
    signature,
  });

  if (!outcome.accepted) {
    return NextResponse.json({ error: outcome.reason }, { status: 400 });
  }

  if (outcome.duplicate) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  // Record webhook audit log if supabase is available
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      let parsedPayload: any = {};
      try {
        parsedPayload = JSON.parse(rawBody);
      } catch {
        parsedPayload = { raw: rawBody };
      }

      await supabase.from('payment_webhooks').insert({
        provider_id: providerId,
        event_id: eventId,
        event_type: parsedPayload.type || 'payment.event',
        payload: parsedPayload,
        signature_valid: true,
        processing_status: 'processed',
      });
    }
  } catch {
    // Non-blocking for webhook acknowledgment
  }

  return NextResponse.json({ received: true, processed: true }, { status: 200 });
}
