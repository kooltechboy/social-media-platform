import { NextRequest, NextResponse } from 'next/server';
import {
  ProviderRegistry,
  WebhookProcessor,
  TransactionLedgerService,
  type WebhookEvent,
} from '@caribbean/payments';
import { createServiceSupabaseClient } from '@/lib/supabase/server';

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

  let parsedPayload: Record<string, any>;
  try {
    parsedPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Convert headers
  const headerObj: Record<string, string> = {};
  request.headers.forEach((val, key) => {
    headerObj[key.toLowerCase()] = val;
  });

  // Extract and validate event metadata
  const rawEventId = parsedPayload?.id || parsedPayload?.event_id;
  if (!rawEventId) {
    return NextResponse.json({ error: 'Missing provider event ID' }, { status: 400 });
  }
  const eventId = String(rawEventId);
  const eventType = String(parsedPayload.event_type || parsedPayload.type || 'payment.webhook');

  // Validate webhook signature presence
  const signature =
    headerObj['paypal-transmission-sig'] ||
    headerObj['stripe-signature'] ||
    headerObj['x-webhook-signature'] ||
    headerObj['signature'] ||
    '';

  if (!signature) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
  }

  const webhookEvent: WebhookEvent = {
    id: eventId,
    providerId,
    type: eventType,
    payload: rawBody,
    signature,
  };

  const supabase = await createServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  // 1. Enforce Webhook Processor & Idempotency
  const processor = new WebhookProcessor(
    async (payload, _sig, _secret) => {
      return adapter.verifyWebhook(payload, headerObj);
    },
    {
      claim: async (claimed) => {
        const { error } = await supabase.from('payment_webhooks').insert({
          provider_id: claimed.providerId,
          event_id: claimed.id,
          event_type: claimed.type,
          payload: parsedPayload,
          signature_valid: true,
          processing_status: 'received',
        });
        if (error?.code === '23505') return false; // Duplicate event
        if (error) throw error;
        return true;
      },
    }
  );

  const outcome = await processor.process(webhookEvent);

  if (!outcome.accepted) {
    if (outcome.duplicate) {
      // Idempotent 200 return on duplicates per Stripe/PayPal webhooks best practice
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    return NextResponse.json({ error: outcome.reason || 'Webhook verification failed' }, { status: 400 });
  }

  // 2. Authoritative Event State Machine Processing
  try {
    const resource = (parsedPayload.resource || {}) as Record<string, any>;
    const ledgerService = new TransactionLedgerService();

    if (providerId === 'paypal') {
      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
        case 'CHECKOUT.ORDER.APPROVED': {
          const customId = resource.custom_id || resource.invoice_id;
          const captureId = resource.id;
          const amountMinor = resource.amount?.value ? Math.round(parseFloat(resource.amount.value) * 100) : 0;
          const currency = resource.amount?.currency_code || 'USD';

          if (customId) {
            // Find related payment intent
            const { data: intent } = await supabase
              .from('payment_intents')
              .select('*')
              .or(`id.eq.${customId},idempotency_key.eq.${customId},reference_id.eq.${customId}`)
              .maybeSingle();

            if (intent) {
              await supabase
                .from('payment_intents')
                .update({ status: 'succeeded', provider_transaction_id: captureId })
                .eq('id', intent.id);

              // Record in transaction ledger
              const tx = await ledgerService.recordTransaction(supabase, {
                idempotencyKey: `wh_${captureId}`,
                transactionType: intent.product_type === 'digital_subscription'
                  ? (intent.creator_id ? 'CREATOR_SUBSCRIPTION' : 'TUKUBI_SUBSCRIPTION')
                  : 'MARKETPLACE_PURCHASE',
                payerId: intent.payer_id,
                recipientId: intent.merchant_id || intent.creator_id,
                creatorId: intent.creator_id,
                merchantId: intent.merchant_id,
                orderId: intent.reference_type === 'order' ? intent.reference_id : null,
                paymentIntentId: intent.id,
                provider: 'paypal',
                providerTransactionId: captureId,
                grossAmountMinor: amountMinor || intent.amount_minor,
                currency,
                initialStatus: 'COMPLETED',
              });

              await ledgerService.settleTransaction(supabase, tx.id, {
                providerTransactionId: captureId,
                sellerCategory: intent.creator_id ? 'creator' : 'merchant',
              });

              if (intent.reference_type === 'order' && intent.reference_id) {
                await supabase.from('orders').update({ status: 'paid' }).eq('id', intent.reference_id);
              }
            }
          }
          break;
        }

        case 'BILLING.SUBSCRIPTION.ACTIVATED': {
          const subId = resource.id;
          const customId = resource.custom_id;

          if (customId?.startsWith('tukubi_')) {
            const parts = customId.split('_');
            const tierId = parts.slice(1, -1).join('_');
            const userId = parts[parts.length - 1];

            const { data: tier } = await supabase
              .from('monetization_tier_configs')
              .select('*')
              .eq('id', tierId)
              .maybeSingle();

            await supabase
              .from('commercial_subscriptions')
              .upsert({
                subscriber_id: userId,
                target_type: tier?.account_category || 'user',
                target_id: userId,
                tier_id: tierId,
                billing_interval: 'monthly',
                price_minor: tier?.price_minor_monthly || 0,
                currency: tier?.currency || 'USD',
                status: 'active',
                payment_provider: 'paypal',
                provider_subscription_id: subId,
                current_period_start: resource.start_time || new Date().toISOString(),
                current_period_end: resource.billing_info?.next_billing_time || new Date(Date.now() + 30 * 86400000).toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'target_type,target_id' });

            if (tier && tier.price_minor_monthly > 0) {
              const tx = await ledgerService.recordTransaction(supabase, {
                idempotencyKey: `sub_act_${subId}`,
                transactionType: 'TUKUBI_SUBSCRIPTION',
                payerId: userId,
                provider: 'paypal',
                providerTransactionId: subId,
                grossAmountMinor: tier.price_minor_monthly,
                currency: tier.currency || 'USD',
                initialStatus: 'COMPLETED',
              });

              await ledgerService.settleTransaction(supabase, tx.id, {
                providerTransactionId: subId,
                sellerCategory: 'business',
              });
            }
          } else if (customId?.startsWith('creator_')) {
            const parts = customId.split('_');
            const planId = parts[1];
            const userId = parts[2];

            const { data: plan } = await supabase
              .from('creator_subscription_plans')
              .select('*')
              .eq('id', planId)
              .maybeSingle();

            if (plan) {
              await supabase
                .from('subscriptions')
                .upsert({
                  subscriber_id: userId,
                  creator_id: plan.creator_id,
                  tier: plan.name,
                  creator_subscription_plan_id: plan.id,
                  price_minor: plan.price_minor,
                  currency: plan.currency || 'USD',
                  billing_source: 'paypal',
                  status: 'active',
                  paypal_subscription_id: subId,
                  current_period_end: resource.billing_info?.next_billing_time || new Date(Date.now() + 30 * 86400000).toISOString(),
                });

              const tx = await ledgerService.recordTransaction(supabase, {
                idempotencyKey: `sub_act_${subId}`,
                transactionType: 'CREATOR_SUBSCRIPTION',
                payerId: userId,
                recipientId: plan.creator_id,
                creatorId: plan.creator_id,
                provider: 'paypal',
                providerTransactionId: subId,
                grossAmountMinor: plan.price_minor,
                currency: plan.currency || 'USD',
                initialStatus: 'COMPLETED',
              });

              await ledgerService.settleTransaction(supabase, tx.id, {
                providerTransactionId: subId,
                sellerCategory: 'creator',
              });
            }
          } else if (subId) {
            await supabase
              .from('commercial_subscriptions')
              .update({ status: 'active', updated_at: new Date().toISOString() })
              .eq('provider_subscription_id', subId);

            await supabase
              .from('subscriptions')
              .update({ status: 'active' })
              .eq('paypal_subscription_id', subId);
          }
          break;
        }

        case 'BILLING.SUBSCRIPTION.CANCELLED':
        case 'BILLING.SUBSCRIPTION.SUSPENDED': {
          const subId = resource.id;
          if (subId) {
            await supabase
              .from('commercial_subscriptions')
              .update({ status: 'canceled', updated_at: new Date().toISOString() })
              .eq('provider_subscription_id', subId);

            await supabase
              .from('subscriptions')
              .update({ status: 'cancelled' })
              .eq('paypal_subscription_id', subId);
          }
          break;
        }

        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
          const subId = resource.id;
          if (subId) {
            await supabase
              .from('commercial_subscriptions')
              .update({ status: 'past_due', updated_at: new Date().toISOString() })
              .eq('provider_subscription_id', subId);
          }
          break;
        }

        case 'PAYMENT.CAPTURE.REFUNDED': {
          const refundId = resource.id;
          const originalCaptureId = resource.links?.find((l: any) => l.rel === 'up')?.href?.split('/').pop();
          const amountMinor = resource.amount?.value ? Math.round(parseFloat(resource.amount.value) * 100) : 0;

          if (originalCaptureId && amountMinor > 0) {
            const { data: origTx } = await supabase
              .from('payment_transactions')
              .select('id')
              .eq('provider_transaction_id', originalCaptureId)
              .maybeSingle();

            if (origTx) {
              await ledgerService.refundTransaction(
                supabase,
                origTx.id,
                amountMinor,
                'PayPal webhook refund notification',
                `paypal_refund_${refundId}`
              );
            }
          }
          break;
        }

        default:
          break;
      }
    }

    // Mark webhook processing status as 'processed'
    await supabase
      .from('payment_webhooks')
      .update({ processing_status: 'processed' })
      .eq('provider_id', providerId)
      .eq('event_id', eventId);

    return NextResponse.json({ received: true, processed: true }, { status: 200 });
  } catch (procErr: any) {
    console.error('[webhook execution] Error:', procErr);
    await supabase
      .from('payment_webhooks')
      .update({ processing_status: 'failed', error_message: procErr?.message })
      .eq('provider_id', providerId)
      .eq('event_id', eventId);

    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
