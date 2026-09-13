import React from "react";
import Link from "next/link";
import {
  Calendar,
  ArrowUpRight,
  Wallet,
  Radio,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import OnlineFriendsWidget from "./online-friends-widget";
import OfficialPlatformWidget from "./official/official-platform-widget";
import {
  createSupabaseServerClient,
  getCurrentUser,
  checkIsOfficialOperator,
} from "../lib/supabase/server";
import { Money, sumLedgerMinorUnits } from "@caribbean/payments";

interface LivePulseItem {
  id: string;
  type: "live" | "story" | "post";
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  isLive?: boolean;
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export interface TukubiLiveSidebarProps {
  user?: any;
  activeLiveStream?: any;
  officialProfile?: any;
  officialCounts?: any;
  isOfficialOperator?: boolean;
}

export default async function TukubiLiveSidebar(props?: TukubiLiveSidebarProps) {
  const user = props?.user !== undefined ? props.user : await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let officialProfile = props?.officialProfile;
  let officialCounts = props?.officialCounts;
  let isOfficialOperator = props?.isOfficialOperator ?? false;

  let walletBalanceFormatted = "$0.00 USD";
  let livePulses: LivePulseItem[] = [];
  let upcomingEvents: Array<{
    id: string;
    title: string;
    starts_at: string;
    venue: string | null;
    cities: { name: string; country_iso: string } | null;
  }> = [];

  if (supabase) {
    // If not provided by parent, resolve official operator status authoritatively
    if (props?.isOfficialOperator === undefined && user) {
      isOfficialOperator = await checkIsOfficialOperator(user.id);
    }

    if (!officialProfile) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio, is_verified')
        .ilike('username', 'tukubi')
        .maybeSingle();
      officialProfile = profile;

      if (officialProfile?.id && !officialCounts) {
        const { data: counts } = await supabase
          .from('profile_counts')
          .select('followers_count, following_count, posts_count, likes_received_count')
          .eq('profile_id', officialProfile.id)
          .maybeSingle();
        officialCounts = counts;
      }
    }

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const [eventsRes, walletAccountRes, liveStreamsRes, storiesRes, postsRes] =
      await Promise.all([
        supabase
          .from("events")
          .select("id, title, starts_at, venue, cities(name, country_iso)")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(3),
        user
          ? supabase
              .from("ledger_accounts")
              .select("id, account_type, currency")
              .eq("owner_id", user.id)
              .in("account_type", ["user_wallet", "wallet"])
              .maybeSingle()
          : Promise.resolve({ data: null }),
        props?.activeLiveStream !== undefined && props.activeLiveStream === null
          ? Promise.resolve({ data: [] })
          : supabase
              .from("livestreams")
              .select(
                "id, title, peak_viewers, started_at, profiles(display_name, username)",
              )
              .eq("state", "live")
              .gte("started_at", sixHoursAgo)
              .order("started_at", { ascending: false })
              .limit(3),
        supabase
          .from("stories")
          .select(
            "id, media_url, caption, expires_at, created_at, profiles:profiles!stories_author_id_fkey(display_name, username)",
          )
          .gte("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("posts")
          .select(
            "id, content, likes_count, comments_count, created_at, profiles:profiles!posts_author_id_fkey(display_name, username)",
          )
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          )
          .order("likes_count", { ascending: false })
          .limit(3),
      ]);

    if (eventsRes?.data) {
      upcomingEvents = eventsRes.data as unknown as typeof upcomingEvents;
    }

    // 1. Map active live streams
    if (liveStreamsRes?.data && liveStreamsRes.data.length > 0) {
      liveStreamsRes.data.forEach((stream: any) => {
        const profile = Array.isArray(stream.profiles)
          ? stream.profiles[0]
          : stream.profiles;
        livePulses.push({
          id: `live-${stream.id}`,
          type: "live",
          title: stream.title || "Live Caribbean Stream",
          subtitle: `@${profile?.username || "creator"} · ${stream.peak_viewers || 1} watching`,
          href: `/live?id=${stream.id}`,
          badge: "LIVE",
          isLive: true,
        });
      });
    }

    // 2. Map active 24h stories/moments
    if (storiesRes?.data && storiesRes.data.length > 0) {
      storiesRes.data.forEach((story: any) => {
        const profile = Array.isArray(story.profiles)
          ? story.profiles[0]
          : story.profiles;
        livePulses.push({
          id: `story-${story.id}`,
          type: "story",
          title: story.caption || "New Island Moment",
          subtitle: `@${profile?.username || "member"} · 24h Story`,
          href: "/",
          badge: "MOMENT",
        });
      });
    }

    // 3. Map trending 24h posts if pulses still low
    if (livePulses.length < 3 && postsRes?.data && postsRes.data.length > 0) {
      postsRes.data.slice(0, 3 - livePulses.length).forEach((post: any) => {
        const profile = Array.isArray(post.profiles)
          ? post.profiles[0]
          : post.profiles;
        livePulses.push({
          id: `post-${post.id}`,
          type: "post",
          title:
            post.content?.slice(0, 48) +
              (post.content?.length > 48 ? "…" : "") || "Caribbean Update",
          subtitle: `@${profile?.username || "member"} · ${post.likes_count || 0} likes`,
          href: "/",
          badge: "TRENDING",
        });
      });
    }

    // 4. Wallet balance
    if (walletAccountRes?.data) {
      const walletAccount = walletAccountRes.data;
      const { data: entries } = await supabase
        .from("ledger_entries")
        .select("amount, entry_type")
        .eq("account_id", walletAccount.id);

      if (entries && entries.length > 0) {
        const minor = Math.abs(sumLedgerMinorUnits(entries));
        walletBalanceFormatted = `${new Money(minor, walletAccount.currency || "USD").format()} ${walletAccount.currency || "USD"}`;
      } else {
        walletBalanceFormatted = `$0.00 ${walletAccount.currency || "USD"}`;
      }
    }
  }

  const hasActiveLive = livePulses.some((p) => p.isLive);

  return (
    <div
      className="space-y-5"
      aria-label="TUKUBI Live Discovery"
    >
      {/* Official TUKUBI Platform Identity & Verified Controls */}
      <OfficialPlatformWidget
        displayName={officialProfile?.display_name || 'TUKUBI'}
        username={officialProfile?.username || 'tukubi'}
        avatarUrl={officialProfile?.avatar_url}
        bio={officialProfile?.bio}
        postsCount={officialCounts?.posts_count ?? 0}
        followersCount={officialCounts?.followers_count ?? 0}
        followingCount={officialCounts?.following_count ?? 0}
        isOperator={isOfficialOperator}
      />

      {/* Online Friends Widget */}
      <OnlineFriendsWidget initialUserId={user?.id} />

      {/* TUKUBI Live Ticker */}
      <div className="glass-aerospace rounded-3xl p-5 space-y-4 shadow-xl border border-white/12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm md:text-base text-white flex items-center gap-2 tracking-tight">
            {hasActiveLive ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500/80 inline-block" />
            )}
            <span className="bg-gradient-to-r from-red-400 via-amber-300 to-brand-caribbeanSea bg-clip-text text-transparent font-black">
              TUKUBI LIVE
            </span>
          </h3>
          <span
            className={`text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full border ${
              hasActiveLive
                ? "bg-red-500/20 text-red-300 border-red-500/30 animate-pulse"
                : "bg-slate-800/80 text-slate-300 border-white/10"
            }`}
          >
            {hasActiveLive ? "LIVE NOW" : "STANDBY"}
          </span>
        </div>

        <div className="space-y-3">
          {hasActiveLive ? (
            livePulses
              .filter((p) => p.isLive)
              .map((pulse) => (
                <Link
                  key={pulse.id}
                  href={pulse.href}
                  className="flex items-center justify-between p-3 md:p-3.5 rounded-2xl border transition-all duration-200 group bg-red-950/30 hover:bg-red-900/40 border-red-500/40 hover:border-red-500/60 shadow-lg shadow-red-900/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-base md:text-lg flex-shrink-0">🔴</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">
                          LIVE
                        </span>
                        <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-brand-caribbeanSea transition-colors truncate">
                          {pulse.title}
                        </h4>
                      </div>
                      <p className="text-[11px] md:text-xs text-white/60 font-medium truncate mt-0.5">
                        {pulse.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-white/40 group-hover:text-brand-caribbeanSea transition-colors flex-shrink-0 ml-2" />
                </Link>
              ))
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-dashed border-white/12 text-center space-y-2.5">
              <div className="w-9 h-9 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto text-red-400">
                <Radio className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs md:text-sm font-black text-white">
                  No Live Broadcasts Right Now
                </p>
                <p className="text-[11px] md:text-xs text-white/50 leading-relaxed max-w-xs mx-auto">
                  Broadcast live audio, DJ sets, carnival sessions, or discussions across the Caribbean.
                </p>
              </div>
              <div className="pt-1 flex items-center justify-center gap-2">
                <Link
                  href="/live/broadcast"
                  className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-black px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/25 active:scale-95"
                >
                  <span className="text-[10px]">🔴</span> Start Broadcast
                </Link>
                <Link
                  href="/live"
                  className="inline-flex items-center gap-1 text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all border border-white/10"
                >
                  Explore Channels →
                </Link>
              </div>
            </div>
          )}

          {/* Island Moments / Updates if any (when not live) */}
          {!hasActiveLive && livePulses.filter((p) => !p.isLive).length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/50 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-goldenHour" /> Island Moments &amp; Trending
              </span>
              {livePulses
                .filter((p) => !p.isLive)
                .slice(0, 2)
                .map((pulse) => (
                  <Link
                    key={pulse.id}
                    href={pulse.href}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm shrink-0">
                        {pulse.type === "story" ? "✨" : "🌴"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {pulse.badge && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                              {pulse.badge}
                            </span>
                          )}
                          <h5 className="font-bold text-xs text-white group-hover:text-brand-caribbeanSea truncate">
                            {pulse.title}
                          </h5>
                        </div>
                        <p className="text-[10px] text-white/50 truncate">
                          {pulse.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-brand-caribbeanSea shrink-0 ml-1.5" />
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* TUKUBI Financial Center Quick Card */}
      <div className="glass-aerospace rounded-3xl p-5 md:p-6 space-y-3.5 shadow-xl border border-white/12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] md:text-xs font-black text-brand-sunriseCoral uppercase tracking-widest flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-sunriseCoral" /> Financial Center
          </span>
          <span className="text-[10px] md:text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Secured
          </span>
        </div>
        <div>
          <p className="text-xs md:text-sm font-black text-white">
            Digital Commerce &amp; Creator Hub
          </p>
          <p className="text-xs md:text-sm text-white/60 mt-1 leading-relaxed font-medium">
            Manage payment methods, orders, fan memberships, and creator
            payouts.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href="/financial-center"
            className="bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:brightness-110 text-slate-950 font-black py-2 md:py-2.5 px-3 rounded-2xl text-xs md:text-sm text-center transition-all shadow-md shadow-orange-500/20 active:scale-95 min-h-[38px] md:min-h-[42px] flex items-center justify-center"
          >
            Overview
          </Link>
          <Link
            href="/financial-center/payment-methods"
            className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 md:py-2.5 px-3 rounded-2xl text-xs md:text-sm text-center border border-white/15 transition-all min-h-[38px] md:min-h-[42px] flex items-center justify-center"
          >
            Cards &amp; Rails
          </Link>
        </div>
      </div>

      {/* Upcoming Cultural Fetes & Events */}
      <div className="glass-aerospace rounded-3xl p-5 md:p-6 space-y-3.5 shadow-xl border border-white/12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm md:text-base text-white flex items-center gap-2 tracking-tight">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-brand-goldenHour" /> Featured
            Cultural Fetes
          </h3>
          <Link
            href="/events"
            className="text-[11px] md:text-xs font-bold text-brand-caribbeanSea hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-2.5">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href="/events"
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 block hover:border-white/25 hover:bg-white/10 transition-all group"
              >
                <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-brand-caribbeanSea transition-colors leading-snug">
                  {event.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] md:text-xs font-medium">
                  <span className="text-white/60">
                    {formatEventDate(event.starts_at)}{" "}
                    {event.cities ? `• ${event.cities.name}` : ""}
                  </span>
                  <span className="font-black text-brand-goldenHour group-hover:underline">
                    RSVP →
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-1.5">
              <p className="text-xs md:text-sm font-semibold text-white/80">
                No featured cultural fetes right now.
              </p>
              <p className="text-[11px] md:text-xs text-white/50 leading-relaxed">
                Check back soon for island carnivals, music festivals, and
                diaspora meetups.
              </p>
              <div className="pt-1">
                <Link
                  href="/events"
                  className="text-[11px] md:text-xs text-brand-caribbeanSea hover:underline font-bold inline-block"
                >
                  Explore Events →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
