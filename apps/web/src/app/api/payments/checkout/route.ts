import { NextRequest, NextResponse } from 'next/server';
import {
  PaymentPolicyEngine,
  CommissionEngine,
  LedgerOrchestrator,
  PaymentIntentService,
  ProviderRegistry
} from '@caribbean/payments';
import { getCurrentUser, createServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Parse + validate request body
    const body = await request.json();
    const { amount, currency, productType, productId, platform, sellerId, creatorId } = body;

    if (!amount || !currency || !productType || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Run PaymentPolicyEngine
    const policy = new PaymentPolicyEngine();
    const result = policy.decide({
      countryIso: 'US', // default
      platform: platform as any,
      productType: productType as any,
      amountMinor: amount,
    });

    if (!result.compliant || result.permittedProviders.length === 0) {
      return NextResponse.json({ error: result.reason || 'Not allowed' }, { status: 422 });
    }

    const selectedProvider = result.permittedProviders[0];

    // 4. Calculate commission
    const commissionEngine = new CommissionEngine();
    const calcResult = commissionEngine.calculate({
      grossMinor: amount,
      currency: currency,
      sellerCategory: 'merchant',
      sellerTierCode: 'free',
      productType: productType,
    });

    // 5. Create intent record in DB
    const supabase = await createServiceSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const intentService = new PaymentIntentService();
    // generate a simple idempotency key if not provided
    const idempotencyKey = body.idempotencyKey || `${Date.now()}-${user.id}`;
    
    // We need an empty set for seen idempotency keys just for in-memory checks
    const seenKeys = new Set<string>();

    const intent = intentService.create({
      currency,
      amountMinor: amount,
      payerId: user.id,
      productType: productType as any,
      idempotencyKey,
      selectedProvider,
      selectedMethodKind: result.selectedMethodKinds[0] || 'card',
      seenIdempotencyKeys: seenKeys,
      merchantId: sellerId,
      creatorId: creatorId,
    });

    // Insert intent into DB
    const { data: dbIntent, error: intentError } = await supabase
      .from('payment_intents')
      .insert({
        id: intent.id,
        payer_id: intent.payerId,
        product_type: intent.productType,
        amount_minor: intent.amountMinor,
        currency: intent.currency,
        status: intent.status,
        provider: intent.selectedProvider,
        merchant_id: intent.merchantId,
        creator_id: intent.creatorId,
        idempotency_key: intent.idempotencyKey,
      })
      .select()
      .single();

    if (intentError) throw new Error(`Intent insertion failed: ${intentError.message}`);

    // 6. Call adapter.charge()
    const registry = new ProviderRegistry();
    const adapter = registry.get(selectedProvider);
    
    const charge = await adapter.charge({
      amountMinor: amount,
      currency,
      idempotencyKey: intent.id,
      metadata: { intentId: intent.id },
    });

    if (!charge.success) {
      return NextResponse.json({ error: charge.errorMessage || 'Charge failed' }, { status: 400 });
    }

    // 7. On success: write ledger entries
    // Since payment is pending/authorized, maybe we write it upon capture?
    // Wait, requirement says "On success: write ledger entries"
    const ledger = new LedgerOrchestrator();
    const ledgerPayload = ledger.createMultiSplitTransactionPayload({
      transactionId: intent.id,
      buyerAccountId: user.id,
      sellerAccountId: sellerId || creatorId || 'tukubi_main',
      platformRevenueAccountId: 'tukubi_revenue',
      processingClearingAccountId: 'provider_clearing',
      grossMinor: amount,
      commissionMinor: calcResult.commissionMinor,
      fixedFeeMinor: calcResult.fixedFeeMinor,
      processingFeeMinor: calcResult.processingCostMinor,
      sellerNetMinor: calcResult.sellerNetMinor,
      currency,
      idempotencyKey: intent.id,
      description: `Checkout for ${productId}`,
    });

    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert(ledgerPayload.entries);

    if (ledgerError) throw new Error(`Ledger insertion failed: ${ledgerError.message}`);

    // 8. Write commission record
    const snapshot = commissionEngine.createSnapshotPayload(
      calcResult,
      intent.id,
      user.id,
      sellerId || creatorId || 'tukubi_main',
      { paymentIntentId: intent.id }
    );

    const { error: commissionError } = await supabase
      .from('commissions')
      .insert(snapshot);

    if (commissionError) throw new Error(`Commission insertion failed: ${commissionError.message}`);

    // Update intent status based on charge
    await supabase.from('payment_intents').update({ status: charge.status }).eq('id', intent.id);

    // Extract clientSecret if stripe
    let clientSecret = null;
    if (selectedProvider === 'stripe' && charge.rawResponse) {
      clientSecret = (charge.rawResponse as any).client_secret;
    } else if (selectedProvider === 'paypal' && charge.redirectUrl) {
      clientSecret = charge.redirectUrl; // return redirectUrl for PayPal
    }

    // 9. Return client secret and provider info to client
    return NextResponse.json({ 
      clientSecret, 
      intentId: intent.id, 
      provider: selectedProvider,
      transactionId: charge.providerTransactionId,
      status: charge.status
    });

  } catch (error) {
    console.error('[checkout] Error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
