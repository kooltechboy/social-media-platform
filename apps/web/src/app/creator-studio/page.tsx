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
import { Money, sumLedgerMinorUnits } from "@caribbean/payments";
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

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone flex items-center gap-3">
            <Radio className="w-8 h-8 text-brand-caribbeanSea" /> Creator Studio
          </h1>
          <p className="text-sm text-brand-sandstone/60 mt-1">
            {user.displayName} ·{" "}
            {account.is_verified
              ? "✓ Verified Creator"
              : `KYC: ${account.kyc_status}`}
            {account.category && ` · ${account.category}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CreatorStudioActions displayName={user.displayName} />
          <Link
            href="/podcasts"
            className="bg-brand-goldenHour hover:bg-brand-goldenHour text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            <Mic className="w-4 h-4" /> Manage Podcasts
          </Link>
          <Link
            href="/live/broadcast"
            className="bg-red-600 hover:bg-red-500 text-brand-sandstone font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md shadow-red-600/20"
          >
            <Video className="w-4 h-4" /> Go Live
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-brand-dusk/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-brand-caribbeanSea uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Active Subscribers
          </span>
          <div className="text-2xl font-black text-brand-sandstone">
            {activeSubscriptions.length.toLocaleString()}
          </div>
          <span className="text-[11px] text-brand-sandstone/60">
            {subscriptions.length} total subscriptions
          </span>
        </div>

        <div className="bg-brand-dusk/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-brand-sunriseCoral uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Pending Balance
          </span>
          <div className="text-2xl font-black text-brand-sandstone">
            {new Money(Math.abs(pendingBalanceMinor), currency).format()}
          </div>
          <span
            className={`text-[11px] font-semibold ${payoutEligibility.eligible ? "text-brand-sunriseCoral" : "text-brand-goldenHour"}`}
          >
            {payoutEligibility.eligible
              ? "Eligible for payout"
              : (payoutEligibility.reasons[0] ?? "Pending review")}
          </span>
        </div>

        <div className="bg-brand-dusk/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-brand-goldenHour uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Video Views
          </span>
          <div className="text-2xl font-black text-brand-sandstone">
            {totalVideoViews.toLocaleString()}
          </div>
          <span className="text-[11px] text-brand-goldenHour font-semibold">
            Across {videos.length} video{videos.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="bg-brand-dusk/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" /> Podcasts
          </span>
          <div className="text-2xl font-black text-brand-sandstone">
            {podcasts.length}
          </div>
          <span className="text-[11px] text-brand-sandstone/60">
            {totalEpisodes} episode{totalEpisodes !== 1 ? "s" : ""} total
          </span>
        </div>
      </div>

      {/* Monthly revenue breakdown */}
      {feeResult && (
        <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-brand-sandstone mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-brand-caribbeanSea" /> Monthly
            Fan Subscription Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-brand-sandstone/60 mb-1">
                Gross Subscriptions
              </p>
              <p className="text-lg font-black text-brand-sandstone">
                {new Money(feeResult.grossMinor, "USD").format()}
              </p>
            </div>
            <div>
              <p className="text-brand-sandstone/60 mb-1">
                Estimated Processing (PSP)
              </p>
              <p className="text-lg font-black text-rose-400">
                −{new Money(feeResult.processingFeeMinor, "USD").format()}
              </p>
            </div>
            <div>
              <p className="text-brand-sandstone/60 mb-1">
                Net Creator Balance
              </p>
              <p className="text-lg font-black text-brand-sunriseCoral">
                {new Money(
                  feeResult.grossMinor - feeResult.processingFeeMinor,
                  "USD",
                ).format()}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
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
        <div className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
              <Video className="w-4 h-4 text-brand-caribbeanSea" /> Recent
              Videos
            </h3>
            {videos.length >= 10 && (
              <Link
                href="/creator-studio/videos"
                className="text-[11px] font-black uppercase tracking-wider text-brand-caribbeanSea hover:text-brand-caribbeanSea transition-colors"
              >
                View All
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between bg-brand-twilight border border-slate-800 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-sandstone truncate max-w-xs">
                    {video.title}
                  </p>
                  <p className="text-[11px] text-brand-sandstone/60">
                    {video.video_kind} · {video.view_count.toLocaleString()}{" "}
                    views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length === 0 && podcasts.length === 0 && (
        <div className="bg-brand-dusk/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
          <Plus className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-brand-sandstone/60">
            No content yet. Start by going live or hosting a podcast.
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
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-6">
      <div className="bg-brand-dusk/70 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-5">
        <Radio className="w-10 h-10 text-brand-caribbeanSea mx-auto" />
        <h1 className="text-xl font-extrabold text-brand-sandstone">
          Become a Creator
        </h1>
        <p className="text-sm text-brand-sandstone/60">
          Set up your Creator Studio to host podcasts, live streams, earn from
          subscriptions, tips, and gifts.
        </p>
        <BecomeCreatorClientButton />
      </div>
    </div>
  );
}
