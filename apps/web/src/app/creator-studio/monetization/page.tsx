import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Users,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { Money, sumLedgerMinorUnits, getCreatorLaunchMessaging } from '@caribbean/payments';
import CreatePlanModal from '@/components/creator/create-plan-modal';
import { PayoutRequestButton } from '@/components/payout-request-button';

export const dynamic = 'force-dynamic';

export default async function CreatorMonetizationPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/creator-studio/monetization');

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login?next=/creator-studio/monetization');

  // Fetch creator account
  const { data: creatorAccount } = await supabase
    .from('creator_accounts')
    .select('id, kyc_status, is_verified, payout_threshold_minor, monetization_enabled')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!creatorAccount) {
    return (
      <div className="p-8 text-center bg-brand-dusk/60 border border-slate-800 rounded-3xl space-y-4 max-w-lg mx-auto mt-12">
        <Sparkles className="w-10 h-10 text-brand-goldenHour mx-auto" />
        <h2 className="text-xl font-black text-white">Enable Creator Monetization</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Activate your creator profile to launch recurring fan subscriptions, accept live tipping, and disburse verified earnings.
        </p>
        <Link
          href="/creator-studio"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-sunriseCoral text-slate-950 font-black text-xs hover:opacity-90 transition-opacity"
        >
          Open Creator Studio →
        </Link>
      </div>
    );
  }

  // Parallel load creator monetization ecosystem
  const [plansRes, subsRes, ledgerRes, txsRes, payoutsRes] = await Promise.all([
    supabase
      .from('creator_subscription_plans')
      .select('*')
      .eq('creator_id', user.id)
      .order('price_minor', { ascending: true }),
    supabase
      .from('subscriptions')
      .select('id, tier, price_minor, currency, status, current_period_end, subscriber:profiles!subscriber_id(username, display_name)')
      .eq('creator_account_id', creatorAccount.id),
    supabase
      .from('ledger_accounts')
      .select('id, currency')
      .eq('owner_id', user.id)
      .eq('account_type', 'creator_pending')
      .maybeSingle(),
    supabase
      .from('payment_transactions')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('payouts')
      .select('*')
      .eq('creator_account_id', creatorAccount.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const plans = plansRes.data ?? [];
  const subs = subsRes.data ?? [];
  const activeSubs = subs.filter((s) => s.status === 'active');
  const ledgerAcc = ledgerRes.data;
  const recentTxs = txsRes.data ?? [];
  const payouts = payoutsRes.data ?? [];

  // Compute available balance from ledger entries
  let availableBalanceMinor = 0;
  if (ledgerAcc) {
    const { data: entries } = await supabase
      .from('ledger_entries')
      .select('amount')
      .eq('account_id', ledgerAcc.id);

    const total = sumLedgerMinorUnits(entries ?? []);
    availableBalanceMinor = Math.max(0, total);
  }

  const monthlyRunRateMinor = activeSubs.reduce((sum, s) => sum + s.price_minor, 0);
  const lifetimeEarningsMinor = recentTxs
    .filter((tx) => tx.status === 'COMPLETED')
    .reduce((sum, tx) => sum + tx.net_amount_minor, 0);

  const availableMoney = new Money(availableBalanceMinor, 'USD');
  const runRateMoney = new Money(monthlyRunRateMinor, 'USD');
  const lifetimeMoney = new Money(lifetimeEarningsMinor, 'USD');
  const thresholdMinor = creatorAccount.payout_threshold_minor || 5000;
  const thresholdMoney = new Money(thresholdMinor, 'USD');

  const launchMessaging = getCreatorLaunchMessaging();

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Creator Monetization Hub</h1>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              Production Financial Rail
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage custom fan membership tiers, monitor recurring subscriber revenue, and track verified disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CreatePlanModal />
        </div>
      </div>

      {/* Metrics Row (Strict Database-Driven, No Synthetic Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Available for Payout
          </span>
          <div className="text-2xl font-black text-white">{availableMoney.format()}</div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Double-entry verified
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Monthly Fan Revenue (MRR)
          </span>
          <div className="text-2xl font-black text-emerald-400">{runRateMoney.format()}</div>
          <p className="text-[11px] text-slate-400">{activeSubs.length} active subscriber{activeSubs.length === 1 ? '' : 's'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Active Subscription Tiers
          </span>
          <div className="text-2xl font-black text-brand-goldenHour">{plans.length}</div>
          <p className="text-[11px] text-slate-400">Custom creator tiers</p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Disbursement Threshold
          </span>
          <div className="text-2xl font-black text-white">{thresholdMoney.format()}</div>
          <p className="text-[11px] text-slate-400">
            KYC: <strong className="capitalize text-slate-300">{creatorAccount.kyc_status}</strong>
          </p>
        </div>
      </div>

      {/* Subscription Tiers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white">Your Creator Subscription Tiers</h2>
            <p className="text-xs text-slate-400">Recurring membership packages available to your followers.</p>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="p-8 text-center bg-brand-dusk/40 border border-slate-800/80 rounded-2xl space-y-3">
            <Layers className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Subscription Tiers Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first subscription tier to let fans support your content with recurring monthly patronages.
            </p>
            <div className="pt-2">
              <CreatePlanModal />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p: any) => {
              const planMoney = new Money(p.price_minor, p.currency || 'USD');
              const tierSubs = activeSubs.filter((s) => s.tier === p.id || s.price_minor === p.price_minor);

              return (
                <div key={p.id} className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-black text-white">{p.name}</h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {p.is_active ? 'Active' : 'Archived'}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>}
                    <div className="text-xl font-black text-brand-sunriseCoral">
                      {planMoney.format()} <span className="text-xs text-slate-400 font-normal">/ {p.billing_interval}</span>
                    </div>

                    {p.benefits && Array.isArray(p.benefits) && p.benefits.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perks Included:</span>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          {p.benefits.map((b: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span>{tierSubs.length} active subscriber{tierSubs.length === 1 ? '' : 's'}</span>
                    <span className="text-[11px] text-brand-goldenHour font-bold">
                      ${((tierSubs.length * p.price_minor) / 100).toFixed(2)}/mo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Layout: Subscribers & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Subscribers */}
        <div className="p-6 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Active Subscribers</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">{activeSubs.length} Total</span>
          </div>

          {activeSubs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No active fan memberships yet. Once fans subscribe, they will appear here.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 overflow-hidden">
              {activeSubs.slice(0, 8).map((s: any) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">@{s.subscriber?.username || 'supporter'}</span>
                    <span className="text-[10px] text-slate-400 block">Renews: {new Date(s.current_period_end).toLocaleDateString()}</span>
                  </div>
                  <span className="font-bold text-emerald-400">${(s.price_minor / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Monetization Transactions */}
        <div className="p-6 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Recent Transactions &amp; Tips</span>
            </h2>
            <Link href="/financial-center/transactions" className="text-xs text-brand-sunriseCoral hover:underline">
              View All →
            </Link>
          </div>

          {recentTxs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No completed monetization transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentTxs.map((tx: any) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white capitalize">{tx.transaction_type.replace('_', ' ').toLowerCase()}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">+${(tx.net_amount_minor / 100).toFixed(2)}</div>
                    <span className="text-[10px] text-slate-400 capitalize">{tx.status.toLowerCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
