import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowUpRight, Wallet, Radio, Sparkles, MessageCircle } from 'lucide-react';
import OnlineFriendsWidget from './online-friends-widget';
import { createSupabaseServerClient, getCurrentUser } from '../lib/supabase/server';
import { Money } from '@caribbean/spotpay';

interface LivePulseItem {
  id: string;
  type: 'live' | 'story' | 'post';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  isLive?: boolean;
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default async function CaribbeanNowSidebar() {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  let walletBalanceFormatted = '$0.00 USD';
  let livePulses: LivePulseItem[] = [];
  let upcomingEvents: Array<{
    id: string;
    title: string;
    starts_at: string;
    venue: string | null;
    cities: { name: string; country_iso: string } | null;
  }> = [];

  if (supabase) {
    const [eventsRes, walletAccountRes, liveStreamsRes, storiesRes, postsRes] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, starts_at, venue, cities(name, country_iso)')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(3),
      user
        ? supabase
            .from('ledger_accounts')
            .select('id, account_type, currency')
            .eq('owner_id', user.id)
            .eq('account_type', 'spotpay_wallet')
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('livestreams')
        .select('id, title, peak_viewers, started_at, profiles(display_name, username)')
        .eq('state', 'live')
        .order('started_at', { ascending: false })
        .limit(3),
      supabase
        .from('stories')
        .select('id, media_url, caption, expires_at, created_at, profiles(display_name, username)')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('posts')
        .select('id, content, likes_count, comments_count, created_at, profiles(display_name, username)')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('likes_count', { ascending: false })
        .limit(3),
    ]);

    if (eventsRes?.data) {
      upcomingEvents = eventsRes.data as unknown as typeof upcomingEvents;
    }

    // 1. Map active live streams
    if (liveStreamsRes?.data && liveStreamsRes.data.length > 0) {
      liveStreamsRes.data.forEach((stream: any) => {
        const profile = Array.isArray(stream.profiles) ? stream.profiles[0] : stream.profiles;
        livePulses.push({
          id: `live-${stream.id}`,
          type: 'live',
          title: stream.title || 'Live Caribbean Stream',
          subtitle: `@${profile?.username || 'creator'} · ${stream.peak_viewers || 1} watching`,
          href: `/live?id=${stream.id}`,
          badge: 'LIVE',
          isLive: true,
        });
      });
    }

    // 2. Map active 24h stories/moments
    if (storiesRes?.data && storiesRes.data.length > 0) {
      storiesRes.data.forEach((story: any) => {
        const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
        livePulses.push({
          id: `story-${story.id}`,
          type: 'story',
          title: story.caption || 'New Island Moment',
          subtitle: `@${profile?.username || 'member'} · 24h Story`,
          href: '/',
          badge: 'MOMENT',
        });
      });
    }

    // 3. Map trending 24h posts if pulses still low
    if (livePulses.length < 3 && postsRes?.data && postsRes.data.length > 0) {
      postsRes.data.slice(0, 3 - livePulses.length).forEach((post: any) => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
        livePulses.push({
          id: `post-${post.id}`,
          type: 'post',
          title: post.content?.slice(0, 48) + (post.content?.length > 48 ? '…' : '') || 'Caribbean Update',
          subtitle: `@${profile?.username || 'member'} · ${post.likes_count || 0} likes`,
          href: '/',
          badge: 'TRENDING',
        });
      });
    }

    // 4. Wallet balance
    if (walletAccountRes?.data) {
      const walletAccount = walletAccountRes.data;
      const { data: entries } = await supabase
        .from('ledger_entries')
        .select('amount, entry_type')
        .eq('account_id', walletAccount.id);

      if (entries && entries.length > 0) {
        const netMajor = entries.reduce((sum, e) => {
          const amt = Number(e.amount);
          return e.entry_type === 'CREDIT' ? sum + amt : sum - amt;
        }, 0);
        const minor = Math.round(Math.abs(netMajor) * 100);
        walletBalanceFormatted = `${new Money(minor, walletAccount.currency || 'USD').format()} ${walletAccount.currency || 'USD'}`;
      } else {
        walletBalanceFormatted = `$0.00 ${walletAccount.currency || 'USD'}`;
      }
    }
  }

  return (
    <aside className="hidden lg:block col-span-1 space-y-5" aria-label="Caribbean Now Discovery">
      {/* Online Friends Widget */}
      <OnlineFriendsWidget />

      {/* Caribbean Now Live Ticker */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-brand-sandstone flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="bg-gradient-to-r from-red-400 via-amber-300 to-brand-caribbeanSea bg-clip-text text-transparent">
              CARIBBEAN NOW
            </span>
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            LIVE PULSE
          </span>
        </div>

        <div className="space-y-3">
          {livePulses.length > 0 ? (
            livePulses.map((pulse) => (
              <Link
                key={pulse.id}
                href={pulse.href}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all group ${
                  pulse.isLive
                    ? 'bg-red-950/20 hover:bg-red-900/30 border-red-500/30 hover:border-red-500/50'
                    : 'bg-white/5 hover:bg-white/10 border-white/8 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-base flex-shrink-0">
                    {pulse.type === 'live' ? '🔴' : pulse.type === 'story' ? '✨' : '🌴'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {pulse.badge && (
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            pulse.isLive
                              ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
                              : 'bg-brand-caribbeanSea/10 text-brand-caribbeanSea border-brand-caribbeanSea/20'
                          }`}
                        >
                          {pulse.badge}
                        </span>
                      )}
                      <h4 className="font-extrabold text-xs text-slate-200 group-hover:text-brand-caribbeanSea transition-colors truncate">
                        {pulse.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-brand-sandstone/60 font-medium truncate mt-0.5">
                      {pulse.subtitle}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-brand-sandstone/40 group-hover:text-brand-caribbeanSea transition-colors flex-shrink-0 ml-2" />
              </Link>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-slate-800 text-center space-y-2">
              <p className="text-xs font-semibold text-brand-sandstone/80">Nothing happening right now.</p>
              <p className="text-[11px] text-brand-sandstone/50 leading-relaxed">
                Check back soon for live broadcasts, fetes, and island moments.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-caribbeanSea hover:underline"
                >
                  Explore Caribbean →
                </Link>
                <span className="text-brand-sandstone/30">•</span>
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

      {/* SpotPay Instant Wallet Quick Card */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-brand-sunriseCoral uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> SpotPay Ledger
          </span>
          <span className="text-[10px] font-bold text-brand-sandstone/60">Double-Entry</span>
        </div>
        <div>
          <p className="text-xs text-brand-sandstone/60">Personal Balance</p>
          <p className="text-2xl font-black text-brand-sandstone">
            {user ? walletBalanceFormatted : '$0.00 USD'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href="/spotpay"
            className="bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs text-center transition-colors shadow-sm shadow-brand-sunriseCoral/20"
          >
            {user ? 'Send Money' : 'Open Wallet'}
          </Link>
          <Link
            href="/spotpay"
            className="bg-transparent hover:bg-brand-dusk text-slate-300 font-bold py-2 px-3 rounded-xl text-xs text-center border border-slate-600 transition-colors"
          >
            {user ? 'Add Funds' : 'Learn More'}
          </Link>
        </div>
      </div>

      {/* Upcoming Cultural Fetes & Events */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-brand-sandstone flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-goldenHour" /> Featured Cultural Fetes
          </h3>
          <Link href="/events" className="text-[11px] font-bold text-brand-caribbeanSea hover:underline">
            View all
          </Link>
        </div>

        <div className="space-y-2.5">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href="/events"
                className="p-3 rounded-2xl bg-white/5 border border-white/8 space-y-1 block hover:border-white/20 transition-colors"
              >
                <h4 className="font-bold text-xs text-slate-200 leading-snug">{event.title}</h4>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-brand-sandstone/60">
                    {formatEventDate(event.starts_at)} {event.cities ? `• ${event.cities.name}` : ''}
                  </span>
                  <span className="font-extrabold text-brand-goldenHour">RSVP</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-slate-800 text-center space-y-1.5">
              <p className="text-xs font-semibold text-brand-sandstone/80">No featured cultural fetes right now.</p>
              <p className="text-[11px] text-brand-sandstone/50 leading-relaxed">
                Check back soon for island carnivals, music festivals, and diaspora meetups.
              </p>
              <div className="pt-1">
                <Link href="/events" className="text-[11px] text-brand-caribbeanSea hover:underline font-bold inline-block">
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

