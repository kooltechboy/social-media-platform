import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry, TransactionLedgerService, type TransactionType } from '@caribbean/payments';
import { createServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { token, intentId } = await request.json(); // token is the PayPal order ID
    if (!token || !intentId) {
      return NextResponse.json({ error: 'Missing token or intentId' }, { status: 400 });
    }

    const registry = new ProviderRegistry();
    const adapter = registry.get('paypal') as any;

    // 1. Authoritatively capture order from PayPal
    const captureResult = await adapter.captureOrder(token);

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'PayPal order capture was not completed' }, { status: 400 });
    }

    const supabase = await createServiceSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    // 2. Retrieve payment intent
    const { data: intent, error: intentErr } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', intentId)
      .single();

    if (intentErr || !intent) {
      return NextResponse.json({ error: 'Payment intent record not found' }, { status: 404 });
    }

    // 3. Determine transaction type
    let txType: TransactionType = 'MARKETPLACE_PURCHASE';
    if (intent.product_type === 'digital_subscription') {
      txType = intent.creator_id ? 'CREATOR_SUBSCRIPTION' : 'TUKUBI_SUBSCRIPTION';
    } else if (intent.product_type === 'creator_tip') {
      txType = 'CREATOR_TIP';
    } else if (intent.product_type === 'physical_goods' || intent.product_type === 'store_product') {
      txType = 'MARKETPLACE_PURCHASE';
    }

    // 4. Record & Settle in Immutable Transaction Ledger
    const ledgerService = new TransactionLedgerService();
    const tx = await ledgerService.recordTransaction(supabase, {
      idempotencyKey: `paypal_${captureResult.id || intent.id}`,
      transactionType: txType,
      payerId: intent.payer_id,
      recipientId: intent.merchant_id || intent.creator_id || null,
      creatorId: intent.creator_id,
      merchantId: intent.merchant_id,
      orderId: intent.reference_type === 'order' ? intent.reference_id : null,
      paymentIntentId: intent.id,
      provider: 'paypal',
      providerTransactionId: captureResult.id || token,
      grossAmountMinor: intent.amount_minor,
      currency: intent.currency,
      metadata: {
        paypalCaptureId: captureResult.id,
        payerEmail: captureResult.payer?.email_address,
      },
      initialStatus: 'PENDING',
    });

    await ledgerService.settleTransaction(supabase, tx.id, {
      providerTransactionId: captureResult.id || token,
      sellerCategory: intent.creator_id ? 'creator' : (intent.merchant_id ? 'merchant' : 'user'),
      productType: intent.product_type,
    });

    // 5. Update Intent status
    await supabase
      .from('payment_intents')
      .update({
        status: 'succeeded',
        provider_transaction_id: captureResult.id || token,
      })
      .eq('id', intent.id);

    // 6. Fulfill Order or Subscription
    if (intent.reference_type === 'order' && intent.reference_id) {
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', intent.reference_id);
    } else if (intent.reference_type === 'subscription' && intent.reference_id) {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 86400000).toISOString();

      if (intent.creator_id) {
        // Creator fan subscription
        // First resolve creator_account_id
        const { data: creatorAcc } = await supabase
          .from('creator_accounts')
          .select('id')
          .eq('profile_id', intent.creator_id)
          .maybeSingle();

        if (creatorAcc) {
          await supabase.from('subscriptions').upsert({
            creator_account_id: creatorAcc.id,
            subscriber_id: intent.payer_id,
            tier: 'plus',
            price_minor: intent.amount_minor,
            currency: intent.currency,
            billing_source: 'paypal',
            status: 'active',
            creator_subscription_plan_id: intent.reference_id,
            paypal_subscription_id: captureResult.id,
            current_period_end: periodEnd,
          }, { onConflict: 'creator_account_id,subscriber_id' });
        }
      } else {
        // TUKUBI platform subscription
        const tierId = intent.reference_id;
        await supabase.from('commercial_subscriptions').upsert({
          subscriber_id: intent.payer_id,
          target_type: tierId.startsWith('seller_') || tierId.startsWith('business_') ? 'business' : (tierId.startsWith('creator_') ? 'creator' : 'user'),
          target_id: intent.payer_id,
          tier_id: tierId,
          billing_interval: 'monthly',
          price_minor: intent.amount_minor,
          currency: intent.currency,
          status: 'active',
          payment_provider: 'paypal',
          provider_subscription_id: captureResult.id,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd,
        }, { onConflict: 'target_type,target_id' });
      }
    }

    return NextResponse.json({
      success: true,
      captureId: captureResult.id,
      transactionId: tx.id,
      status: 'succeeded',
    });
  } catch (error) {
    console.error('[paypal capture] Error:', error);
    return NextResponse.json({ error: 'Capture processing failed' }, { status: 500 });
  }
}
