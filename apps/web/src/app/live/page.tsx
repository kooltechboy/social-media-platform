import React, { Suspense } from 'react';
import { Tv, Radio, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import LiveViewerPlayer, { type LivestreamViewItem } from '../../components/live/live-viewer-player';
import { LIVE_CATEGORIES } from '@caribbean/live';

export const dynamic = 'force-dynamic';

export default async function LivePage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; state?: string; category?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { id: activeId, state: streamState, category: selectedCategory, q } = resolvedParams;

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let dbStreams: LivestreamViewItem[] = [];
  if (supabase) {
    let query = supabase
      .from('livestreams')
      .select('id, title, state, access_level, peak_viewers, started_at, creator_id, stream_url, profiles(display_name, username)')
      .order('started_at', { ascending: false })
      .limit(15);

    if (streamState) {
      query = query.eq('state', streamState);
    } else {
      query = query.in('state', ['live', 'scheduled']);
    }

    if (q) {
      query = query.ilike('title', `%${q}%`);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      dbStreams = data.map((d: any) => ({
        id: d.id,
        title: d.title,
        state: d.state,
        access_level: d.access_level,
        peak_viewers: d.peak_viewers || 0,
        started_at: d.started_at,
        creator_id: d.creator_id,
        category: 'Live Broadcast',
        location: 'Caribbean & Diaspora 🌴',
        profiles: d.profiles,
        videoUrl: d.stream_url ?? '',
      }));
    }
  }

  const liveStreams = dbStreams;

  const filteredStreams = selectedCategory && selectedCategory !== 'All Broadcasts'
    ? liveStreams.filter((s) => s.category === selectedCategory || s.title.toLowerCase().includes(selectedCategory.toLowerCase()))
    : liveStreams;

  const featuredStream =
    (activeId ? liveStreams.find((s) => s.id === activeId) : null) ??
    filteredStreams.find((s) => s.state === 'live') ??
    liveStreams[0];

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-red-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
              <Tv className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" /> Caribbean Live Streams
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-brand-sandstone/80 mt-1 leading-relaxed">
            Real-time Caribbean broadcasts, fete streams, sound systems, and interactive creator gifts.
          </p>
        </div>

        {user ? (
          <Link
            href="/live/broadcast"
            className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all self-start md:self-auto min-h-[44px]"
          >
            🔴 Go Live / Broadcast
          </Link>
        ) : (
          <Link
            href="/login?redirect=/live/broadcast"
            className="bg-red-600/20 text-red-300 border border-red-500/40 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-red-600/30 transition-all self-start md:self-auto min-h-[44px]"
          >
            Sign in to Stream
          </Link>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {LIVE_CATEGORIES.map((cat) => {
          const isSelected = (selectedCategory || 'All Broadcasts') === cat;
          return (
            <Link
              key={cat}
              href={cat === 'All Broadcasts' ? '/live' : `/live?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] flex items-center ${
                isSelected
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20 font-black'
                  : 'bg-white/5 border border-white/10 text-brand-sandstone/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {/* Featured Stream Video Player & Live Chat Grid */}
      <Suspense
        fallback={
          <div className="w-full flex items-center justify-center p-20">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <LiveViewerPlayer
          stream={featuredStream}
          user={
            user
              ? {
                  id: user.id,
                  displayName: user.displayName,
                  username: user.username,
                }
              : null
          }
        />
      </Suspense>

      {/* More Caribbean Broadcasts Grid */}
      <div className="space-y-4 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-caribbeanSea" /> Active Island &amp; Diaspora Broadcasts
          </h3>
          <span className="text-xs text-brand-sandstone/60 font-bold">
            {filteredStreams.length} Broadcasts Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStreams.length === 0 && (
            <div className="col-span-full surface-card rounded-3xl p-10 text-center space-y-3 border border-white/10">
              <span className="text-4xl">🎙️</span>
              <p className="text-base font-black text-white">No live broadcasts right now</p>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">Be the first to go live and connect the Caribbean diaspora!</p>
              {user && (
                <Link
                  href="/live/broadcast"
                  className="inline-flex mt-2 bg-red-600 hover:bg-red-500 text-white font-black px-6 py-2.5 rounded-xl text-xs items-center gap-1.5 transition-all shadow-md shadow-red-600/30 min-h-[44px]"
                >
                  🔴 Start Broadcasting
                </Link>
              )}
            </div>
          )}
          {filteredStreams.map((stream) => {
            const isFeatured = featuredStream && stream.id === featuredStream.id;
            return (
              <Link
                key={stream.id}
                href={`/live?id=${stream.id}`}
                className={`surface-card rounded-2xl p-5 transition-all cursor-pointer group shadow-lg space-y-3.5 block border ${
                  isFeatured
                    ? 'border-red-500/80 ring-2 ring-red-500/30'
                    : 'surface-card-interactive'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    stream.state === 'live'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                      : 'bg-brand-goldenHour/20 text-amber-300 border-brand-goldenHour/40'
                  }`}>
                    {stream.state === 'live' ? '🔴 LIVE NOW' : '📅 UPCOMING'}
                  </span>
                  <span className="text-xs font-bold text-brand-sandstone/70">{stream.peak_viewers.toLocaleString()} viewers</span>
                </div>
                <h4 className="font-black text-sm sm:text-base text-white leading-snug group-hover:text-brand-caribbeanSea transition-colors line-clamp-2">
                  {stream.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-brand-sandstone/70 pt-2 border-t border-white/10">
                  <span>{stream.profiles?.display_name ?? 'Broadcaster'}</span>
                  <span className="text-brand-caribbeanSea font-black">{isFeatured ? 'Watching Now ✓' : 'Watch Stream →'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
