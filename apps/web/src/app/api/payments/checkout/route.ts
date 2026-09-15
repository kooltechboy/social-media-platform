import { NextRequest, NextResponse } from 'next/server';
import {
  PaymentPolicyEngine,
  CommissionEngine,
  PaymentIntentService,
  ProviderRegistry,
  type AccountCategory,
  type ProductType,
} from '@caribbean/payments';
import { getCurrentUser, createServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to checkout.' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      productType,
      productId,
      tierId,
      planId,
      quantity: rawQuantity,
      platform = 'web',
      provider: requestedProvider,
      isAnnual = false,
      tipAmountMinor,
      creatorId: rawCreatorId,
      sellerId: rawSellerId,
      returnUrl,
      cancelUrl,
    } = body;

    const supabase = await createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 3. Authoritative Server-Side Price & Recipient Resolution (Zero Client Trust)
    let grossAmountMinor = 0;
    let resolvedCurrency = 'USD';
    let resolvedSellerId: string | null = null;
    let resolvedCreatorId: string | null = null;
    let resolvedProductType: ProductType = (productType as ProductType) || 'physical_goods';
    let itemDescription = 'TUKUBI Order';
    const quantity = Number.isInteger(rawQuantity) && rawQuantity > 0 ? rawQuantity : 1;

    if (productId) {
      // Marketplace or Store Product
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('id, title, price_minor, currency, product_kind, seller_id, is_active')
        .eq('id', productId)
        .maybeSingle();

      if (prodErr || !product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      if (!product.is_active) {
        return NextResponse.json({ error: 'Product is no longer available for purchase' }, { status: 400 });
      }

      grossAmountMinor = product.price_minor * quantity;
      resolvedCurrency = product.currency.toUpperCase();
      resolvedSellerId = product.seller_id;
      resolvedProductType = (product.product_kind as ProductType) || 'physical_goods';
      itemDescription = `${product.title} (x${quantity})`;
    } else if (tierId) {
      // TUKUBI Platform Plan Subscription (Model A: TUKUBI Revenue)
      const { data: tier, error: tierErr } = await supabase
        .from('monetization_tier_configs')
        .select('id, name, price_minor_monthly, price_minor_annual, currency, is_active')
        .eq('id', tierId)
        .maybeSingle();

      if (tierErr || !tier) {
        return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
      }

      grossAmountMinor = isAnnual ? tier.price_minor_annual : tier.price_minor_monthly;
      resolvedCurrency = tier.currency.toUpperCase();
      resolvedProductType = 'digital_subscription';
      itemDescription = `TUKUBI ${tier.name} (${isAnnual ? 'Annual' : 'Monthly'})`;
    } else if (planId) {
      // Creator Custom Fan Subscription (Model B: Creator Revenue)
      const { data: plan, error: planErr } = await supabase
        .from('creator_subscription_plans')
        .select('id, creator_id, name, price_minor, currency, billing_interval, is_active')
        .eq('id', planId)
        .maybeSingle();

      if (planErr || !plan) {
        return NextResponse.json({ error: 'Creator subscription plan not found' }, { status: 404 });
      }

      grossAmountMinor = plan.price_minor;
      resolvedCurrency = plan.currency.toUpperCase();
      resolvedCreatorId = plan.creator_id;
      resolvedProductType = 'digital_subscription';
      itemDescription = `Creator Plan: ${plan.name}`;
    } else if (productType === 'creator_tip') {
      // Direct Fan Tip
      const tip = Number(tipAmountMinor);
      if (!Number.isSafeInteger(tip) || tip < 100) {
        return NextResponse.json({ error: 'Tip must be at least $1.00 (100 minor units)' }, { status: 400 });
      }
      grossAmountMinor = tip;
      resolvedCurrency = (body.currency || 'USD').toUpperCase();
      resolvedCreatorId = rawCreatorId || null;
      resolvedProductType = 'creator_tip';
      itemDescription = 'Creator Fan Tip';
    } else {
      return NextResponse.json({ error: 'Invalid checkout target. Missing productId, tierId, or planId.' }, { status: 400 });
    }

    if (grossAmountMinor <= 0) {
      return NextResponse.json({ error: 'Free items do not require financial checkout.' }, { status: 400 });
    }

    // 4. Run Policy Routing Engine
    const policy = new PaymentPolicyEngine();
    const policyDecision = policy.decide({
      countryIso: 'US', // default or resolved from user profile
      platform: platform as any,
      productType: resolvedProductType,
      amountMinor: grossAmountMinor,
    });

    if (!policyDecision.compliant || policyDecision.permittedProviders.length === 0) {
      return NextResponse.json({ error: policyDecision.reason || 'Payment method not permitted for this item' }, { status: 422 });
    }

    const selectedProvider = requestedProvider && policyDecision.permittedProviders.includes(requestedProvider)
      ? requestedProvider
      : policyDecision.permittedProviders[0];

    // 5. Create Payment Intent
    const intentService = new PaymentIntentService();
    const idempotencyKey = body.idempotencyKey || `chk_${Date.now()}_${user.id}_${Math.random().toString(36).slice(2, 8)}`;
    const seenKeys = new Set<string>();

    const intent = intentService.create({
      currency: resolvedCurrency,
      amountMinor: grossAmountMinor,
      payerId: user.id,
      productType: resolvedProductType,
      idempotencyKey,
      selectedProvider,
      selectedMethodKind: policyDecision.selectedMethodKinds[0] || 'card',
      seenIdempotencyKeys: seenKeys,
      merchantId: resolvedSellerId || undefined,
      creatorId: resolvedCreatorId || undefined,
    });

    const { data: dbIntent, error: intentError } = await supabase
      .from('payment_intents')
      .insert({
        id: intent.id,
        payer_id: intent.payerId,
        product_type: intent.productType,
        reference_type: productId ? 'order' : (tierId || planId ? 'subscription' : 'tip'),
        reference_id: productId || tierId || planId || null,
        amount_minor: intent.amountMinor,
        currency: intent.currency,
        status: 'requires_payment',
        selected_provider: selectedProvider,
        merchant_id: resolvedSellerId,
        creator_id: resolvedCreatorId,
        idempotency_key: intent.idempotencyKey,
      })
      .select()
      .single();

    if (intentError) {
      console.error('[checkout] Payment intent creation error:', intentError);
      return NextResponse.json({ error: 'Failed to initiate payment intent' }, { status: 500 });
    }

    // 6. Invoke Payment Provider Adapter
    const registry = new ProviderRegistry();
    const adapter = registry.get(selectedProvider);

    const chargeResult = await adapter.charge({
      amountMinor: grossAmountMinor,
      currency: resolvedCurrency,
      idempotencyKey: intent.id,
      customerEmail: user.email || undefined,
      returnUrl: returnUrl || `${request.nextUrl.origin}/financial-center/transactions?status=success&intentId=${intent.id}`,
      cancelUrl: cancelUrl || `${request.nextUrl.origin}/financial-center?status=cancelled`,
      metadata: {
        intentId: intent.id,
        payerId: user.id,
        itemDescription,
      },
    });

    if (!chargeResult.success) {
      await supabase.from('payment_intents').update({ status: 'failed' }).eq('id', intent.id);
      return NextResponse.json({ error: chargeResult.errorMessage || 'Provider transaction initiation failed' }, { status: 400 });
    }

    // Update intent with provider transaction ID
    if (chargeResult.providerTransactionId) {
      await supabase
        .from('payment_intents')
        .update({
          provider_transaction_id: chargeResult.providerTransactionId,
          status: chargeResult.status === 'succeeded' ? 'succeeded' : 'requires_action',
        })
        .eq('id', intent.id);
    }

    // 7. Return provider approval URL / client secret to frontend
    let clientSecret = null;
    if (selectedProvider === 'stripe' && chargeResult.rawResponse) {
      clientSecret = (chargeResult.rawResponse as any).client_secret;
    }

    return NextResponse.json({
      success: true,
      intentId: intent.id,
      provider: selectedProvider,
      transactionId: chargeResult.providerTransactionId,
      status: chargeResult.status,
      redirectUrl: chargeResult.redirectUrl,
      clientSecret,
    });
  } catch (error) {
    console.error('[checkout] Unhandled error:', error);
    return NextResponse.json({ error: 'Checkout request failed' }, { status: 500 });
  }
}
