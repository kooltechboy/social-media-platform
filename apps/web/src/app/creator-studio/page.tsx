import React from 'react';
import { redirect } from 'next/navigation';
import { Radio, Video, Mic, DollarSign, Users, TrendingUp, BarChart2, Plus } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { applyFees, evaluatePayout, isSubscriptionActive } from '@caribbean/creator';
import { Money } from '@caribbean/spotpay';
import BecomeCreatorClientButton from '../../components/become-creator-button';

export const dynamic = 'force-dynamic';

interface CreatorAccount {
  id: string;
  category: string | null;
  is_verified: boolean;
  kyc_status: string;
  payout_threshold_minor: number;
  created_at: string;
}

interface SubscriptionRow {
  tier: string;
  status: string;
  current_period_end: string;
  price_minor: number;
  currency: string;
}

interface VideoRow {
  id: string;
  title: string;
  video_kind: string;
  view_count: number;
  created_at: string;
}

interface PodcastRow {
  id: string;
  title: string;
  follower_count: number;
  podcast_episodes: Array<{ id: string }>;
}

interface LedgerEntry {
  amount: number;
  entry_type: 'DEBIT' | 'CREDIT';
}

interface LedgerAccount {
  id: string;
  account_type: string;
  currency: string;
}

export default async function CreatorStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login');

  // Load creator account
  const { data: creatorAccount } = await supabase
    .from('creator_accounts')
    .select('id, category, is_verified, kyc_status, payout_threshold_minor, created_at')
    .eq('profile_id', user.id)
    .maybeSingle();

  const account = creatorAccount as CreatorAccount | null;

  // If no creator account, show onboarding
  if (!account) {
    return <CreatorOnboarding userId={user.id} displayName={user.displayName} />;
  }

  // Load all creator data in parallel
  const [subscriptionsResult, videosResult, podcastsResult, ledgerAccountResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('tier, status, current_period_end, price_minor, currency')
      .eq('creator_account_id', account.id),
    supabase
      .from('videos')
      .select('id, title, video_kind, view_count, created_at')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('podcasts')
      .select('id, title, follower_count, podcast_episodes(id)')
      .eq('creator_id', user.id),
    supabase
      .from('ledger_accounts')
      .select('id, account_type, currency')
      .eq('owner_id', user.id)
      .eq('account_type', 'creator_pending')
      .maybeSingle(),
  ]);

  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
  const videos = (videosResult.data ?? []) as VideoRow[];
  const podcasts = (podcastsResult.data ?? []) as unknown as PodcastRow[];
  const ledgerAccount = ledgerAccountResult.data as LedgerAccount | null;

  // Compute active subscription count and monthly revenue
  const activeSubscriptions = subscriptions.filter((s) =>
    isSubscriptionActive({ status: s.status as 'active' | 'cancelled' | 'expired' | 'grace', current_period_end: s.current_period_end }),
  );
  const grossMonthlyMinor = activeSubscriptions.reduce((sum, s) => sum + s.price_minor, 0);
  const feeResult = grossMonthlyMinor > 0 ? applyFees({ grossAmountMinor: grossMonthlyMinor, currency: 'USD', platformFeeBps: 1500, paymentProviderFeeBps: 290 }) : null;

  // Compute creator pending balance
  let pendingBalanceMinor = 0;
  if (ledgerAccount) {
    const { data: entries } = await supabase
      .from('ledger_entries')
      .select('amount, entry_type')
      .eq('account_id', ledgerAccount.id);
    for (const entry of (entries ?? []) as LedgerEntry[]) {
      const delta = entry.entry_type === 'CREDIT' ? Number(entry.amount) : -Number(entry.amount);
      pendingBalanceMinor += delta * 100;
    }
    pendingBalanceMinor = Math.round(pendingBalanceMinor);
  }

  // Payout eligibility
  const payoutEligibility = evaluatePayout({
    kycStatus: account.kyc_status as 'unverified' | 'pending' | 'verified' | 'rejected',
    isFraudReview: false,
    reserveHoldMinor: 0,
    pendingBalanceMinor: Math.abs(pendingBalanceMinor),
    thresholdMinor: account.payout_threshold_minor,
  });

  const totalVideoViews = videos.reduce((sum, v) => sum + (v.view_count ?? 0), 0);
  const totalEpisodes = podcasts.reduce((sum, p) => sum + (p.podcast_episodes?.length ?? 0), 0);
  const currency = ledgerAccount?.currency ?? 'USD';

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Radio className="w-8 h-8 text-sky-400" /> Creator Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {user.displayName} · {account.is_verified ? '✓ Verified Creator' : `KYC: ${account.kyc_status}`}
            {account.category && ` · ${account.category}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/podcasts"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            <Mic className="w-4 h-4" /> Manage Podcasts
          </Link>
          <Link
            href="/live"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            <Video className="w-4 h-4" /> Go Live
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Active Subscribers
          </span>
          <div className="text-2xl font-black text-white">{activeSubscriptions.length.toLocaleString()}</div>
          <span className="text-[11px] text-slate-400">{subscriptions.length} total subscriptions</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Pending Balance
          </span>
          <div className="text-2xl font-black text-white">
            {new Money(Math.abs(pendingBalanceMinor), currency).format()}
          </div>
          <span className={`text-[11px] font-semibold ${payoutEligibility.eligible ? 'text-emerald-400' : 'text-amber-400'}`}>
            {payoutEligibility.eligible ? 'Eligible for payout' : payoutEligibility.reason}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Video Views
          </span>
          <div className="text-2xl font-black text-white">{totalVideoViews.toLocaleString()}</div>
          <span className="text-[11px] text-amber-400 font-semibold">Across {videos.length} video{videos.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" /> Podcasts
          </span>
          <div className="text-2xl font-black text-white">{podcasts.length}</div>
          <span className="text-[11px] text-slate-400">{totalEpisodes} episode{totalEpisodes !== 1 ? 's' : ''} total</span>
        </div>
      </div>

      {/* Monthly revenue breakdown */}
      {feeResult && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sky-400" /> Monthly Subscription Revenue Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-400 mb-1">Gross</p>
              <p className="text-lg font-black text-white">{new Money(feeResult.grossAmountMinor, 'USD').format()}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Platform Fee (15%)</p>
              <p className="text-lg font-black text-rose-400">−{new Money(feeResult.platformFeeMinor, 'USD').format()}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Processing Fee</p>
              <p className="text-lg font-black text-rose-400">−{new Money(feeResult.paymentProviderFeeMinor, 'USD').format()}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Net to Creator</p>
              <p className="text-lg font-black text-emerald-400">{new Money(feeResult.netToCreatorMinor, 'USD').format()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Videos */}
      {videos.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-sky-400" /> Recent Videos
          </h3>
          <div className="space-y-2">
            {videos.map((video) => (
              <div key={video.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white truncate max-w-xs">{video.title}</p>
                  <p className="text-[11px] text-slate-400">{video.video_kind} · {video.view_count.toLocaleString()} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length === 0 && podcasts.length === 0 && (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
          <Plus className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No content yet. Start by going live or hosting a podcast.</p>
        </div>
      )}
    </div>
  );
}

function CreatorOnboarding({ userId, displayName }: { userId: string; displayName: string }) {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex items-center justify-center p-6">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-5">
        <Radio className="w-10 h-10 text-sky-400 mx-auto" />
        <h1 className="text-xl font-extrabold text-white">Become a Creator</h1>
        <p className="text-sm text-slate-400">
          Set up your Creator Studio to host podcasts, live streams, earn from subscriptions, tips, and gifts.
        </p>
        <BecomeCreatorClientButton />
      </div>
    </div>
  );
}
