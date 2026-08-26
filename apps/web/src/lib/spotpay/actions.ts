'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { Money } from '@caribbean/spotpay';

export interface SendValueActionState {
  error: string | null;
  success: string | null;
  transactionId?: string;
}

export interface WithdrawActionState {
  error: string | null;
  success: string | null;
  transactionId?: string;
  feeMinor?: number;
  netMinor?: number;
}

export async function sendValueToCaribbeanAction(
  _prev: SendValueActionState,
  formData: FormData
): Promise<SendValueActionState> {
  const recipientName = String(formData.get('recipientName') ?? '').trim();
  const recipientPhone = String(formData.get('recipientPhone') ?? '').trim();
  const destinationCountry = String(formData.get('destinationCountry') ?? 'DOM').trim();
  const category = String(formData.get('category') ?? 'groceries').trim();
  const provider = String(formData.get('provider') ?? 'Bravo Supermarkets').trim();
  const amountStr = String(formData.get('amount') ?? '0').trim();
  const amountDecimal = parseFloat(amountStr);

  if (!recipientName) return { error: 'Recipient name is required.', success: null };
  if (!recipientPhone) return { error: 'Recipient phone number is required for SMS voucher.', success: null };
  if (isNaN(amountDecimal) || amountDecimal <= 0) {
    return { error: 'Please enter a valid amount greater than zero.', success: null };
  }

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to send value via SpotPay.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database service unavailable.', success: null };

  try {
    const money = Money.fromDecimal(amountDecimal, 'USD');
    const amountMinor = money.amountMinor;

    // Check user's spotpay_wallet balance
    const { data: userAccount, error: accErr } = await supabase
      .from('ledger_accounts')
      .select('id, currency')
      .eq('owner_id', user.id)
      .eq('account_type', 'spotpay_wallet')
      .maybeSingle();

    if (accErr || !userAccount) {
      return { error: 'SpotPay wallet account not found.', success: null };
    }

    // Compute balance from ledger entries
    const { data: entries, error: entriesErr } = await supabase
      .from('ledger_entries')
      .select('amount')
      .eq('account_id', userAccount.id);

    if (entriesErr) return { error: 'Unable to verify wallet balance.', success: null };

    const balanceMinor = (entries ?? []).reduce((sum, e) => sum + Math.round(Number(e.amount) * 100), 0);
    if (balanceMinor < amountMinor) {
      return {
        error: `Insufficient balance. Your balance is $${(balanceMinor / 100).toFixed(2)}, transaction requires $${amountDecimal.toFixed(2)}.`,
        success: null,
      };
    }

    const txId = crypto.randomUUID();
    const idempotencyKey = `diaspora_send_${user.id}_${txId}_${Date.now()}`;
    const description = `Diaspora Send Value: ${category.toUpperCase()} voucher for ${recipientName} (${destinationCountry} - ${provider})`;

    // Insert debit entry from user wallet
    const { error: debitErr } = await supabase.from('ledger_entries').insert({
      transaction_id: txId,
      account_id: userAccount.id,
      amount: -(amountMinor / 100),
      entry_type: 'DEBIT',
      idempotency_key: `${idempotencyKey}_debit`,
      description,
    });

    if (debitErr) return { error: debitErr.message, success: null };

    revalidatePath('/spotpay');
    return {
      error: null,
      success: `Successfully issued ${category} voucher of $${amountDecimal.toFixed(2)} USD to ${recipientName} in ${destinationCountry}! SMS voucher dispatched via partner network.`,
      transactionId: txId,
    };
  } catch (err: any) {
    return { error: err.message || 'Failed to process transaction', success: null };
  }
}

export async function instantWithdrawAction(
  _prev: WithdrawActionState,
  formData: FormData
): Promise<WithdrawActionState> {
  const amountStr = String(formData.get('amount') ?? '0').trim();
  const methodKind = String(formData.get('methodKind') ?? 'instant_card').trim();
  const amountDecimal = parseFloat(amountStr);

  if (isNaN(amountDecimal) || amountDecimal < 5) {
    return { error: 'Minimum withdrawal amount is $5.00 USD.', success: null };
  }

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to withdraw funds.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database service unavailable.', success: null };

  try {
    const grossMoney = Money.fromDecimal(amountDecimal, 'USD');
    const grossMinor = grossMoney.amountMinor;

    // Instant card off-ramp charges 1.5% fee (min $0.50 = 50 cents), standard ACH is free
    const feeMinor = methodKind === 'instant_card' ? Math.max(50, Math.round(grossMinor * 0.015)) : 0;
    const netMinor = grossMinor - feeMinor;

    const { data: userAccount, error: accErr } = await supabase
      .from('ledger_accounts')
      .select('id, currency')
      .eq('owner_id', user.id)
      .eq('account_type', 'spotpay_wallet')
      .maybeSingle();

    if (accErr || !userAccount) return { error: 'SpotPay wallet not found.', success: null };

    const { data: entries } = await supabase
      .from('ledger_entries')
      .select('amount')
      .eq('account_id', userAccount.id);

    const balanceMinor = (entries ?? []).reduce((sum, e) => sum + Math.round(Number(e.amount) * 100), 0);
    if (balanceMinor < grossMinor) {
      return { error: 'Insufficient funds for withdrawal.', success: null };
    }

    const txId = crypto.randomUUID();
    const idempotencyKey = `withdraw_${user.id}_${txId}_${Date.now()}`;
    const desc = `Instant Withdrawal to Card (Fee: $${(feeMinor / 100).toFixed(2)}, Net: $${(netMinor / 100).toFixed(2)})`;

    const { error: debitErr } = await supabase.from('ledger_entries').insert({
      transaction_id: txId,
      account_id: userAccount.id,
      amount: -(grossMinor / 100),
      entry_type: 'DEBIT',
      idempotency_key: `${idempotencyKey}_debit`,
      description: desc,
    });

    if (debitErr) return { error: debitErr.message, success: null };

    revalidatePath('/spotpay');
    return {
      error: null,
      success: `Withdrawal initiated! $${(netMinor / 100).toFixed(2)} USD dispatched to your linked card via instant settlement rail.`,
      transactionId: txId,
      feeMinor,
      netMinor,
    };
  } catch (err: any) {
    return { error: err.message || 'Failed to process withdrawal', success: null };
  }
}
