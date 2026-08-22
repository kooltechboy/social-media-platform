import React from 'react';
import { Tv, Flame, Gift, MessageSquare, Send, Plus } from 'lucide-react';
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

interface LiveMessage {
  id: number;
  body: string;
  sender_id: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export default async function LivePage() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let liveStreams: Livestream[] = [];
  let featuredStream: Livestream | null = null;
  let recentMessages: LiveMessage[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('livestreams')
      .select('id, title, state, access_level, peak_viewers, started_at, creator_id, profiles(display_name, username)')
      .in('state', ['live', 'scheduled'])
      .order('started_at', { ascending: false })
      .limit(12);
    liveStreams = (data ?? []) as unknown as Livestream[];
    featuredStream = liveStreams.find((s) => s.state === 'live') ?? liveStreams[0] ?? null;

    if (featuredStream) {
      const { data: msgs } = await supabase
        .from('live_messages')
        .select('id, body, sender_id, created_at, profiles(display_name)')
        .eq('livestream_id', featuredStream.id)
        .is('removed_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      recentMessages = ((msgs ?? []) as unknown as LiveMessage[]).reverse();
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Tv className="w-7 h-7 text-red-500 animate-pulse" /> Live Streams
        </h1>
        {user ? (
          <Link
            href="/creator-studio"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            🔴 Go Live Now
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-red-600/30 text-red-300 border border-red-500/40 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            Sign in to Go Live
          </Link>
        )}
      </div>

      {!featuredStream ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Tv className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No live streams right now.</p>
          <p className="text-xs text-slate-500 mt-1">Caribbean creators will appear here when they go live.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Player */}
          <div className="col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center relative p-6">
              {featuredStream.state === 'live' && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  🔴 LIVE · {featuredStream.peak_viewers.toLocaleString()} peak viewers
                </span>
              )}
              {featuredStream.state === 'scheduled' && (
                <span className="absolute top-4 left-4 bg-amber-600/80 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  📅 SCHEDULED
                </span>
              )}
              <div className="text-center space-y-2">
                <span className="text-5xl">📡</span>
                <h3 className="text-base font-bold text-white max-w-sm">{featuredStream.title}</h3>
                <p className="text-xs text-slate-400">
                  {featuredStream.state === 'live'
                    ? 'Stream in progress — RTMP/WebRTC ingest active'
                    : 'Stream scheduled — waiting for host to go live'}
                </p>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between bg-slate-900 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center text-sm">
                  {(featuredStream.profiles?.display_name ?? 'C').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{featuredStream.profiles?.display_name ?? 'Creator'}</h4>
                  <p className="text-xs text-slate-400">
                    {featuredStream.access_level} stream
                    {featuredStream.started_at ? ` · started ${relativeTime(featuredStream.started_at)}` : ''}
                  </p>
                </div>
              </div>
              <LiveGiftModal livestreamId={featuredStream.id} isAuthenticated={!!user} />
            </div>
          </div>

          {/* Live Chat */}
          <LiveChatClient
            livestreamId={featuredStream.id}
            initialMessages={recentMessages.map((m) => ({
              id: String(m.id),
              body: m.body,
              sender_id: m.sender_id,
              display_name: m.profiles?.display_name ?? 'Viewer',
              created_at: m.created_at,
            }))}
            isLive={featuredStream.state === 'live'}
            isAuthenticated={!!user}
          />
        </div>
      )}

      {/* Other streams */}
      {liveStreams.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">More Streams</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {liveStreams.slice(1).map((stream) => (
              <div
                key={stream.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-red-500/40 rounded-2xl p-4 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    stream.state === 'live'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {stream.state === 'live' ? '🔴 LIVE' : '📅 SCHEDULED'}
                  </span>
                  <span className="text-[10px] text-slate-500">{stream.peak_viewers} peak</span>
                </div>
                <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">{stream.title}</h4>
                <p className="text-xs text-slate-400">{stream.profiles?.display_name ?? 'Creator'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
