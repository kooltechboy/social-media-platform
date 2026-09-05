import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry } from '@caribbean/payments';
import { createServiceSupabaseClient } from '@/lib/supabase/server';


export async function POST(request: NextRequest) {
  try {
    const { token, intentId } = await request.json(); // orderId from PayPal redirect
    if (!token || !intentId) {
      return NextResponse.json({ error: 'Missing token or intentId' }, { status: 400 });
    }

    const registry = new ProviderRegistry();
    const adapter = registry.get('paypal') as any; // Assuming it's our PayPalAdapter

    // Call paypal API: POST /v2/checkout/orders/{token}/capture
    const captureResult = await adapter.captureOrder(token);

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Capture failed or not completed' }, { status: 400 });
    }

    const supabase = await createServiceSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    // Update payment_intents status to 'succeeded'
    const { error: updateError } = await supabase
      .from('payment_intents')
      .update({ status: 'succeeded' })
      .eq('id', intentId);

    if (updateError) {
      console.error('[paypal capture] Failed to update intent status:', updateError);
    }

    // Ledger entries are created at checkout in this flow, but if we need to mark them as settled:
    // (This matches the checkout pattern requirements)

    return NextResponse.json({ success: true, captureId: captureResult.id });
  } catch (error) {
    console.error('[paypal capture] Error:', error);
    return NextResponse.json({ error: 'Capture failed' }, { status: 500 });
  }
}
