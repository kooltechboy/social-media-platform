'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RotateCcw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen w-full bg-transparent text-brand-sandstone flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-caribbeanSea/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-sunriseCoral/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full glass bg-brand-dusk/80 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Emblem */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral p-[1.5px] shadow-xl shadow-brand-caribbeanSea/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#0A1428] rounded-2xl flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-brand-goldenHour" aria-hidden="true" />
          </div>
        </div>

        {/* Brand & Heading */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-brand-caribbeanSea">
            TUKUBI
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            You’re Offline
          </h1>
          <p className="text-sm text-brand-sandstone/70 leading-relaxed">
            Your device is disconnected from the internet. Reconnect to resume your Caribbean connection, live broadcasts, and community updates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral hover:opacity-95 text-slate-950 font-black text-sm py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-brand-caribbeanSea/25 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Try Reconnecting</span>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-brand-sandstone text-xs font-bold py-3 px-6 rounded-2xl border border-white/10 transition-colors"
          >
            <Home className="w-4 h-4 text-brand-caribbeanSea" aria-hidden="true" />
            <span>Return to Home</span>
          </Link>
        </div>

        <p className="text-[11px] text-brand-sandstone/40 pt-2">
          TUKUBI — The Caribbean Connected.
        </p>
      </div>
    </div>
  );
}
