import React from 'react';
import { Video, Music, Heart, MessageCircle, Share2, Wallet, Play, Sparkles, Volume2, UserCheck, Flame } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

interface VideoRow {
  id: string;
  title: string;
  creator: string;
  handle: string;
  views: string;
  likes: string;
  comments: string;
  sound: string;
  location: string;
  duration: string;
  gradient: string;
}

const SHOWCASE_REELS: VideoRow[] = [
  {
    id: 'reel-1',
    title: 'Carnival Road March 2026 Sneak Peek! Costume fitting and pure energy on the avenue 🎭✨',
    creator: 'Maya Chen',
    handle: 'mayasoca',
    views: '84.2K',
    likes: '14.5K',
    comments: '1,240',
    sound: 'Machel Montano • Soca Anthem 2026',
    location: 'Port of Spain, Trinidad 🇹🇹',
    duration: '0:45',
    gradient: 'from-purple-900/60 via-slate-900 to-[#090D16]',
  },
  {
    id: 'reel-2',
    title: 'Secret jerk chicken recipe from Portland, Jamaica. Firewood and pimento wood smoking all morning 🇯🇲🍗',
    creator: 'Chef Andre Black',
    handle: 'andrejerk',
    views: '112.0K',
    likes: '22.8K',
    comments: '2,890',
    sound: 'Bob Marley • Roots Rock Reggae',
    location: 'Portland, Jamaica 🇯🇲',
    duration: '0:58',
    gradient: 'from-amber-900/60 via-slate-900 to-[#090D16]',
  },
  {
    id: 'reel-3',
    title: 'Sunset bachata session on the Malecón in Santo Domingo with the local academy 🇩🇴💃',
    creator: 'Lucia & Mateo',
    handle: 'luciamateo',
    views: '96.3K',
    likes: '18.1K',
    comments: '940',
    sound: 'Juan Luis Guerra • Bachata Rosa',
    location: 'Santo Domingo, Dominican Rep. 🇩🇴',
    duration: '0:35',
    gradient: 'from-sky-900/60 via-slate-900 to-[#090D16]',
  },
];

export default async function ReelsPage() {
  const user = await getCurrentUser();
  const featured = SHOWCASE_REELS[0];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col items-center justify-start p-4 gap-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
            <Video className="w-6 h-6 text-rose-500" /> Caribbean Reels &amp; Shorts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Short-form video, Caribbean Sounds, and creator monetization powered by SpotPay.
          </p>
        </div>
        <Link
          href="/creator-studio"
          className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black px-4 py-2 rounded-2xl text-xs transition-all shadow-md shadow-rose-500/20"
        >
          + Upload Short
        </Link>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center">
        {/* Main Short Video Player (Col 7) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[660px] flex flex-col justify-between p-5">
            {/* Cinematic Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-t ${featured.gradient}`} />

            {/* Top Bar */}
            <div className="flex items-center justify-between z-10 relative">
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-slate-950/80 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 fill-current" /> CARIBBEAN SOUNDS
              </span>
              <span className="text-xs font-bold text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-full backdrop-blur-md border border-slate-800">
                {featured.views} views
              </span>
            </div>

            {/* Center Visual Wave & Play Container */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-3 px-6">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto text-white shadow-xl shadow-rose-500/20">
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold">{featured.sound}</span>
                </div>
              </div>
            </div>

            {/* Right Action Icons Bar */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4 z-10">
              <button className="flex flex-col items-center gap-1 text-slate-200 hover:text-rose-400 transition-colors group">
                <div className="w-11 h-11 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                </div>
                <span className="text-[11px] font-bold text-slate-300">{featured.likes}</span>
              </button>

              <button className="flex flex-col items-center gap-1 text-slate-200 hover:text-sky-400 transition-colors group">
                <div className="w-11 h-11 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5 text-sky-400" />
                </div>
                <span className="text-[11px] font-bold text-slate-300">{featured.comments}</span>
              </button>

              <button className="flex flex-col items-center gap-1 text-slate-200 hover:text-emerald-400 transition-colors group">
                <div className="w-11 h-11 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-bold text-slate-300">Share</span>
              </button>

              <Link
                href="/spotpay"
                className="flex flex-col items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-400">Tip</span>
              </Link>
            </div>

            {/* Bottom Caption & Creator Info */}
            <div className="z-10 relative space-y-2 max-w-[78%]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">@{featured.handle}</span>
                <button className="text-[10px] font-black text-slate-950 bg-white hover:bg-slate-200 px-2.5 py-0.5 rounded-full transition-all">
                  Follow
                </button>
              </div>
              <p className="text-xs text-slate-200 leading-snug font-medium line-clamp-2">
                {featured.title}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>{featured.location}</span>
                <span>•</span>
                <span>{featured.duration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Up Next & Trending Sounds (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-400" /> More Caribbean Shorts
            </h3>

            <div className="space-y-3">
              {SHOWCASE_REELS.slice(1).map((reel) => (
                <div
                  key={reel.id}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/60 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-t ${reel.gradient}`} />
                    <Play className="w-5 h-5 text-white z-10 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[10px] font-bold text-sky-400">{reel.location}</span>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition-colors line-clamp-1">
                      {reel.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">@{reel.handle} • {reel.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Caribbean Sounds Directory */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 border border-rose-500/20 rounded-3xl p-5 space-y-3 shadow-lg">
            <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4" /> Trending Caribbean Sounds
            </h4>
            <p className="text-xs text-slate-300">
              Use official stems and tracks from Caribbean artists in your short videos.
            </p>
            <div className="space-y-2 pt-1">
              {[
                { track: 'Soca Monarch Anthem', artist: 'Trini All Stars', count: '45.2K Videos' },
                { track: 'Dubplate Sound #4', artist: 'Kingston Dub Unit', count: '28.1K Videos' },
                { track: 'Bachata de la Noche', artist: 'Quisqueya Sound', count: '19.4K Videos' },
              ].map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 text-xs">
                  <div>
                    <p className="font-bold text-slate-200">{s.track}</p>
                    <p className="text-[11px] text-slate-500">{s.artist}</p>
                  </div>
                  <span className="text-[10px] font-black text-rose-400">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
