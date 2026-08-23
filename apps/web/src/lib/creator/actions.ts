'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { evaluatePayout, type PayoutContext } from '@caribbean/creator';

export interface PayoutActionState {
  error: string | null;
  success?: boolean;
  message?: string;
}

export async function requestPayoutAction(
  prevState: PayoutActionState,
  formData: FormData,
): Promise<PayoutActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to request a payout.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: 'Database service unavailable.' };
  }

  const idempotencyKey = formData.get('idempotencyKey') as string || crypto.randomUUID();

  // Fetch creator profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, kyc_status, risk_score')
    .eq('id', user.id)
    .maybeSingle();

  // Fetch the creator_pending and spotpay_wallet ledger accounts
  const { data: accounts } = await supabase
    .from('ledger_accounts')
    .select('id, account_type, balance')
    .eq('owner_id', user.id)
    .in('account_type', ['creator_pending', 'spotpay_wallet']);

  const creatorLedger = accounts?.find(a => a.account_type === 'creator_pending');
  let spotpayLedger = accounts?.find(a => a.account_type === 'spotpay_wallet');

  if (!creatorLedger) {
    return { error: 'No creator pending ledger account found.' };
  }

  // Use the actual materialized balance from the ledger
  const pendingBalanceMajor = Number(creatorLedger.balance);
  const pendingBalanceMinor = Math.round(pendingBalanceMajor * 100);

  const context: PayoutContext = {
    availableBalanceMinor: pendingBalanceMinor,
    pendingBalanceMinor: pendingBalanceMinor,
    payoutThresholdMinor: 5000,
    kycStatus: (profile?.kyc_status as 'verified' | 'unverified' | 'pending' | 'rejected') || 'unverified',
    fraudHold: false,
    chargebackReserveMinor: 0,
  };

  const decision = evaluatePayout(context);
  if (!decision.eligible) {
    return { error: `Payout ineligible: ${decision.reasons[0]}` };
  }

  // If no spotpay wallet exists, create it
  if (!spotpayLedger) {
    const { data: newWallet, error: createWalletErr } = await supabase
      .from('ledger_accounts')
      .insert({ owner_id: user.id, account_type: 'spotpay_wallet', currency: 'USD' })
      .select('id')
      .single();
    if (createWalletErr || !newWallet) return { error: 'Failed to initialize SpotPay wallet.' };
    spotpayLedger = { id: newWallet.id, account_type: 'spotpay_wallet', balance: 0 };
  }

  // Double-entry: Debit creator_pending and Credit spotpay_wallet
  const transactionId = crypto.randomUUID();
  const payoutAmountMajor = (decision.amountMinor / 100).toFixed(4);

  const { error: insertErr } = await supabase.from('ledger_entries').insert([
    {
      transaction_id: transactionId,
      account_id: creatorLedger.id,
      entry_type: 'DEBIT',
      amount: -Number(payoutAmountMajor),
      idempotency_key: idempotencyKey + '_debit',
      description: 'Creator Studio Monthly Payout Disbursement',
    },
    {
      transaction_id: transactionId,
      account_id: spotpayLedger.id,
      entry_type: 'CREDIT',
      amount: Number(payoutAmountMajor),
      idempotency_key: idempotencyKey + '_credit',
      description: 'Creator Studio Monthly Payout Receipt',
    }
  ]);

  if (insertErr) {
    console.error('Ledger insert error:', insertErr);
    return { error: 'Failed to process payout transaction.' };
  }

  revalidatePath('/creator-studio');
  return {
    error: null,
    success: true,
    message: `Payout of $${(decision.amountMinor / 100).toFixed(2)} USD successfully initiated to your linked SpotPay account.`,
  };
}
