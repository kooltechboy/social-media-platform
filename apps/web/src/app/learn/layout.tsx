import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, LifeBuoy, ArrowLeft, Compass, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TUKUBI Learn — Master Caribbean Digital Culture, Creation & Commerce',
  description: 'Interactive learning paths, masterclasses, and comprehensive tutorials for TUKUBI creators, members, and entrepreneurs.',
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen text-brand-sandstone animate-fadeIn pb-16">
      {/* Top Banner Navigation Bar */}
      <div className="surface-header sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-semibold text-brand-sandstone/60 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to TUKUBI
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/learn" className="flex items-center gap-2 font-black text-white text-sm sm:text-base tracking-tight hover:opacity-90">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500 via-brand-caribbeanSea to-brand-sunriseCoral p-0.5 flex items-center justify-center shadow-md">
              <GraduationCap className="w-4 h-4 text-slate-950" />
            </span>
            <span>TUKUBI <span className="text-purple-400">Learn</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
          <Link
            href="/help"
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all flex items-center gap-1.5"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-brand-caribbeanSea" />
            <span className="hidden sm:inline">Help Center</span>
          </Link>
          <Link
            href="/creator-hub"
            className="px-3.5 py-1.5 rounded-xl bg-brand-goldenHour/10 hover:bg-brand-goldenHour/20 border border-brand-goldenHour/30 text-brand-goldenHour transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Creator Hub</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {children}
      </div>
    </div>
  );
}
