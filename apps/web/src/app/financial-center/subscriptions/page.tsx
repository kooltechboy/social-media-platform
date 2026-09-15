import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import SubscriptionsManager, {
  PlatformSubscriptionItem,
  CreatorSubscriptionItem,
} from '../../../components/financial-center/subscriptions-manager';

export const dynamic = 'force-dynamic';

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // 1. Fetch Model A Platform Subscriptions
  const [platformSubsRes, tierConfigsRes, creatorSubsRes] = await Promise.all([
    supabase
      .from('commercial_subscriptions')
      .select('id, tier_id, target_type, billing_interval, price_minor, currency, status, current_period_end, cancel_at_period_end, payment_provider')
      .eq('subscriber_id', user.id),
    supabase
      .from('monetization_tier_configs')
      .select('id, name, display_name, description'),
    supabase
      .from('subscriptions')
      .select(`
        id,
        tier,
        price_minor,
        currency,
        billing_source,
        status,
        current_period_end,
        cancel_at_period_end,
        creator_accounts (
          profiles (
            username,
            display_name,
            avatar_url
          )
        ),
        creator_subscription_plans (
          name,
          description
        )
      `)
      .eq('subscriber_id', user.id),
  ]);

  const tierMap = new Map((tierConfigsRes.data ?? []).map((t: any) => [t.id, t]));

  const platformSubscriptions: PlatformSubscriptionItem[] = (platformSubsRes.data ?? []).map((s: any) => {
    const tier = tierMap.get(s.tier_id);
    return {
      id: s.id,
      tierId: s.tier_id,
      tierName: tier?.display_name || tier?.name || s.tier_id.replace(/_/g, ' ').toUpperCase(),
      tierDescription: tier?.description || undefined,
      targetType: s.target_type,
      billingInterval: s.billing_interval,
      priceMinor: Number(s.price_minor || 0),
      currency: s.currency || 'USD',
      status: s.status,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: Boolean(s.cancel_at_period_end),
      paymentProvider: s.payment_provider || 'paypal',
    };
  });

  const creatorSubscriptions: CreatorSubscriptionItem[] = (creatorSubsRes.data ?? []).map((s: any) => {
    const profile = (s.creator_accounts as any)?.profiles;
    const plan = (s.creator_subscription_plans as any);
    return {
      id: s.id,
      tier: s.tier,
      planName: plan?.name,
      planDescription: plan?.description,
      creatorName: profile?.display_name || 'Caribbean Creator',
      creatorUsername: profile?.username || 'creator',
      creatorAvatarUrl: profile?.avatar_url,
      priceMinor: Number(s.price_minor || 0),
      currency: s.currency || 'USD',
      billingSource: s.billing_source || 'paypal',
      status: s.status,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: Boolean(s.cancel_at_period_end),
    };
  });

  return (
    <div className="space-y-6">
      <SubscriptionsManager
        platformSubscriptions={platformSubscriptions}
        creatorSubscriptions={creatorSubscriptions}
      />
    </div>
  );
}
