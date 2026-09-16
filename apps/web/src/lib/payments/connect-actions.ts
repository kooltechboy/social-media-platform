'use server';

import { StripeAdapter } from '@caribbean/payments';
import { getCurrentUser, createSupabaseServerClient } from '../supabase/server';

export interface ConnectOnboardingResult {
  success: boolean;
  onboardingUrl?: string;
  error?: string;
}

export interface PayoutStatusResult {
  connected: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  accountId?: string;
  error?: string;
}

/**
 * Initiates Stripe Connect Express onboarding for Caribbean merchants and creators.
 * Returns a hosted Stripe onboarding link to complete KYC and bank/debit payout setup.
 */
export async function createStripeConnectOnboardingAction(params?: {
  countryCode?: string; // 2-letter ISO, e.g. 'JM', 'TT', 'US'
  refreshPath?: string;
  returnPath?: string;
}): Promise<ConnectOnboardingResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable' };

  const adapter = new StripeAdapter();
  if (!adapter.isConfigured) {
    return {
      success: false,
      error: 'Stripe Connect is currently awaiting production API credentials. Direct bank/wire settlement is available via Support.',
    };
  }

  // Check if profile already has a stripe_connect_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, stripe_connect_id, country_code')
    .eq('id', user.id)
    .single();

  let connectAccountId = profile?.stripe_connect_id;

  if (!connectAccountId) {
    const country = params?.countryCode || profile?.country_code || 'US';
    const createRes = await adapter.createConnectAccount({
      email: profile?.email || user.email || '',
      country,
      metadata: {
        tukubi_user_id: user.id,
      },
    });

    if (!createRes.success || !createRes.accountId) {
      return { success: false, error: createRes.errorMessage || 'Failed to initialize payout account' };
    }

    connectAccountId = createRes.accountId;

    // Persist connect account ID to profile
    await supabase
      .from('profiles')
      .update({ stripe_connect_id: connectAccountId })
      .eq('id', user.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tukubi.com';
  const refreshUrl = `${baseUrl}${params?.refreshPath || '/financial-center/merchant'}`;
  const returnUrl = `${baseUrl}${params?.returnPath || '/financial-center/merchant?payout_setup=success'}`;

  const linkRes = await adapter.createAccountLink({
    accountId: connectAccountId,
    refreshUrl,
    returnUrl,
  });

  if (!linkRes.success || !linkRes.url) {
    return { success: false, error: linkRes.errorMessage || 'Failed to generate onboarding session' };
  }

  return { success: true, onboardingUrl: linkRes.url };
}

/**
 * Retrieves the live payout status for the authenticated user's merchant/creator account.
 */
export async function getMerchantPayoutStatusAction(): Promise<PayoutStatusResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { connected: false, payoutsEnabled: false, chargesEnabled: false, detailsSubmitted: false, error: 'Unauthorized' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { connected: false, payoutsEnabled: false, chargesEnabled: false, detailsSubmitted: false, error: 'Service unavailable' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_connect_id) {
    return { connected: false, payoutsEnabled: false, chargesEnabled: false, detailsSubmitted: false };
  }

  const adapter = new StripeAdapter();
  if (!adapter.isConfigured) {
    // When credentials aren't configured yet, report account linked but pending verification
    return {
      connected: true,
      payoutsEnabled: false,
      chargesEnabled: false,
      detailsSubmitted: true,
      accountId: profile.stripe_connect_id,
    };
  }

  const status = await adapter.getAccountStatus(profile.stripe_connect_id);
  if (!status.success) {
    return {
      connected: true,
      payoutsEnabled: false,
      chargesEnabled: false,
      detailsSubmitted: false,
      accountId: profile.stripe_connect_id,
      error: status.errorMessage,
    };
  }

  return {
    connected: true,
    payoutsEnabled: Boolean(status.payoutsEnabled),
    chargesEnabled: Boolean(status.chargesEnabled),
    detailsSubmitted: Boolean(status.detailsSubmitted),
    accountId: profile.stripe_connect_id,
  };
}
