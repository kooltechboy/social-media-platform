'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { sumLedgerMinorUnits } from '@caribbean/payments';

export interface CreatorActionResponse {
  success: boolean;
  error?: string | null;
  planId?: string;
  payoutId?: string;
  transactionId?: string;
  subscriptionId?: string;
}

export interface TipCreatorInput {
  creatorId?: string;
  creatorHandle?: string;
  amountMinor: number;
  currency?: string;
  message?: string;
  isAnonymous?: boolean;
  idempotencyKey?: string;
}

export interface SubscribeToPlanInput {
  planId: string;
  idempotencyKey?: string;
}

export async function tipCreatorAction(input: TipCreatorInput): Promise<CreatorActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to tip creators.' };

  const { amountMinor, currency = 'USD', message = '', isAnonymous = false } = input;

  if (!Number.isInteger(amountMinor) || amountMinor < 100) {
    return { success: false, error: 'Minimum tip amount is $1.00 (100 cents).' };
  }

  if (amountMinor > 100_000_000) {
    return { success: false, error: 'Tip amount exceeds allowable limit.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  // 1. Resolve Creator Profile ID
  let targetCreatorId = input.creatorId;
  if (!targetCreatorId && input.creatorHandle) {
    const cleanHandle = input.creatorHandle.replace(/^@/, '').trim();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanHandle)
      .maybeSingle();

    if (profile) {
      targetCreatorId = profile.id;
    }
  }

  if (!targetCreatorId) {
    return { success: false, error: 'Creator not found.' };
  }

  if (targetCreatorId === user.id) {
    return { success: false, error: 'You cannot tip yourself.' };
  }

  // 2. Fee Calculation (5% platform fee, 95% net to creator)
  const platformFeeMinor = Math.round(amountMinor * 0.05);
  const netAmountMinor = amountMinor - platformFeeMinor;
  const idempotencyKey = input.idempotencyKey || `tip_${user.id}_${targetCreatorId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 3. Insert into payment_transactions
  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .insert({
      idempotency_key: idempotencyKey,
      transaction_type: 'CREATOR_TIP',
      status: 'COMPLETED',
      payer_id: user.id,
      recipient_id: targetCreatorId,
      creator_id: targetCreatorId,
      gross_amount_minor: amountMinor,
      platform_fee_minor: platformFeeMinor,
      net_amount_minor: netAmountMinor,
      currency: currency.toUpperCase(),
      settled_at: new Date().toISOString(),
      metadata: {
        message: message.trim() || null,
        is_anonymous: Boolean(isAnonymous),
      },
    })
    .select('id')
    .single();

  if (txError || !transaction) {
    return { success: false, error: txError?.message || 'Failed to record tip transaction.' };
  }

  // 4. Ensure Creator Ledger Account exists
  let creatorAccountId: string | null = null;
  const { data: existingCreatorLedger } = await supabase
    .from('ledger_accounts')
    .select('id')
    .eq('owner_id', targetCreatorId)
    .eq('account_type', 'creator_pending')
    .maybeSingle();

  if (existingCreatorLedger) {
    creatorAccountId = existingCreatorLedger.id;
  } else {
    const { data: newCreatorLedger } = await supabase
      .from('ledger_accounts')
      .insert({
        owner_id: targetCreatorId,
        account_type: 'creator_pending',
        currency: currency.toUpperCase(),
      })
      .select('id')
      .single();
    if (newCreatorLedger) {
      creatorAccountId = newCreatorLedger.id;
    }
  }

  // 5. Ensure Payer Ledger Account exists
  let payerAccountId: string | null = null;
  const { data: existingPayerLedger } = await supabase
    .from('ledger_accounts')
    .select('id')
    .eq('owner_id', user.id)
    .eq('account_type', 'Payments_wallet')
    .maybeSingle();

  if (existingPayerLedger) {
    payerAccountId = existingPayerLedger.id;
  } else {
    const { data: newPayerLedger } = await supabase
      .from('ledger_accounts')
      .insert({
        owner_id: user.id,
        account_type: 'Payments_wallet',
        currency: currency.toUpperCase(),
      })
      .select('id')
      .single();
    if (newPayerLedger) {
      payerAccountId = newPayerLedger.id;
    }
  }

  // 6. Record paired double-entry ledger entries (Debits + Credits = 0)
  if (creatorAccountId && payerAccountId) {
    await supabase.from('ledger_entries').insert([
      {
        transaction_id: transaction.id,
        account_id: creatorAccountId,
        amount: netAmountMinor, // Positive Credit to creator
        entry_type: 'CREDIT',
        idempotency_key: `${idempotencyKey}_creator_credit`,
        description: `Direct creator tip from fan: ${isAnonymous ? 'Anonymous' : user.id}`,
      },
      {
        transaction_id: transaction.id,
        account_id: payerAccountId,
        amount: -amountMinor, // Negative Debit to payer
        entry_type: 'DEBIT',
        idempotency_key: `${idempotencyKey}_payer_debit`,
        description: `Tip sent to creator ${targetCreatorId}`,
      },
    ]);
  }

  revalidatePath('/creator-studio/monetization');
  revalidatePath('/financial-center');

  return {
    success: true,
    transactionId: transaction.id,
  };
}

export async function subscribeToCreatorPlanAction(input: SubscribeToPlanInput): Promise<CreatorActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to subscribe to creator memberships.' };

  const { planId } = input;
  if (!planId) return { success: false, error: 'Subscription plan ID is required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  // 1. Fetch active subscription plan
  const { data: plan, error: planErr } = await supabase
    .from('creator_subscription_plans')
    .select('id, creator_id, name, price_minor, currency, billing_interval, is_active')
    .eq('id', planId)
    .maybeSingle();

  if (planErr || !plan) {
    return { success: false, error: 'Subscription plan not found.' };
  }

  if (!plan.is_active) {
    return { success: false, error: 'This subscription tier is currently paused or inactive.' };
  }

  if (plan.creator_id === user.id) {
    return { success: false, error: 'You cannot subscribe to your own creator plan.' };
  }

  // 2. Resolve creator account
  const { data: creatorAcc } = await supabase
    .from('creator_accounts')
    .select('id')
    .eq('profile_id', plan.creator_id)
    .maybeSingle();

  const creatorAccountId = creatorAcc?.id || null;

  // 3. Upsert into subscriptions table
  const durationDays = plan.billing_interval === 'annual' ? 365 : 30;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + durationDays * 86400000);

  const { data: subscription, error: subErr } = await supabase
    .from('subscriptions')
    .insert({
      subscriber_id: user.id,
      creator_account_id: creatorAccountId,
      creator_subscription_plan_id: plan.id,
      tier: plan.name,
      price_minor: plan.price_minor,
      currency: plan.currency || 'USD',
      billing_source: 'card',
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .select('id')
    .single();

  if (subErr || !subscription) {
    return { success: false, error: subErr?.message || 'Failed to create fan subscription.' };
  }

  // 4. Record transaction in payment_transactions
  const idempotencyKey = input.idempotencyKey || `sub_${user.id}_${plan.id}_${Date.now()}`;
  const platformFeeMinor = Math.round(plan.price_minor * 0.05);
  const netAmountMinor = plan.price_minor - platformFeeMinor;

  const { data: transaction } = await supabase
    .from('payment_transactions')
    .insert({
      idempotency_key: idempotencyKey,
      transaction_type: 'CREATOR_SUBSCRIPTION',
      status: 'COMPLETED',
      payer_id: user.id,
      recipient_id: plan.creator_id,
      creator_id: plan.creator_id,
      gross_amount_minor: plan.price_minor,
      platform_fee_minor: platformFeeMinor,
      net_amount_minor: netAmountMinor,
      currency: plan.currency || 'USD',
      settled_at: now.toISOString(),
      metadata: {
        plan_id: plan.id,
        plan_name: plan.name,
      },
    })
    .select('id')
    .single();

  // 5. Create double-entry ledger records
  const { data: creatorLedger } = await supabase
    .from('ledger_accounts')
    .select('id')
    .eq('owner_id', plan.creator_id)
    .eq('account_type', 'creator_pending')
    .maybeSingle();

  const { data: payerLedger } = await supabase
    .from('ledger_accounts')
    .select('id')
    .eq('owner_id', user.id)
    .eq('account_type', 'Payments_wallet')
    .maybeSingle();

  if (transaction && creatorLedger && payerLedger) {
    await supabase.from('ledger_entries').insert([
      {
        transaction_id: transaction.id,
        account_id: creatorLedger.id,
        amount: netAmountMinor,
        entry_type: 'CREDIT',
        idempotency_key: `${idempotencyKey}_creator_credit`,
        description: `Fan subscription payment for ${plan.name}`,
      },
      {
        transaction_id: transaction.id,
        account_id: payerLedger.id,
        amount: -plan.price_minor,
        entry_type: 'DEBIT',
        idempotency_key: `${idempotencyKey}_payer_debit`,
        description: `Subscription fee for ${plan.name}`,
      },
    ]);
  }

  revalidatePath('/creator-studio/monetization');
  revalidatePath('/financial-center/subscriptions');

  return {
    success: true,
    subscriptionId: subscription.id,
  };
}

export async function cancelCreatorSubscriptionAction(subscriptionId: string): Promise<CreatorActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to cancel subscriptions.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscriptionId)
    .eq('subscriber_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/financial-center/subscriptions');
  return { success: true };
}

export async function createCreatorPlanAction(formData: FormData): Promise<CreatorActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to create subscription plans.' };

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priceRaw = String(formData.get('price') ?? '0').trim();
  const billingInterval = String(formData.get('billingInterval') ?? 'monthly').trim();
  const benefitsRaw = String(formData.get('benefits') ?? '').trim();

  if (!name) return { success: false, error: 'Plan name is required.' };

  const priceFloat = parseFloat(priceRaw);
  if (isNaN(priceFloat) || priceFloat <= 0) {
    return { success: false, error: 'Price must be greater than $0.00' };
  }
  const priceMinor = Math.round(priceFloat * 100);

  if (!['monthly', 'annual'].includes(billingInterval)) {
    return { success: false, error: 'Billing interval must be monthly or annual.' };
  }

  const benefits = benefitsRaw
    ? benefitsRaw.split('\n').map((b) => b.trim()).filter(Boolean)
    : [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  // 1. Verify or auto-enable creator monetization
  const { data: creatorAcc } = await supabase
    .from('creator_accounts')
    .select('id, is_verified, monetization_enabled')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!creatorAcc) {
    return { success: false, error: 'Creator account not found. Please activate Creator Hub first.' };
  }

  if (!creatorAcc.monetization_enabled) {
    await supabase
      .from('creator_accounts')
      .update({ monetization_enabled: true })
      .eq('id', creatorAcc.id);
  }

  // 2. Insert creator plan
  const { data: newPlan, error: insertErr } = await supabase
    .from('creator_subscription_plans')
    .insert({
      creator_id: user.id,
      name,
      description: description || null,
      price_minor: priceMinor,
      currency: 'USD',
      billing_interval: billingInterval,
      benefits,
      is_active: true,
    })
    .select('id')
    .single();

  if (insertErr || !newPlan) {
    return { success: false, error: insertErr?.message || 'Failed to create plan.' };
  }

  revalidatePath('/creator-studio/monetization');
  revalidatePath('/creator-studio');
  revalidatePath('/creator-hub');

  return { success: true, planId: newPlan.id };
}

export async function toggleCreatorPlanStatusAction(planId: string, isActive: boolean): Promise<CreatorActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('creator_subscription_plans')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('creator_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/creator-studio/monetization');
  return { success: true };
}

export async function requestCreatorPayoutAction(formData: FormData): Promise<CreatorActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to request a payout.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  // 1. Fetch creator account & KYC verification status
  const { data: creatorAcc } = await supabase
    .from('creator_accounts')
    .select('id, kyc_status, is_verified, payout_threshold_minor')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!creatorAcc) {
    return { success: false, error: 'Creator account not found.' };
  }

  if (creatorAcc.kyc_status !== 'verified') {
    return {
      success: false,
      error: 'Identity verification (KYC) required before requesting payouts. Please complete verification in Settings.',
    };
  }

  // 2. Fetch verified pending ledger balance
  const { data: ledgerAcc } = await supabase
    .from('ledger_accounts')
    .select('id, currency')
    .eq('owner_id', user.id)
    .eq('account_type', 'creator_pending')
    .maybeSingle();

  if (!ledgerAcc) {
    return { success: false, error: 'No creator earnings ledger found.' };
  }

  const { data: entries } = await supabase
    .from('ledger_entries')
    .select('amount, entry_type')
    .eq('account_id', ledgerAcc.id);

  const availableMinor = sumLedgerMinorUnits(entries ?? []);
  const thresholdMinor = creatorAcc.payout_threshold_minor || 5000;

  if (availableMinor < thresholdMinor) {
    return {
      success: false,
      error: `Available balance ($${(availableMinor / 100).toFixed(2)}) is below the minimum threshold ($${(thresholdMinor / 100).toFixed(2)}).`,
    };
  }

  // 3. Queue payout
  const idempotencyKey = `payout_${user.id}_${Date.now()}`;
  const { data: payout, error: payoutErr } = await supabase
    .from('payouts')
    .insert({
      creator_account_id: creatorAcc.id,
      amount_minor: availableMinor,
      currency: ledgerAcc.currency || 'USD',
      provider: 'paypal',
      state: 'queued',
      idempotency_key: idempotencyKey,
    })
    .select('id')
    .single();

  if (payoutErr) {
    return { success: false, error: payoutErr.message };
  }

  revalidatePath('/creator-studio/monetization');
  revalidatePath('/financial-center/creator');

  return { success: true, payoutId: payout.id };
}
