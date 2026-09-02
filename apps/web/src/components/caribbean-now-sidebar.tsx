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
import {
  createSupabaseServerClient,
  getCurrentUser,
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

export default async function TukubiLiveSidebar() {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

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
        supabase
          .from("livestreams")
          .select(
            "id, title, peak_viewers, started_at, profiles(display_name, username)",
          )
          .eq("state", "live")
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

  return (
    <aside
      className="hidden lg:block col-span-1 space-y-5"
      aria-label="TUKUBI Live Discovery"
    >
      {/* Online Friends Widget */}
      <OnlineFriendsWidget />

      {/* TUKUBI Live Ticker */}
      <div className="glass-aerospace rounded-3xl p-5 space-y-4 shadow-xl border border-white/12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-white flex items-center gap-2 tracking-tight">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="bg-gradient-to-r from-red-400 via-amber-300 to-brand-caribbeanSea bg-clip-text text-transparent font-black">
              TUKUBI LIVE
            </span>
          </h3>
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            PULSE
          </span>
        </div>

        <div className="space-y-3">
          {livePulses.length > 0 ? (
            livePulses.map((pulse) => (
              <Link
                key={pulse.id}
                href={pulse.href}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 group ${
                  pulse.isLive
                    ? "bg-red-950/30 hover:bg-red-900/40 border-red-500/40 hover:border-red-500/60 shadow-lg shadow-red-900/20"
                    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-base flex-shrink-0">
                    {pulse.type === "live"
                      ? "🔴"
                      : pulse.type === "story"
                        ? "✨"
                        : "🌴"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {pulse.badge && (
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            pulse.isLive
                              ? "bg-red-500/20 text-red-300 border-red-500/30 animate-pulse"
                              : "bg-brand-caribbeanSea/15 text-brand-caribbeanSea border-brand-caribbeanSea/30"
                          }`}
                        >
                          {pulse.badge}
                        </span>
                      )}
                      <h4 className="font-bold text-xs text-white group-hover:text-brand-caribbeanSea transition-colors truncate">
                        {pulse.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-white/60 font-medium truncate mt-0.5">
                      {pulse.subtitle}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-brand-caribbeanSea transition-colors flex-shrink-0 ml-2" />
              </Link>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-2">
              <p className="text-xs font-semibold text-white/80">
                Nothing happening right now.
              </p>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Check back soon for live broadcasts, fetes, and island moments.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-caribbeanSea hover:underline"
                >
                  Explore Caribbean →
                </Link>
                <span className="text-white/30">•</span>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-goldenHour hover:underline"
                >
                  Create a Post →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TUKUBI Financial Center Quick Card */}
      <div className="glass-aerospace rounded-3xl p-5 space-y-3.5 shadow-xl border border-white/12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-brand-sunriseCoral uppercase tracking-widest flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-brand-sunriseCoral" /> Financial Center
          </span>
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Secured
          </span>
        </div>
        <div>
          <p className="text-xs font-black text-white">
            Digital Commerce &amp; Creator Hub
          </p>
          <p className="text-xs text-white/60 mt-1 leading-relaxed font-medium">
            Manage payment methods, orders, fan memberships, and creator
            payouts.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href="/financial-center"
            className="bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:brightness-110 text-slate-950 font-black py-2 px-3 rounded-2xl text-xs text-center transition-all shadow-md shadow-orange-500/20 active:scale-95"
          >
            Overview
          </Link>
          <Link
            href="/financial-center/payment-methods"
            className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-3 rounded-2xl text-xs text-center border border-white/15 transition-all"
          >
            Cards &amp; Rails
          </Link>
        </div>
      </div>

      {/* Upcoming Cultural Fetes & Events */}
      <div className="glass-aerospace rounded-3xl p-5 space-y-3.5 shadow-xl border border-white/12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-white flex items-center gap-2 tracking-tight">
            <Calendar className="w-4 h-4 text-brand-goldenHour" /> Featured
            Cultural Fetes
          </h3>
          <Link
            href="/events"
            className="text-[11px] font-bold text-brand-caribbeanSea hover:underline"
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
                <h4 className="font-bold text-xs text-white group-hover:text-brand-caribbeanSea transition-colors leading-snug">
                  {event.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] font-medium">
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
              <p className="text-xs font-semibold text-white/80">
                No featured cultural fetes right now.
              </p>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Check back soon for island carnivals, music festivals, and
                diaspora meetups.
              </p>
              <div className="pt-1">
                <Link
                  href="/events"
                  className="text-[11px] text-brand-caribbeanSea hover:underline font-bold inline-block"
                >
                  Explore Events →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
