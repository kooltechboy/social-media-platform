import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry, TransactionLedgerService, type TransactionType } from '@caribbean/payments';
import { createServiceSupabaseClient, getCurrentUser } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { token, intentId } = await request.json(); // token is the PayPal order ID
    if (!token || !intentId) {
      return NextResponse.json({ error: 'Missing token or intentId' }, { status: 400 });
    }

    const supabase = await createServiceSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    // 1. Retrieve payment intent FIRST to enforce idempotency and order-to-intent binding
    const { data: intent, error: intentErr } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', intentId)
      .single();

    if (intentErr || !intent) {
      return NextResponse.json({ error: 'Payment intent record not found' }, { status: 404 });
    }

    // Verify caller ownership when session is available
    const user = await getCurrentUser().catch(() => null);
    const intentPayerId = intent.payer_id || intent.user_id;
    if (user && intentPayerId && intentPayerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: payment intent belongs to another user' }, { status: 403 });
    }

    // Idempotency guard: if already succeeded, return early without double-crediting
    if (intent.status === 'succeeded') {
      return NextResponse.json({
        success: true,
        duplicate: true,
        captureId: intent.provider_transaction_id || token,
        status: 'succeeded',
      });
    }

    // Order-to-intent binding check: prevent swapping a cheap PayPal order token onto a high-value intentId
    const expectedOrderId = intent.provider_transaction_id || intent.metadata?.paypalOrderId;
    if (expectedOrderId && expectedOrderId !== token) {
      return NextResponse.json(
        { error: 'PayPal order token does not match payment intent' },
        { status: 400 }
      );
    }

    const registry = new ProviderRegistry();
    const adapter = registry.get('paypal') as any;

    // 2. Authoritatively capture order from PayPal
    const captureResult = await adapter.captureOrder(token);

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'PayPal order capture was not completed' }, { status: 400 });
    }

    // Verify captured amount & currency when present in PayPal capture response
    const captureUnit = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
    if (captureUnit?.amount?.value && intent.amount_minor) {
      const capturedMinor = Math.round(parseFloat(captureUnit.amount.value) * 100);
      if (capturedMinor !== Number(intent.amount_minor)) {
        return NextResponse.json(
          { error: 'Captured PayPal amount does not match payment intent amount' },
          { status: 400 }
        );
      }
    }
    if (
      captureUnit?.amount?.currency_code &&
      intent.currency &&
      String(captureUnit.amount.currency_code).toUpperCase() !== String(intent.currency).toUpperCase()
    ) {
      return NextResponse.json(
        { error: 'Captured PayPal currency does not match payment intent currency' },
        { status: 400 }
      );
    }

    const authoritativeCaptureId = captureUnit?.id || captureResult.id || token;

    // 3. Determine transaction type
    const productType = intent.product_type || intent.metadata?.productType;
    const referenceType =
      intent.reference_type || (productType === 'business_ad' ? 'ad_campaign' : null);
    const referenceId = intent.reference_id || intent.metadata?.campaignId || null;

    let txType: TransactionType = 'MARKETPLACE_PURCHASE';
    if (productType === 'digital_subscription') {
      txType = intent.creator_id ? 'CREATOR_SUBSCRIPTION' : 'TUKUBI_SUBSCRIPTION';
    } else if (productType === 'creator_tip') {
      txType = 'CREATOR_TIP';
    } else if (productType === 'physical_goods' || productType === 'store_product') {
      txType = 'MARKETPLACE_PURCHASE';
    } else if (productType === 'business_ad' || referenceType === 'ad_campaign') {
      txType = 'AD_PAYMENT';
    }

    // 4. Record & Settle in Immutable Transaction Ledger (canonical intent-scoped idempotency key)
    const ledgerService = new TransactionLedgerService();
    const tx = await ledgerService.recordTransaction(supabase, {
      idempotencyKey: `settle_intent_${intent.id}`,
      transactionType: txType,
      payerId: intentPayerId,
      recipientId: intent.merchant_id || intent.creator_id || null,
      creatorId: intent.creator_id,
      merchantId: intent.merchant_id,
      orderId: referenceType === 'order' ? referenceId : null,
      paymentIntentId: intent.id,
      provider: 'paypal',
      providerTransactionId: authoritativeCaptureId,
      grossAmountMinor: intent.amount_minor,
      currency: intent.currency || 'USD',
      metadata: {
        paypalOrderId: token,
        paypalCaptureId: authoritativeCaptureId,
        payerEmail: captureResult.payer?.email_address,
      },
      initialStatus: 'PENDING',
    });

    await ledgerService.settleTransaction(supabase, tx.id, {
      providerTransactionId: authoritativeCaptureId,
      sellerCategory: intent.creator_id
        ? 'creator'
        : intent.merchant_id
        ? 'merchant'
        : productType === 'business_ad'
        ? 'business'
        : 'user',
      productType,
    });

    // 5. Update Intent status
    await supabase
      .from('payment_intents')
      .update({
        status: 'succeeded',
        provider_transaction_id: authoritativeCaptureId,
      })
      .eq('id', intent.id);

    // 6. Fulfill Order, Subscription, or Ad Campaign
    if (referenceType === 'order' && referenceId) {
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', referenceId);
    } else if (referenceType === 'ad_campaign' && referenceId) {
      // Fulfill Ad Campaign Prepaid Funding (increment existing funded balance for top-ups)
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, status, moderation_status, budget_total_minor, funded_amount_minor')
        .eq('id', referenceId)
        .maybeSingle();

      if (campaign) {
        const isApproved = campaign.moderation_status === 'approved';
        const nextFundedMinor =
          Number(campaign.funded_amount_minor || 0) + Number(intent.amount_minor || 0);
        await supabase
          .from('campaigns')
          .update({
            funded_amount_minor: nextFundedMinor,
            status: isApproved ? 'active' : 'draft',
          })
          .eq('id', campaign.id);
      }
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
