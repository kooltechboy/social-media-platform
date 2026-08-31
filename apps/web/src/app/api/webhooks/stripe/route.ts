import { NextRequest, NextResponse } from 'next/server';
import { StripeAdapter, WebhookProcessor, type WebhookEvent } from '@caribbean/payments';
import { createServiceSupabaseClient } from '../../../../lib/supabase/server';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const adapter = new StripeAdapter();
  let event: { id?: unknown; type?: unknown; data?: { object?: unknown } };
  try {
    const parsed = JSON.parse(payload) as typeof event;
    event = parsed;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = typeof event.id === 'string' ? event.id : '';
  const eventType = typeof event.type === 'string' ? event.type : 'payment.webhook';
  const webhookEvent: WebhookEvent = {
    id: eventId,
    providerId: 'stripe',
    type: eventType,
    payload,
    signature,
  };
  const processor = new WebhookProcessor((p, s) => adapter.verifyWebhook(p, s), {
    claim: async (claimedEvent) => {
      const supabase = await createServiceSupabaseClient();
      if (!supabase) throw new Error('Webhook persistence unavailable');
      const { error } = await supabase.from('payment_webhooks').insert({
        provider_id: claimedEvent.providerId,
        event_id: claimedEvent.id,
        event_type: claimedEvent.type,
        payload: JSON.parse(claimedEvent.payload),
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
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Handle specific Stripe events
  const supabase = await createServiceSupabaseClient();
  if (supabase) {
    const object = (event.data?.object || {}) as {
      id?: string;
      amount?: number;
      metadata?: Record<string, string>;
    };
    const orderId = object.metadata?.orderId;
    const paymentIntentId = object.metadata?.paymentIntentId;

    switch (event.type) {
      case 'payment_intent.succeeded': {
        if (orderId) {
          await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
        }
        if (paymentIntentId) {
          await supabase.from('payment_intents').update({ status: 'succeeded' }).eq('id', paymentIntentId);
        } else if (orderId) {
          await supabase.from('payment_intents').update({ status: 'succeeded' }).eq('reference_id', orderId);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        if (orderId) {
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
        }
        if (paymentIntentId) {
          await supabase.from('payment_intents').update({ status: 'failed' }).eq('id', paymentIntentId);
        } else if (orderId) {
          await supabase.from('payment_intents').update({ status: 'failed' }).eq('reference_id', orderId);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${eventType}`);
    }
  }

  return NextResponse.json({ received: true });
}
