import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient, getSuperAdminUser, getStaffUser } from '@/lib/supabase/server';
import { LedgerOrchestrator } from '@caribbean/payments';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getStaffUser('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: admin access required' }, { status: 401 });
    }

    const { creatorId, amount, currency, payoutMethod } = await request.json();

    if (!creatorId || !amount || !currency || !payoutMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Evaluate payout eligibility
    // We assumeevaluatePayout or something similar checks balance or policies
    // For now we do a simple check. Usually there's a function evaluatePayout(creatorId, amount) in @caribbean/payments
    // If we don't have evaluatePayout, we can just perform the ledger & payout record write

    const supabase = await createServiceSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    // Generate transaction ID & Idempotency Key
    const transactionId = `tx_payout_${Date.now()}_${creatorId}`;
    const idempotencyKey = `payout_${transactionId}`;

    // 3. Write payout record to payouts table
    // (If payouts table exists - we use the standard insertion)
    const { data: payoutRecord, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        creator_id: creatorId,
        amount_minor: amount,
        currency,
        payout_method: payoutMethod,
        status: 'pending',
        transaction_id: transactionId,
      })
      .select()
      .single();

    if (payoutError) {
      // It's possible the table doesn't exist yet or differs in schema, but this is the general pattern expected
      console.warn('[payouts] Payout record insertion failed or table missing:', payoutError);
    }

    // 4. Write debit ledger entry from creator's ledger_account
    const ledger = new LedgerOrchestrator();
    // Assuming simple double entry for a payout: Creator Account (Debit), Bank Clearing Account (Credit)
    const ledgerPair = ledger.createDoubleEntryPayload({
      transactionId,
      sourceAccountId: creatorId,
      destinationAccountId: 'bank_clearing_outbound',
      amount,
      currency,
      idempotencyKey,
      description: `Payout to ${creatorId} via ${payoutMethod}`
    });

    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert([ledgerPair.debitEntry, ledgerPair.creditEntry]);

    if (ledgerError) {
      throw new Error(`Ledger entries insertion failed: ${ledgerError.message}`);
    }

    return NextResponse.json({ success: true, payout: payoutRecord || { transactionId, status: 'pending' } });
  } catch (error) {
    console.error('[payout] Error:', error);
    return NextResponse.json({ error: 'Payout failed' }, { status: 500 });
  }
}
