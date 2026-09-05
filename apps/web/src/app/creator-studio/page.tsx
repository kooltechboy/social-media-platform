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
  Tv,
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
import CreatorContentManager, {
  type CreatorVideoItem,
  type CreatorPodcastItem,
  type CreatorLivestreamItem,
} from "../../components/creator/creator-content-manager";
import type { CreatorDraftItem } from "../../lib/creator/draft-actions";

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

interface LedgerAccount {
  id: string;
  account_type: string;
  currency: string;
}

export default async function CreatorStudioPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const currentTab = (resolvedParams.tab as any) || 'all';

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
    livestreamsResult,
    draftsResult,
    ledgerAccountResult,
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("tier, status, current_period_end, price_minor, currency")
      .eq("creator_account_id", account.id),
    supabase
      .from("videos")
      .select("id, title, video_kind, view_count, visibility, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("podcasts")
      .select(
        "id, title, slug, follower_count, podcast_episodes(id, title, season_number, episode_number, duration_seconds, published_at, scheduled_for, is_subscriber_only, audio_path)"
      )
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("livestreams")
      .select("id, title, state, access_level, peak_viewers, scheduled_for, started_at, ended_at, stream_url")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("creator_content_drafts")
      .select("*")
      .eq("creator_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("ledger_accounts")
      .select("id, account_type, currency")
      .eq("owner_id", user.id)
      .eq("account_type", "creator_pending")
      .maybeSingle(),
  ]);

  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
  const rawVideos = (videosResult.data ?? []) as any[];
  const rawPodcasts = (podcastsResult.data ?? []) as any[];
  const rawLivestreams = (livestreamsResult.data ?? []) as any[];
  const rawDrafts = (draftsResult.data ?? []) as any[];
  const ledgerAccount = ledgerAccountResult.data as LedgerAccount | null;

  // Format data
  const videos: CreatorVideoItem[] = rawVideos.map((v) => ({
    id: v.id,
    title: v.title,
    video_kind: v.video_kind,
    view_count: v.view_count || 0,
    visibility: v.visibility || 'public',
    created_at: v.created_at,
  }));

  const podcasts: CreatorPodcastItem[] = rawPodcasts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    follower_count: p.follower_count || 0,
    episodes: (p.podcast_episodes || []).map((ep: any) => ({
      id: ep.id,
      title: ep.title,
      season_number: ep.season_number,
      episode_number: ep.episode_number,
      duration_seconds: ep.duration_seconds,
      published_at: ep.published_at,
      scheduled_for: ep.scheduled_for,
      is_subscriber_only: ep.is_subscriber_only,
      audio_path: ep.audio_path,
    })),
  }));

  const livestreams: CreatorLivestreamItem[] = rawLivestreams.map((l) => ({
    id: l.id,
    title: l.title,
    state: l.state,
    access_level: l.access_level,
    peak_viewers: l.peak_viewers || 0,
    scheduled_for: l.scheduled_for,
    started_at: l.started_at,
    ended_at: l.ended_at,
    stream_url: l.stream_url,
  }));

  const drafts: CreatorDraftItem[] = rawDrafts.map((d) => ({
    id: d.id,
    creator_id: d.creator_id,
    content_type: d.content_type,
    title: d.title,
    body: d.body,
    media_urls: d.media_urls || [],
    metadata: d.metadata || {},
    scheduled_for: d.scheduled_for,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));

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
    (sum, p) => sum + p.episodes.length,
    0,
  );
  const currency = ledgerAccount?.currency ?? "USD";

  const creatorLaunch = getCreatorLaunchMessaging();

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Surface Header */}
      <div className="surface-header p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/15 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-black uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" /> Creator Studio Command Center
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
            href="/create"
            className="bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-brand-sunriseCoral/20 min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Create Hub
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="surface-card surface-card-interactive rounded-3xl p-5 space-y-2">
          <span className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Subscribers
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeSubscriptions.length.toLocaleString()}
          </div>
          <span className="text-[11px] text-brand-sandstone/70 font-medium block">
            {subscriptions.length} total memberships
          </span>
        </div>

        <div className="surface-card surface-card-interactive rounded-3xl p-5 space-y-2">
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> Balance
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {new Money(Math.abs(pendingBalanceMinor), currency).format()}
          </div>
          <span
            className={`text-[11px] font-bold block ${
              payoutEligibility.eligible ? "text-emerald-400" : "text-amber-300"
            }`}
          >
            {payoutEligibility.eligible
              ? "✓ Eligible for payout"
              : (payoutEligibility.reasons[0] ?? "Pending review")}
          </span>
        </div>

        <div className="surface-card surface-card-interactive rounded-3xl p-5 space-y-2">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Video Views
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalVideoViews.toLocaleString()}
          </div>
          <span className="text-[11px] text-brand-sandstone/70 font-medium block">
            Across {videos.length} video{videos.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="surface-card surface-card-interactive rounded-3xl p-5 space-y-2">
          <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-4 h-4" /> Podcasts
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {podcasts.length}
          </div>
          <span className="text-[11px] text-brand-sandstone/70 font-medium block">
            {totalEpisodes} episode{totalEpisodes !== 1 ? "s" : ""} total
          </span>
        </div>

        <div className="surface-card surface-card-interactive rounded-3xl p-5 space-y-2">
          <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tv className="w-4 h-4" /> Live Streams
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {livestreams.length}
          </div>
          <span className="text-[11px] text-brand-sandstone/70 font-medium block">
            {livestreams.filter(l => l.state === 'live').length} currently live
          </span>
        </div>
      </div>

      {/* Monthly revenue breakdown (if gross > 0) */}
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

      {/* Interactive Content Management Command Center */}
      <CreatorContentManager
        user={{ id: user.id, displayName: user.displayName, username: user.username }}
        videos={videos}
        podcasts={podcasts}
        livestreams={livestreams}
        drafts={drafts}
        initialTab={currentTab}
      />
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
