import React from 'react';
import { Radio, Video, Mic, DollarSign, Users, TrendingUp, BarChart2 } from 'lucide-react';

export default function CreatorStudioPage() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Radio className="w-8 h-8 text-sky-400" /> Caribbean Creator Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your audio & video podcasts, live streams, subscribers, SpotPay tips, and virtual gift revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors">
            <Mic className="w-4 h-4" /> New Podcast Episode
          </button>
          <button className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors">
            <Video className="w-4 h-4" /> Start Live Stream
          </button>
        </div>
      </div>

      {/* Creator Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Total Subscribers
          </span>
          <div className="text-2xl font-black text-white">14,250</div>
          <span className="text-[11px] text-emerald-400 font-semibold">+12% this month</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> SpotPay Revenue
          </span>
          <div className="text-2xl font-black text-white">$1,850.00</div>
          <span className="text-[11px] text-slate-400">Available for Payout</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" /> Podcast Downloads
          </span>
          <div className="text-2xl font-black text-white">84,100</div>
          <span className="text-[11px] text-amber-400 font-semibold">Across 48 Episodes</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" /> Live Gifts Received
          </span>
          <div className="text-2xl font-black text-white">412 Gifts</div>
          <span className="text-[11px] text-slate-400">Value: $620 USD</span>
        </div>
      </div>
    </div>
  );
}
