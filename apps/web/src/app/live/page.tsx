import React from 'react';
import { Tv, Flame, Gift, MessageSquare, Users, Send } from 'lucide-react';

export default function LivePage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Tv className="w-7 h-7 text-red-500 animate-pulse" /> Live Streams & Virtual Gifting
        </h1>
        <button className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors">
          🔴 Go Live Now (RTMP / WebRTC)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Video Player Stream */}
        <div className="col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center relative p-6">
            <span className="absolute top-4 left-4 bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              LIVE • 3,420 Viewers
            </span>
            <div className="text-center space-y-2">
              <span className="text-5xl">🇹🇹</span>
              <h3 className="text-base font-bold text-white">Live from Port of Spain: Trinidad Carnival Band Launch 2026</h3>
              <p className="text-xs text-slate-400">Streamed via Cloudflare Stream / Livepeer RTMPS Ingest</p>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between bg-slate-900 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center">
                TT
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Soca Carnival Live</h4>
                <p className="text-xs text-slate-400">Host • Port of Spain, Trinidad</p>
              </div>
            </div>
            <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
              <Gift className="w-4 h-4" /> Send Gift ($5)
            </button>
          </div>
        </div>

        {/* Live Chat & Tipping Queue */}
        <div className="col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[480px]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-4 h-4 text-sky-400" /> Live Chat
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 py-3 text-xs">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-bold text-sky-400">@KingstonVibes 🇯🇲:</span> Big vibes from Toronto! 🔥
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-amber-500/30">
              <span className="font-bold text-amber-400">@SantoDomingo 🇩🇴:</span> Sent 🎁 Caribbean Gold Gift! ($10)
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <input 
              type="text" 
              placeholder="Send live message..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <button className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
