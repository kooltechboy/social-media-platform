'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Radio, Video, Users, Sparkles } from 'lucide-react';

export interface ActiveLiveStream {
  id: string;
  title?: string | null;
  peak_viewers?: number | null;
  profiles?: {
    display_name?: string | null;
    username?: string | null;
  } | null | Array<{
    display_name?: string | null;
    username?: string | null;
  }>;
}

export interface LiveBroadcastDiscoveryProps {
  activeStream?: ActiveLiveStream | null;
  className?: string;
}

export default function LiveBroadcastDiscovery({
  activeStream = null,
  className = '',
}: LiveBroadcastDiscoveryProps) {
  // If real active live stream exists, render rich live discovery banner
  if (activeStream) {
    const rawProfile = activeStream.profiles;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    const hostName = profile?.display_name || profile?.username || 'Caribbean Creator';
    const streamTitle = activeStream.title || 'Live Caribbean Broadcast';
    const viewers = activeStream.peak_viewers || 1;

    return (
      <section
        aria-label="Active Caribbean Live Broadcast"
        className={`glass-aerospace rounded-2xl p-4 sm:p-5 border border-red-500/30 bg-gradient-to-r from-red-950/40 via-[#100B1A]/80 to-slate-900/60 shadow-xl relative overflow-hidden group ${className}`}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Live Indicator Beacon */}
            <div className="relative flex-shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping absolute inset-0" />
              <span className="relative block w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-[#0A0F22] shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE NOW
                </span>
                <span className="text-xs font-bold text-brand-sandstone/70 flex items-center gap-1">
                  <Users className="w-3 h-3 text-red-400" /> {viewers.toLocaleString()} watching
                </span>
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-white truncate tracking-tight">
                {streamTitle}
              </h4>
              <p className="text-xs text-brand-sandstone/60 truncate">
                Hosted by <strong className="text-white/80">{hostName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <Link
              href={`/live?id=${activeStream.id}`}
              className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-red-600/30 min-h-[44px] active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" /> Watch Live
            </Link>
            <Link
              href="/live/broadcast"
              className="hidden md:inline-flex bg-white/5 hover:bg-white/10 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs items-center gap-1.5 border border-white/10 transition-colors min-h-[44px]"
            >
              <Video className="w-3.5 h-3.5 text-red-400" /> Go Live
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // When no active stream exists: Sleek, compact discovery strip with minimal vertical footprint
  return (
    <section
      aria-label="Caribbean Live Discovery"
      className={`glass rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 border border-white/8 bg-[#0C1124]/60 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-2 h-2 rounded-full bg-red-400/80" />
        <div className="flex items-center gap-2 truncate">
          <span className="font-extrabold text-xs text-brand-sandstone uppercase tracking-wider">
            Caribbean Live
          </span>
          <span className="text-[11px] text-white/50 hidden sm:inline truncate">
            Broadcast fete audio, dub sessions, or talk shows across the diaspora
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/live/broadcast"
          className="text-white hover:text-red-300 font-extrabold text-xs flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 transition-colors min-h-[36px]"
        >
          <span className="text-red-400">🔴</span> Go Live
        </Link>
        <Link
          href="/live"
          className="text-white/70 hover:text-white font-bold text-xs flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors min-h-[36px]"
        >
          Watch Streams →
        </Link>
      </div>
    </section>
  );
}
