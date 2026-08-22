import React from 'react';
import { Tv, Flame, Gift, MessageSquare, Send, Plus, Users, Radio, Sparkles, Volume2, Shield } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import LiveChatClient from '../../components/live-chat-client';
import { LiveGiftModal } from '../../components/live-gift-modal';

export const dynamic = 'force-dynamic';

interface Livestream {
  id: string;
  title: string;
  state: 'scheduled' | 'live' | 'ended' | 'cancelled';
  access_level: string;
  peak_viewers: number;
  started_at: string | null;
  creator_id: string;
  profiles: { display_name: string; username: string } | null;
}

const SHOWCASE_LIVE_STREAMS = [
  {
    id: 'live-showcase-1',
    title: 'Kingston Sound System Session • Vinyl Dubplates & Live MC',
    state: 'live' as const,
    access_level: 'public',
    peak_viewers: 1420,
    started_at: new Date(Date.now() - 35 * 60000).toISOString(),
    creator_id: 'creator-1',
    category: 'Sound Systems & Dub',
    location: 'Kingston, Jamaica 🇯🇲',
    profiles: { display_name: 'Zion Sound Kingston', username: 'zionsound' },
  },
  {
    id: 'live-showcase-2',
    title: 'Trinidad Carnival 2026 Band Launch: Live Avenue Broadcast',
    state: 'live' as const,
    access_level: 'public',
    peak_viewers: 2890,
    started_at: new Date(Date.now() - 15 * 60000).toISOString(),
    creator_id: 'creator-2',
    category: 'Carnival & Mas',
    location: 'Port of Spain, Trinidad 🇹🇹',
    profiles: { display_name: 'Carnival Nation TT', username: 'carnivalnation' },
  },
  {
    id: 'live-showcase-3',
    title: 'Santo Domingo Sunset Acoustic & Bachata Classics',
    state: 'scheduled' as const,
    access_level: 'public',
    peak_viewers: 450,
    started_at: null,
    creator_id: 'creator-3',
    category: 'Acoustic & Bachata',
    location: 'Santo Domingo, DR 🇩🇴',
    profiles: { display_name: 'Quisqueya Live', username: 'quisqueyalive' },
  },
];

export default async function LivePage() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let liveStreams: Livestream[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('livestreams')
      .select('id, title, state, access_level, peak_viewers, started_at, creator_id, profiles(display_name, username)')
      .in('state', ['live', 'scheduled'])
      .order('started_at', { ascending: false })
      .limit(12);
    if (data && data.length > 0) {
      liveStreams = data as unknown as Livestream[];
    }
  }

  if (liveStreams.length === 0) {
    liveStreams = SHOWCASE_LIVE_STREAMS as unknown as Livestream[];
  }

  const featuredStream = liveStreams.find((s) => s.state === 'live') ?? liveStreams[0];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Tv className="w-8 h-8 text-red-500" /> Caribbean Live Streams
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Real-time Caribbean broadcasts, fete streams, podcasts, and SpotPay virtual gifts.
          </p>
        </div>

        {user ? (
          <Link
            href="/creator-studio"
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all self-start md:self-auto"
          >
            🔴 Broadcast Live
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-red-600/20 text-red-300 border border-red-500/40 font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 hover:bg-red-600/30 transition-all self-start md:self-auto"
          >
            Sign in to Stream
          </Link>
        )}
      </div>

      {/* Main Broadcast Container & Live Chat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stream Ingest Video Container (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center relative p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-red-950/40 via-slate-950 to-slate-900" />

              {/* Status Pill */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" /> LIVE
                </span>
                <span className="bg-slate-950/80 backdrop-blur-md text-slate-200 text-xs font-bold px-3 py-1 rounded-full border border-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" /> {featuredStream.peak_viewers.toLocaleString()} watching
                </span>
              </div>

              {/* Center Broadcast Graphics */}
              <div className="text-center space-y-3 z-10 max-w-md px-4">
                <div className="w-20 h-20 rounded-3xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 shadow-2xl shadow-red-500/20">
                  <Tv className="w-10 h-10" />
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-white leading-snug">
                  {featuredStream.title}
                </h3>
                <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                  <span>WebRTC / Ultra-low Latency Ingest</span>
                  <span>•</span>
                  <span>1080p 60fps</span>
                </p>
              </div>
            </div>

            {/* Streamer Info Bar & SpotPay Gifts CTA */}
            <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border-t border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                  {(featuredStream.profiles?.display_name ?? 'CO').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">{featuredStream.profiles?.display_name ?? 'Caribbean Host'}</h4>
                  <p className="text-xs text-slate-400">
                    @{featuredStream.profiles?.username ?? 'creator'} • Verified Caribbean Broadcaster
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <LiveGiftModal livestreamId={featuredStream.id} isAuthenticated={!!user} />
              </div>
            </div>
          </div>
        </div>

        {/* Live Chat Column (Col 4) */}
        <div className="lg:col-span-4">
          <LiveChatClient
            livestreamId={featuredStream.id}
            initialMessages={[
              { id: '1', body: 'Big up from London! Loving the vibes 🔥', sender_id: null, display_name: 'Marcus_UK', created_at: new Date().toISOString() },
              { id: '2', body: 'Sound system heavy tonight! 🇯🇲🔊', sender_id: null, display_name: 'Kingston_Dub', created_at: new Date().toISOString() },
              { id: '3', body: 'Sent 1x Carnival Crown via SpotPay! 👑', sender_id: null, display_name: 'SocaLover99', created_at: new Date().toISOString() },
            ]}
            isLive={featuredStream.state === 'live'}
            isAuthenticated={!!user}
          />
        </div>
      </div>

      {/* More Caribbean Broadcasts Grid */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" /> Active Island &amp; Diaspora Broadcasts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveStreams.map((stream) => (
            <div
              key={stream.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-red-500/50 rounded-3xl p-5 transition-all cursor-pointer group shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  stream.state === 'live'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {stream.state === 'live' ? '🔴 LIVE NOW' : '📅 UPCOMING'}
                </span>
                <span className="text-[11px] font-bold text-slate-400">{stream.peak_viewers} viewers</span>
              </div>
              <h4 className="font-extrabold text-sm text-white leading-snug group-hover:text-sky-400 transition-colors line-clamp-2">
                {stream.title}
              </h4>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                <span>{stream.profiles?.display_name ?? 'Broadcaster'}</span>
                <span className="text-sky-400 font-bold">Watch Stream →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
