import React from "react";
import { redirect } from "next/navigation";
import {
  Radio,
  Video,
  Mic,
  DollarSign,
  Users,
  TrendingUp,
  BarChart2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import {
  createSupabaseServerClient,
  getCurrentUser,
} from "../../lib/supabase/server";
import { PayoutRequestButton } from "../../components/payout-request-button";
import {
  applyFees,
  evaluatePayout,
  isSubscriptionActive,
} from "@caribbean/creator";
import { Money, sumLedgerMinorUnits, getCreatorLaunchMessaging } from "@caribbean/payments";
import BecomeCreatorClientButton from "../../components/become-creator-button";
import CreatorStudioActions from "../../components/creator-studio-actions";

export const dynamic = "force-dynamic";

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
  entry_type: "DEBIT" | "CREDIT";
}

interface LedgerAccount {
  id: string;
  account_type: string;
  currency: string;
}

export default async function CreatorStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/creator-studio");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?next=/creator-studio");

  // Load creator account
  const { data: creatorAccount } = await supabase
    .from("creator_accounts")
    .select(
      "id, category, is_verified, kyc_status, payout_threshold_minor, created_at",
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  const account = creatorAccount as CreatorAccount | null;

  // If no creator account, show onboarding
  if (!account) {
    return (
      <CreatorOnboarding userId={user.id} displayName={user.displayName} />
    );
  }

  // Load all creator data in parallel
  const [
    subscriptionsResult,
    videosResult,
    podcastsResult,
    ledgerAccountResult,
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("tier, status, current_period_end, price_minor, currency")
      .eq("creator_account_id", account.id),
    supabase
      .from("videos")
      .select("id, title, video_kind, view_count, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("podcasts")
      .select("id, title, follower_count, podcast_episodes(id)")
      .eq("creator_id", user.id),
    supabase
      .from("ledger_accounts")
      .select("id, account_type, currency")
      .eq("owner_id", user.id)
      .eq("account_type", "creator_pending")
      .maybeSingle(),
  ]);

  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
  const videos = (videosResult.data ?? []) as VideoRow[];
  const podcasts = (podcastsResult.data ?? []) as unknown as PodcastRow[];
  const ledgerAccount = ledgerAccountResult.data as LedgerAccount | null;

  // Compute active subscription count and monthly revenue
  const activeSubscriptions = subscriptions.filter((s) =>
    isSubscriptionActive(s.status, s.current_period_end),
  );
  const grossMonthlyMinor = activeSubscriptions.reduce(
    (sum, s) => sum + s.price_minor,
    0,
  );
  const feeResult = grossMonthlyMinor > 0 ? applyFees(grossMonthlyMinor) : null;

  // Compute pending balance from ledger entries
  let pendingBalanceMinor = 0;
  if (ledgerAccount) {
    const { data: entries } = await supabase
      .from("ledger_entries")
      .select("amount, entry_type")
      .eq("account_id", ledgerAccount.id);

    if (entries && entries.length > 0) {
      pendingBalanceMinor = sumLedgerMinorUnits(entries);
    }
  }

  // Payout eligibility
  const payoutEligibility = evaluatePayout({
    kycStatus: account.kyc_status as
      "unverified" | "pending" | "verified" | "rejected",
    fraudHold: false,
    chargebackReserveMinor: 0,
    availableBalanceMinor: Math.abs(pendingBalanceMinor),
    pendingBalanceMinor: Math.abs(pendingBalanceMinor),
    payoutThresholdMinor: account.payout_threshold_minor,
  });

  const totalVideoViews = videos.reduce(
    (sum, v) => sum + (v.view_count ?? 0),
    0,
  );
  const totalEpisodes = podcasts.reduce(
    (sum, p) => sum + (p.podcast_episodes?.length ?? 0),
    0,
  );
  const currency = ledgerAccount?.currency ?? "USD";

  const creatorLaunch = getCreatorLaunchMessaging();

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Surface Header */}
      <div className="surface-header p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-black uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" /> Creator Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Creator Studio
          </h1>
          <p className="text-xs sm:text-sm text-brand-sandstone/80">
            <span className="font-bold text-white">{user.displayName}</span> ·{" "}
            {account.is_verified ? (
              <span className="text-emerald-400 font-black">✓ Verified Creator</span>
            ) : (
              <span className="text-orange-400 font-bold">KYC: {account.kyc_status}</span>
            )}
            {account.category && ` · ${account.category}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CreatorStudioActions displayName={user.displayName} />
          <Link
            href="/podcasts"
            className="bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all min-h-[44px] border border-white/15"
          >
            <Mic className="w-4 h-4 text-orange-400" /> Manage Podcasts
          </Link>
          <Link
            href="/live/broadcast"
            className="bg-red-600 hover:bg-red-500 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-red-600/30 min-h-[44px]"
          >
            <Video className="w-4 h-4" /> Go Live
          </Link>
        </div>
      </div>

      {/* Phased Creator Launch Promo Banner */}
      <div className="surface-card border border-purple-500/40 rounded-3xl p-6 shadow-xl space-y-2 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/40">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-500/40">
            {creatorLaunch.badge}
          </span>
          <h2 className="text-base sm:text-lg font-black text-white">
            {creatorLaunch.bannerTitle}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-brand-sandstone/85 leading-relaxed font-medium">
          {creatorLaunch.bannerBody}
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="surface-card surface-card-interactive rounded-3xl p-6 space-y-3">
          <span className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Active Subscribers
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {activeSubscriptions.length.toLocaleString()}
          </div>
          <span className="text-xs text-brand-sandstone/70 font-medium block">
            {subscriptions.length} total subscriptions
          </span>
        </div>

        <div className="surface-card surface-card-interactive rounded-3xl p-6 space-y-3">
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> Pending Balance
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {new Money(Math.abs(pendingBalanceMinor), currency).format()}
          </div>
          <span
            className={`text-xs font-bold block ${
              payoutEligibility.eligible ? "text-emerald-400" : "text-amber-300"
            }`}
          >
            {payoutEligibility.eligible
              ? "✓ Eligible for payout"
              : (payoutEligibility.reasons[0] ?? "Pending review")}
          </span>
        </div>

        <div className="surface-card surface-card-interactive rounded-3xl p-6 space-y-3">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Video Views
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {totalVideoViews.toLocaleString()}
          </div>
          <span className="text-xs text-brand-sandstone/70 font-medium block">
            Across {videos.length} video{videos.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="surface-card surface-card-interactive rounded-3xl p-6 space-y-3">
          <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-4 h-4" /> Podcasts
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {podcasts.length}
          </div>
          <span className="text-xs text-brand-sandstone/70 font-medium block">
            {totalEpisodes} episode{totalEpisodes !== 1 ? "s" : ""} total
          </span>
        </div>
      </div>

      {/* Monthly revenue breakdown */}
      {feeResult && (
        <div className="surface-card rounded-3xl p-6 sm:p-8 space-y-5 border border-white/15">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-400" /> Monthly Fan Subscription Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-brand-sandstone/70 font-bold uppercase tracking-wider">
                Gross Subscriptions
              </p>
              <p className="text-2xl font-black text-white">
                {new Money(feeResult.grossMinor, "USD").format()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-brand-sandstone/70 font-bold uppercase tracking-wider">
                Estimated Processing (PSP)
              </p>
              <p className="text-2xl font-black text-rose-400">
                −{new Money(feeResult.processingFeeMinor, "USD").format()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-brand-sandstone/70 font-bold uppercase tracking-wider">
                Net Creator Balance
              </p>
              <p className="text-2xl font-black text-emerald-400">
                {new Money(
                  feeResult.grossMinor - feeResult.processingFeeMinor,
                  "USD",
                ).format()}
              </p>
            </div>
          </div>

          <div className="pt-5 border-t border-white/10">
            <PayoutRequestButton
              eligible={payoutEligibility.eligible}
              ineligibleReason={payoutEligibility.reasons[0]}
              netMinor={pendingBalanceMinor}
            />
          </div>
        </div>
      )}

      {/* Recent Videos */}
      {videos.length > 0 && (
        <div className="surface-card rounded-3xl p-6 sm:p-8 space-y-4 border border-white/15">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-orange-400" /> Recent Videos
            </h3>
            {videos.length >= 10 && (
              <Link
                href="/creator-studio/videos"
                className="text-xs font-black uppercase tracking-wider text-orange-400 hover:text-orange-300 transition-colors"
              >
                View All →
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="surface-card surface-card-interactive rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-black text-white truncate">
                    {video.title}
                  </p>
                  <p className="text-xs text-brand-sandstone/70 mt-0.5">
                    {video.video_kind} · {video.view_count.toLocaleString()} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length === 0 && podcasts.length === 0 && (
        <div className="surface-card rounded-3xl p-12 text-center space-y-3 border border-white/10 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-brand-sandstone/60">
            <Plus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-white">No content published yet</h3>
          <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed">
            Start by publishing your first podcast, scheduling an event, or going live to your fans!
          </p>
        </div>
      )}
    </div>
  );
}

function CreatorOnboarding({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6">
      <div className="surface-card rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-6 border border-white/15 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
          <Radio className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">
            Become a Creator
          </h1>
          <p className="text-sm text-brand-sandstone/80 leading-relaxed">
            You can create and publish your content for free through October 31, 2026. Enjoy full access to Creator Hub, Podcasting and Creator Studio during our launch period.
          </p>
        </div>
        <div className="pt-2">
          <BecomeCreatorClientButton />
        </div>
      </div>
    </div>
  );
}

