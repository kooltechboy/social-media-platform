'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface PayoutActionState {
  error: string | null;
  success?: boolean;
  message?: string;
}

export async function setupCreatorAccountAction() {
  const user = await getCurrentUser();
  if (!user) return { error: 'You must be signed in.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database service unavailable.' };

  const { error } = await supabase.from('creator_accounts').upsert(
    { profile_id: user.id, kyc_status: 'unverified', payout_threshold_minor: 5000 },
    { onConflict: 'profile_id' },
  );

  if (error) return { error: error.message || 'Failed to set up creator account' };
  redirect('/creator-studio');
}

export async function requestPayoutAction(
  _prevState: PayoutActionState,
  _formData: FormData,
): Promise<PayoutActionState> {
  return {
    error: 'Payouts are unavailable until a verified payment provider is configured.',
  };
}

export async function sendTipAction(
  _creatorHandle: string,
  _amountMinor: number,
  _note: string,
) {
  return { error: 'Tips are unavailable until a verified payment provider is configured.' };
}
