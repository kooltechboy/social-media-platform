import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry } from '@caribbean/payments';
import { getCurrentUser, createServiceSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to subscribe.' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, tierId, returnUrl, cancelUrl } = body;

    const supabase = await createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const registry = new ProviderRegistry();
    const adapter = registry.get('paypal') as any;

    if (tierId) {
      // 1. TUKUBI Platform Subscription (Creator Pro, Seller Pro, Business+, Patron)
      const { data: tier, error } = await supabase
        .from('monetization_tier_configs')
        .select('*')
        .eq('id', tierId)
        .maybeSingle();

      if (error || !tier) {
        return NextResponse.json({ error: 'Tier configuration not found' }, { status: 404 });
      }

      if (adapter.createSubscription && adapter.isConfigured) {
        const paypalPlanId = tier.paypal_plan_id || tier.id;
        const subResult = await adapter.createSubscription({
          planId: paypalPlanId,
          subscriberId: user.id,
          subscriberEmail: user.email,
          returnUrl: returnUrl || `${request.nextUrl.origin}/financial-center/subscriptions?status=active`,
          cancelUrl: cancelUrl || `${request.nextUrl.origin}/financial-center/subscriptions?status=cancelled`,
          customId: `tukubi_${tier.id}_${user.id}`,
        });

        if (!subResult.success) {
          return NextResponse.json({ error: subResult.errorMessage || 'Failed to initialize subscription' }, { status: 400 });
        }

        // Record pending commercial subscription
        await supabase.from('commercial_subscriptions').upsert({
          subscriber_id: user.id,
          target_type: tier.account_category,
          target_id: user.id,
          tier_id: tier.id,
          billing_interval: 'monthly',
          price_minor: tier.price_minor_monthly,
          currency: tier.currency,
          status: 'trialing',
          payment_provider: 'paypal',
          provider_subscription_id: subResult.providerSubscriptionId,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        }, { onConflict: 'target_type,target_id' });

        return NextResponse.json({
          success: true,
          approvalUrl: subResult.approvalUrl,
          providerSubscriptionId: subResult.providerSubscriptionId,
        });
      }

      // Fallback if PayPal credentials not configured in environment: return clear status
      return NextResponse.json({
        success: false,
        error: 'PayPal credentials are not configured in environment. Please configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.',
        requiresConfig: true,
      }, { status: 503 });
    } else if (planId) {
      // 2. Creator Custom Fan Subscription
      const { data: plan, error } = await supabase
        .from('creator_subscription_plans')
        .select('*')
        .eq('id', planId)
        .maybeSingle();

      if (error || !plan) {
        return NextResponse.json({ error: 'Creator plan not found' }, { status: 404 });
      }

      if (adapter.createSubscription && adapter.isConfigured) {
        let paypalPlanId = plan.paypal_plan_id;
        if (!paypalPlanId && adapter.createBillingPlan) {
          const planRes = await adapter.createBillingPlan({
            name: plan.name,
            description: plan.description || 'Creator Membership on TUKUBI',
            priceMinor: plan.price_minor,
            currency: plan.currency || 'USD',
            billingInterval: plan.billing_interval || 'monthly',
          });
          if (planRes.success && planRes.providerPlanId) {
            paypalPlanId = planRes.providerPlanId;
            await supabase
              .from('creator_subscription_plans')
              .update({ paypal_plan_id: paypalPlanId })
              .eq('id', plan.id);
          }
        }

        const subResult = await adapter.createSubscription({
          planId: paypalPlanId || plan.id,
          subscriberId: user.id,
          subscriberEmail: user.email,
          returnUrl: returnUrl || `${request.nextUrl.origin}/financial-center/subscriptions?status=active`,
          cancelUrl: cancelUrl || `${request.nextUrl.origin}/financial-center/subscriptions?status=cancelled`,
          customId: `creator_${plan.id}_${user.id}`,
        });

        if (!subResult.success) {
          return NextResponse.json({ error: subResult.errorMessage || 'Failed to initialize creator subscription' }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          approvalUrl: subResult.approvalUrl,
          providerSubscriptionId: subResult.providerSubscriptionId,
        });
      }

      return NextResponse.json({
        success: false,
        error: 'PayPal credentials are not configured in environment.',
        requiresConfig: true,
      }, { status: 503 });
    }

    return NextResponse.json({ error: 'Missing tierId or planId' }, { status: 400 });
  } catch (err) {
    console.error('[subscriptions] Error:', err);
    return NextResponse.json({ error: 'Subscription initiation failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, reason = 'User requested cancellation' } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
    }

    const supabase = await createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Check in commercial_subscriptions
    const { data: commSub } = await supabase
      .from('commercial_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('subscriber_id', user.id)
      .maybeSingle();

    if (commSub) {
      if (commSub.provider_subscription_id) {
        const registry = new ProviderRegistry();
        const adapter = registry.get(commSub.payment_provider || 'paypal') as any;
        if (adapter?.cancelSubscription) {
          await adapter.cancelSubscription(commSub.provider_subscription_id, reason).catch(() => ({}));
        }
      }

      await supabase
        .from('commercial_subscriptions')
        .update({ status: 'canceled', cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId);

      return NextResponse.json({ success: true, message: 'Subscription canceled' });
    }

    // Check in creator subscriptions
    const { data: creatorSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('subscriber_id', user.id)
      .maybeSingle();

    if (creatorSub) {
      if (creatorSub.paypal_subscription_id) {
        const registry = new ProviderRegistry();
        const adapter = registry.get('paypal') as any;
        if (adapter?.cancelSubscription) {
          await adapter.cancelSubscription(creatorSub.paypal_subscription_id, reason).catch(() => ({}));
        }
      }

      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId);

      return NextResponse.json({ success: true, message: 'Creator membership canceled' });
    }

    return NextResponse.json({ error: 'Subscription not found or not authorized' }, { status: 404 });
  } catch (err) {
    console.error('[subscriptions cancel] Error:', err);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
