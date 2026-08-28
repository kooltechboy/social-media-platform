import React, { Suspense } from 'react';
import { Tv, Radio, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import LiveViewerPlayer, { type LivestreamViewItem } from '../../components/live/live-viewer-player';
import { LIVE_CATEGORIES } from '@caribbean/live';

export const dynamic = 'force-dynamic';

const SHOWCASE_LIVE_STREAMS: LivestreamViewItem[] = [
  {
    id: 'live-showcase-1',
    title: 'Kingston Sound System Session • Vinyl Dubplates & Live MC',
    state: 'live',
    access_level: 'public',
    peak_viewers: 1420,
    started_at: new Date(Date.now() - 35 * 60000).toISOString(),
    creator_id: 'creator-1',
    category: 'Sound Systems & Dub',
    location: 'Kingston, Jamaica 🇯🇲',
    profiles: { display_name: 'Zion Sound Kingston', username: 'zionsound' },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-caribbean-tropical-beach-with-turquoise-water-41221-large.mp4',
  },
  {
    id: 'live-showcase-2',
    title: 'Trinidad Carnival 2026 Band Launch: Live Avenue Broadcast',
    state: 'live',
    access_level: 'public',
    peak_viewers: 2890,
    started_at: new Date(Date.now() - 15 * 60000).toISOString(),
    creator_id: 'creator-2',
    category: 'Carnival & Mas',
    location: 'Port of Spain, Trinidad 🇹🇹',
    profiles: { display_name: 'Carnival Nation TT', username: 'carnivalnation' },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-seashore-with-rocks-and-turquoise-water-41487-large.mp4',
  },
  {
    id: 'live-showcase-3',
    title: 'Santo Domingo Sunset Acoustic & Bachata Classics',
    state: 'scheduled',
    access_level: 'public',
    peak_viewers: 450,
    started_at: null,
    creator_id: 'creator-3',
    category: 'Acoustic & Bachata',
    location: 'Santo Domingo, DR 🇩🇴',
    profiles: { display_name: 'Quisqueya Live', username: 'quisqueyalive' },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-with-sun-rays-41617-large.mp4',
  },
];

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
      .select('id, title, state, access_level, peak_viewers, started_at, creator_id, profiles(display_name, username)')
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
        peak_viewers: d.peak_viewers || 1,
        started_at: d.started_at,
        creator_id: d.creator_id,
        category: 'Live Broadcast',
        location: 'Caribbean & Diaspora 🌴',
        profiles: d.profiles,
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-caribbean-tropical-beach-with-turquoise-water-41221-large.mp4',
      }));
    }
  }

  const liveStreams = dbStreams.length > 0 ? [...dbStreams, ...SHOWCASE_LIVE_STREAMS] : SHOWCASE_LIVE_STREAMS;

  const filteredStreams = selectedCategory && selectedCategory !== 'All Broadcasts'
    ? liveStreams.filter((s) => s.category === selectedCategory || s.title.toLowerCase().includes(selectedCategory.toLowerCase()))
    : liveStreams;

  const featuredStream =
    (activeId ? liveStreams.find((s) => s.id === activeId) : null) ??
    filteredStreams.find((s) => s.state === 'live') ??
    liveStreams[0];

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone flex items-center gap-3">
              <Tv className="w-8 h-8 text-red-500" /> Caribbean Live Streams
            </h1>
          </div>
          <p className="text-xs md:text-sm text-brand-sandstone/60 mt-1">
            Real-time Caribbean broadcasts, fete streams, sound systems, and SpotPay virtual gifts.
          </p>
        </div>

        {user ? (
          <Link
            href="/live/broadcast"
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all self-start md:self-auto"
          >
            🔴 Go Live / Broadcast
          </Link>
        ) : (
          <Link
            href="/login?redirect=/live/broadcast"
            className="bg-red-600/20 text-red-300 border border-red-500/40 font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 hover:bg-red-600/30 transition-all self-start md:self-auto"
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-brand-dusk border border-slate-800 text-brand-sandstone/60 hover:text-slate-200'
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
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-brand-sandstone uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-caribbeanSea" /> Active Island &amp; Diaspora Broadcasts
          </h3>
          <span className="text-xs text-brand-sandstone/40 font-bold">
            {filteredStreams.length} Broadcasts Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStreams.map((stream) => {
            const isFeatured = stream.id === featuredStream.id;
            return (
              <Link
                key={stream.id}
                href={`/live?id=${stream.id}`}
                className={`border rounded-3xl p-5 transition-all cursor-pointer group shadow-lg space-y-3 block ${
                  isFeatured
                    ? 'bg-brand-dusk border-red-500/60 ring-2 ring-red-500/20'
                    : 'bg-brand-dusk/80 border-slate-800 hover:border-red-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    stream.state === 'live'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
                      : 'bg-brand-goldenHour/20 text-amber-300 border-brand-goldenHour/30'
                  }`}>
                    {stream.state === 'live' ? '🔴 LIVE NOW' : '📅 UPCOMING'}
                  </span>
                  <span className="text-[11px] font-bold text-brand-sandstone/60">{stream.peak_viewers.toLocaleString()} viewers</span>
                </div>
                <h4 className="font-extrabold text-sm text-brand-sandstone leading-snug group-hover:text-brand-caribbeanSea transition-colors line-clamp-2">
                  {stream.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-brand-sandstone/60 pt-1 border-t border-slate-800/60">
                  <span>{stream.profiles?.display_name ?? 'Broadcaster'}</span>
                  <span className="text-brand-caribbeanSea font-bold">{isFeatured ? 'Watching Now ✓' : 'Watch Stream →'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
