'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { sumLedgerMinorUnits } from '@caribbean/payments';

export interface CreatorActionResponse {
  success: boolean;
  error?: string | null;
  planId?: string;
  payoutId?: string;
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
