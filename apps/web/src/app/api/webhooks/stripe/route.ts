import { NextRequest, NextResponse } from 'next/server';
import { StripeAdapter, WebhookProcessor, TransactionLedgerService, type WebhookEvent } from '@caribbean/payments';
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
    try {
      const object = (event.data?.object || {}) as {
        id?: string;
        amount?: number;
        currency?: string;
        metadata?: Record<string, string>;
      };
      const orderId = object.metadata?.orderId;
      const paymentIntentId = object.metadata?.paymentIntentId;
      const ledgerService = new TransactionLedgerService();

      switch (event.type) {
        case 'payment_intent.succeeded': {
          let buyerId = object.metadata?.buyerId || object.metadata?.userId;
          let sellerId = object.metadata?.sellerId || object.metadata?.merchantId || object.metadata?.creatorId;
          if (orderId) {
            const { data: orderData } = await supabase
              .from('orders')
              .update({ status: 'paid' })
              .eq('id', orderId)
              .select('buyer_id, seller_id, total_minor, currency')
              .maybeSingle();
            if (orderData?.buyer_id) buyerId = orderData.buyer_id;
            if (orderData?.seller_id) sellerId = orderData.seller_id;
          }
          if (paymentIntentId) {
            await supabase.from('payment_intents').update({ status: 'succeeded' }).eq('id', paymentIntentId);
          } else if (orderId) {
            await supabase.from('payment_intents').update({ status: 'succeeded' }).eq('reference_id', orderId);
          }
          if (buyerId && typeof object.amount === 'number' && object.amount > 0) {
            try {
              const tx = await ledgerService.recordTransaction(supabase, {
                idempotencyKey: `stripe_wh_${object.id || eventId}`,
                transactionType: object.metadata?.creatorId ? 'CREATOR_SUBSCRIPTION' : 'MARKETPLACE_PURCHASE',
                payerId: buyerId,
                recipientId: sellerId || null,
                creatorId: object.metadata?.creatorId || null,
                merchantId: sellerId || null,
                orderId: orderId || null,
                paymentIntentId: paymentIntentId || null,
                provider: 'stripe',
                providerTransactionId: object.id || eventId,
                grossAmountMinor: object.amount,
                currency: (object.currency || 'USD').toUpperCase(),
              });
              await ledgerService.settleTransaction(supabase, tx.id, {
                providerTransactionId: object.id || eventId,
              });
            } catch (ledgerErr) {
              console.warn('[StripeWebhook] Ledger settlement warning:', ledgerErr);
            }
          }
          const { track } = await import('../../../../lib/monitoring/analytics');
          track('payment_completed', { amount: object.amount ?? null }, buyerId);
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

      await supabase
        .from('payment_webhooks')
        .update({ processing_status: 'processed', processed_at: new Date().toISOString() })
        .eq('provider_id', 'stripe')
        .eq('event_id', eventId);
    } catch (processingError: any) {
      await supabase
        .from('payment_webhooks')
        .update({ processing_status: 'failed', error_message: processingError?.message || 'Processing failed' })
        .eq('provider_id', 'stripe')
        .eq('event_id', eventId);
      throw processingError;
    }
  }

  return NextResponse.json({ received: true });
}
