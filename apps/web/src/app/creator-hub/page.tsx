import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Sparkles,
  Radio,
  Users,
  DollarSign,
  TrendingUp,
  Video,
  Mic,
  Tv,
  Briefcase,
  GraduationCap,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Globe,
  Award,
  Layers,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  Clock,
  Sparkle,
} from "lucide-react";
import {
  createSupabaseServerClient,
  getCurrentUser,
} from "../../lib/supabase/server";
import { Money, getCreatorLaunchMessaging } from "@caribbean/payments";
import { isSubscriptionActive } from "@caribbean/creator";
import BecomeCreatorClientButton from "../../components/become-creator-button";
import ContextualHelpButton from "../../components/help/contextual-help-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TUKUBI Creator Hub — Creator Home, Audience & Business Ecosystem",
  description: "The home base for Caribbean creators. Manage your identity, connect with fans and communities, discover brand partnerships, and launch Creator Studio.",
  openGraph: {
    title: "TUKUBI Creator Hub",
    description: "The home base for Caribbean creators. Manage your identity, connect with fans and communities, discover brand partnerships, and launch Creator Studio.",
    url: "https://tukubi.com/creator-hub",
    siteName: "TUKUBI",
  },
};

interface CreatorAccount {
  id: string;
  category: string | null;
  is_verified: boolean;
  kyc_status: string;
  payout_threshold_minor: number;
  created_at: string;
}

export default async function CreatorHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/creator-hub");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?next=/creator-hub");

  // Fetch creator account
  const { data: creatorAccount } = await supabase
    .from("creator_accounts")
    .select("id, category, is_verified, kyc_status, payout_threshold_minor, created_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  const account = creatorAccount as CreatorAccount | null;

  // If not a creator yet, show welcoming Creator Hub onboarding
  if (!account) {
    return <CreatorHubOnboarding user={user} />;
  }

  // Parallel fetch creator ecosystem data
  const [
    profileResult,
    countsResult,
    subscriptionsResult,
    ledgerAccountResult,
    campaignBriefsResult,
    draftsCountResult,
    videosCountResult,
    podcastsCountResult,
    livestreamsCountResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, current_country:countries!current_country_id(name, flag_emoji)")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profile_counts")
      .select("followers_count, following_count, posts_count, likes_received_count")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("id, tier, status, price_minor, current_period_end")
      .eq("creator_account_id", account.id),
    supabase
      .from("ledger_accounts")
      .select("id, balance, currency")
      .eq("owner_id", user.id)
      .eq("account_type", "creator_pending")
      .maybeSingle(),
    supabase
      .from("brand_campaign_briefs")
      .select("id, title, description, budget_range_cents_min, budget_range_cents_max, target_islands, deadline, status")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("creator_content_drafts")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id),
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id),
    supabase
      .from("podcasts")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id),
    supabase
      .from("livestreams")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id),
  ]);

  const profile = profileResult.data as any;
  const counts = countsResult.data || {
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    likes_received_count: 0,
  };
  const subscriptions = subscriptionsResult.data || [];
  const activeSubs = subscriptions.filter((s: any) =>
    isSubscriptionActive(s.status, s.current_period_end)
  );
  const ledgerAccount = ledgerAccountResult.data;
  const briefs = campaignBriefsResult.data || [];
  const draftsCount = draftsCountResult.count ?? 0;
  const totalMediaPublished =
    (videosCountResult.count ?? 0) +
    (podcastsCountResult.count ?? 0) +
    (livestreamsCountResult.count ?? 0);

  const pendingBalanceMinor = Math.round(Number(ledgerAccount?.balance || 0) * 100);
  const currency = ledgerAccount?.currency || "USD";
  const creatorLaunch = getCreatorLaunchMessaging();

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* 1. Header: Creator Hub & Identity */}
      <div className="surface-header p-6 sm:p-8 md:p-10 rounded-3xl border border-white/15 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900/90 via-purple-950/30 to-slate-900/90">
        <div className="flex items-start sm:items-center gap-4 md:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea via-purple-500 to-brand-sunriseCoral p-0.5 shadow-lg flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile?.display_name || user.displayName}
                className="w-full h-full object-cover rounded-2xl bg-slate-950"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-xl md:text-2xl font-black text-white">
                {(profile?.display_name || user.displayName || "C")[0]}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-[11px] md:text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" /> Caribbean Creator Hub
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">
              Welcome, {profile?.display_name || user.displayName}
              {account.is_verified && (
                <span title="Verified Creator" className="inline-flex items-center">
                  <ShieldCheck className="w-6 h-6 md:w-7 md:h-7 text-emerald-400" />
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-300">@{profile?.username || user.username}</span>
              <span>•</span>
              <span className="text-brand-goldenHour font-bold">
                {account.category || "General Creator"}
              </span>
              {profile?.current_country && (
                <>
                  <span>•</span>
                  <span className="text-slate-200 font-medium">
                    {profile.current_country.flag_emoji} {profile.current_country.name}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ContextualHelpButton articleSlug="creator-hub-overview" label="Creator Guide" compact={false} />
          <Link
            href={`/profile/${profile?.username || user.username}`}
            className="px-4 md:px-5 py-2.5 md:py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs md:text-sm font-black transition-all flex items-center gap-2 min-h-[44px] md:min-h-[48px]"
          >
            <ExternalLink className="w-4 h-4" /> View Public Profile
          </Link>
          <Link
            href="/creator-studio"
            className="px-5 md:px-6 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 text-xs md:text-sm font-black transition-all shadow-lg shadow-brand-caribbeanSea/20 flex items-center gap-2 min-h-[44px] md:min-h-[48px]"
          >
            <Radio className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" /> Open Creator Studio
          </Link>
        </div>
      </div>

      {/* 2. THE BIG STUDIO CONTROL ROOM BRIDGE BANNER */}
      <div className="surface-card rounded-3xl p-6 sm:p-8 md:p-10 border border-brand-caribbeanSea/30 bg-gradient-to-br from-brand-caribbeanSea/10 via-slate-900/80 to-brand-sunriseCoral/10 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/40">
              Command Center
            </span>
            <span className="text-xs md:text-sm text-brand-sandstone/70">
              {draftsCount} draft{draftsCount !== 1 ? "s" : ""} pending • {totalMediaPublished} live publications
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Radio className="w-6 h-6 md:w-7 md:h-7 text-brand-sunriseCoral" />
            TUKUBI Creator Studio
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/85 leading-relaxed">
            Your professional operating system: produce multi-format content, manage your video &amp; podcast network, review deep retention analytics, and automate repurposing with CaribAI.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full lg:w-auto">
          <Link
            href="/creator-studio"
            className="bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black px-6 md:px-7 py-3 md:py-3.5 rounded-2xl text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-sunriseCoral/20 min-h-[46px] md:min-h-[50px]"
          >
            Enter Studio Workspace <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </Link>
          <Link
            href="/creator-studio/repurpose"
            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 font-bold px-4 md:px-5 py-3 md:py-3.5 rounded-2xl text-xs md:text-sm flex items-center justify-center gap-2 transition-all min-h-[46px] md:min-h-[50px]"
          >
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-400" /> AI Repurpose
          </Link>
        </div>
      </div>

      {/* 3. CORE 4 PILLARS GRID: Identity, Network, Business, Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pillar 1: Creator Identity */}
        <div className="surface-card rounded-3xl p-6 md:p-7 border border-white/10 space-y-4 hover:border-brand-goldenHour/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-2">
              <Award className="w-4 h-4 md:w-5 md:h-5" /> Creator Identity
            </span>
            <span className="text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-goldenHour/10 text-brand-goldenHour border border-brand-goldenHour/20">
              Active
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-sm md:text-base font-bold text-white">
              {profile?.display_name || user.displayName}
            </div>
            <p className="text-xs md:text-sm text-brand-sandstone/70 line-clamp-2">
              {profile?.bio || "No creator bio set yet. Share your Caribbean cultural voice."}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-2 text-xs md:text-sm">
            <div className="flex justify-between text-brand-sandstone/80">
              <span>Category</span>
              <span className="font-bold text-white">{account.category || "Storyteller"}</span>
            </div>
            <div className="flex justify-between text-brand-sandstone/80">
              <span>KYC Verification</span>
              <span className={`font-bold capitalize ${account.kyc_status === 'verified' ? 'text-emerald-400' : 'text-orange-400'}`}>
                {account.kyc_status}
              </span>
            </div>
          </div>

          <Link
            href="/settings"
            className="text-xs md:text-sm font-black text-brand-goldenHour hover:underline flex items-center gap-1.5 pt-2 block"
          >
            Edit Profile &amp; Badges <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Pillar 2: Creator Network */}
        <div className="surface-card rounded-3xl p-6 md:p-7 border border-white/10 space-y-4 hover:border-blue-400/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Users className="w-4 h-4 md:w-5 md:h-5" /> Creator Network
            </span>
            <span className="text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Audience
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 md:p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] md:text-xs uppercase font-bold text-brand-sandstone/60">Followers</span>
              <div className="text-xl md:text-2xl lg:text-3xl font-black text-white">{counts.followers_count.toLocaleString()}</div>
            </div>
            <div className="p-3 md:p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[10px] md:text-xs uppercase font-bold text-brand-sandstone/60">Subscribers</span>
              <div className="text-xl md:text-2xl lg:text-3xl font-black text-white">{activeSubs.length.toLocaleString()}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-2 text-xs md:text-sm text-brand-sandstone/80">
            <div className="flex justify-between">
              <span>Likes Received</span>
              <span className="font-bold text-white">{counts.likes_received_count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Posts</span>
              <span className="font-bold text-white">{counts.posts_count.toLocaleString()}</span>
            </div>
          </div>

          <Link
            href="/creator-studio?tab=analytics"
            className="text-xs md:text-sm font-black text-blue-400 hover:underline flex items-center gap-1.5 pt-2 block"
          >
            View Audience Geography <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Pillar 3: Creator Business */}
        <div className="surface-card rounded-3xl p-6 md:p-7 border border-white/10 space-y-4 hover:border-emerald-400/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5" /> Creator Business
            </span>
            <span className="text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Financial
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] md:text-xs uppercase font-bold text-brand-sandstone/60">Available Balance</span>
            <div className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {new Money(pendingBalanceMinor, currency).format()}
            </div>
            <p className="text-[11px] md:text-xs text-brand-sandstone/70">
              Threshold: {new Money(account.payout_threshold_minor, "USD").format()}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-2 text-xs md:text-sm text-brand-sandstone/80">
            <div className="flex justify-between">
              <span>Fan Tiers</span>
              <span className="font-bold text-white">3 Active ($2.99–$9.99)</span>
            </div>
            <div className="flex justify-between">
              <span>Settlement</span>
              <span className="font-bold text-emerald-400">Double-Entry Ledger</span>
            </div>
          </div>

          <Link
            href="/financial-center/creator"
            className="text-xs md:text-sm font-black text-emerald-400 hover:underline flex items-center gap-1.5 pt-2 block"
          >
            Manage Payouts &amp; Ledger <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Pillar 4: Production Quick Launch */}
        <div className="surface-card rounded-3xl p-6 md:p-7 border border-white/10 space-y-4 hover:border-brand-sunriseCoral/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-2">
              <Layers className="w-4 h-4 md:w-5 md:h-5" /> Production Studio
            </span>
            <span className="text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-brand-sunriseCoral border border-brand-sunriseCoral/20">
              Tools
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Link
              href="/create"
              className="p-3 md:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center text-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4 md:w-5 md:h-5 text-brand-sunriseCoral" />
              <span className="text-[11px] md:text-xs font-bold text-white">Post / Story</span>
            </Link>
            <Link
              href="/creator-studio?tab=podcasts"
              className="p-3 md:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center text-center gap-1.5 transition-all"
            >
              <Mic className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
              <span className="text-[11px] md:text-xs font-bold text-white">Podcast</span>
            </Link>
            <Link
              href="/live/broadcast"
              className="p-3 md:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center text-center gap-1.5 transition-all"
            >
              <Tv className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
              <span className="text-[11px] md:text-xs font-bold text-white">Go Live</span>
            </Link>
            <Link
              href="/creator-studio/videos"
              className="p-3 md:p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center text-center gap-1.5 transition-all"
            >
              <Video className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              <span className="text-[11px] md:text-xs font-bold text-white">Videos</span>
            </Link>
          </div>

          <Link
            href="/creator-studio"
            className="text-xs md:text-sm font-black text-brand-sunriseCoral hover:underline flex items-center gap-1.5 pt-2 block"
          >
            Launch Full Studio <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4. BRAND DEALS & CARIBBEAN CREATOR MARKETPLACE OPPORTUNITIES */}
      <div className="surface-card rounded-3xl p-6 sm:p-8 md:p-10 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4 md:w-5 md:h-5" /> Brand Partnerships &amp; Briefs
            </span>
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white">
              Open Caribbean Brand Campaigns
            </h3>
            <p className="text-xs md:text-sm text-brand-sandstone/70">
              Businesses and tourism boards looking to sponsor authentic Caribbean voices.
            </p>
          </div>

          <Link
            href="/creator-marketplace"
            className="px-4 md:px-5 py-2.5 md:py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs md:text-sm font-black transition-all flex items-center gap-2 self-start sm:self-auto min-h-[40px] md:min-h-[44px]"
          >
            Browse Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {briefs.length === 0 ? (
          <div className="p-8 md:p-10 rounded-2xl bg-white/5 border border-white/5 text-center space-y-3">
            <Briefcase className="w-8 h-8 md:w-10 md:h-10 text-brand-sandstone/40 mx-auto" />
            <p className="text-sm md:text-base font-bold text-white">No Open Briefs at this Moment</p>
            <p className="text-xs md:text-sm text-brand-sandstone/70 max-w-md mx-auto">
              Make sure your Creator Marketplace profile is complete with your rates and portfolio so brands can invite you directly.
            </p>
            <Link
              href="/creator-marketplace"
              className="inline-block text-xs md:text-sm font-black text-brand-goldenHour hover:underline pt-1"
            >
              Update Marketplace Profile →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-4 md:gap-5">
            {briefs.map((b: any) => (
              <div
                key={b.id}
                className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3.5 hover:border-white/15 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] md:text-xs text-brand-sandstone/70">
                    <span className="text-emerald-400 font-bold">
                      {b.budget_range_cents_min && b.budget_range_cents_max
                        ? `$${b.budget_range_cents_min / 100} - $${b.budget_range_cents_max / 100}`
                        : "Competitive Rate"}
                    </span>
                    {b.deadline && (
                      <span className="flex items-center gap-1.5 text-[10px] md:text-xs">
                        <Clock className="w-3.5 h-3.5" /> Due {new Date(b.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm md:text-base font-black text-white line-clamp-1">{b.title}</h4>
                  <p className="text-xs md:text-sm text-brand-sandstone/70 line-clamp-2 leading-relaxed">
                    {b.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(b.target_islands || []).slice(0, 2).map((isl: string) => (
                      <span
                        key={isl}
                        className="text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-brand-sandstone/80 uppercase"
                      >
                        {isl}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/creator-marketplace"
                    className="text-xs md:text-sm font-black text-brand-goldenHour hover:underline flex items-center gap-1"
                  >
                    Apply <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. CREATOR ACADEMY & CARIBBEAN BEST PRACTICES */}
      <div className="surface-card rounded-3xl p-6 sm:p-8 md:p-10 border border-white/10 space-y-6">
        <div className="space-y-1.5">
          <span className="text-xs md:text-sm font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 md:w-5 md:h-5" /> Creator Academy &amp; Resources
          </span>
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white">
            Masterclasses for Caribbean Digital Pioneers
          </h3>
          <p className="text-xs md:text-sm text-brand-sandstone/70">
            Curated strategies on Caribbean IP, diaspora monetization, and low-latency production.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2.5 hover:border-purple-500/30 transition-all">
            <span className="text-2xl md:text-3xl">🌴</span>
            <h4 className="text-sm md:text-base font-black text-white">Caribbean IP &amp; Copyright</h4>
            <p className="text-xs md:text-sm text-brand-sandstone/70 leading-relaxed">
              Protecting Soca, Dancehall, Kompa, and indigenous folklore content across global digital distributions.
            </p>
          </div>

          <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2.5 hover:border-purple-500/30 transition-all">
            <span className="text-2xl md:text-3xl">💡</span>
            <h4 className="text-sm md:text-base font-black text-white">Monetizing the Global Diaspora</h4>
            <p className="text-xs md:text-sm text-brand-sandstone/70 leading-relaxed">
              How to structure membership tiers and cultural merchandise for audiences in NYC, Miami, Toronto, and London.
            </p>
          </div>

          <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2.5 hover:border-purple-500/30 transition-all">
            <span className="text-2xl md:text-3xl">🎙️</span>
            <h4 className="text-sm md:text-base font-black text-white">Low-Bandwidth Production</h4>
            <p className="text-xs md:text-sm text-brand-sandstone/70 leading-relaxed">
              Optimization guide: audio compression, progressive video encoding, and reliable live streaming across island connectivity.
            </p>
          </div>

          <div className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2.5 hover:border-purple-500/30 transition-all">
            <span className="text-2xl md:text-3xl">🤝</span>
            <h4 className="text-sm md:text-base font-black text-white">Pitching Island Brands</h4>
            <p className="text-xs md:text-sm text-brand-sandstone/70 leading-relaxed">
              Preparing your TUKUBI media kit, setting fair CPM rates, and contracting with regional telecom and tourism brands.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatorHubOnboarding({ user }: { user: any }) {
  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6">
      <div className="surface-card rounded-3xl p-8 sm:p-12 md:p-14 max-w-lg w-full text-center space-y-6 border border-white/15 shadow-2xl bg-slate-900/80">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral p-0.5 mx-auto">
          <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-brand-sunriseCoral">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] md:text-xs font-black uppercase tracking-wider text-brand-caribbeanSea">
            TUKUBI Creator Ecosystem
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
            Welcome to Creator Hub
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 leading-relaxed">
            Your home base to establish your creator identity, grow your audience across the Caribbean and global diaspora, monetize with fan subscriptions, and access our professional Creator Studio.
          </p>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-left space-y-2 text-xs md:text-sm">
          <p className="font-bold text-purple-200 flex items-center gap-2">
            <Sparkle className="w-4 h-4 text-brand-goldenHour" /> 100% Free Launch Access
          </p>
          <p className="text-brand-sandstone/70">
            Enjoy unmetered access to Creator Hub, Podcasting Network, and Creator Studio tools through October 31, 2026.
          </p>
        </div>

        <div className="pt-2">
          <BecomeCreatorClientButton />
        </div>
      </div>
    </div>
  );
}
