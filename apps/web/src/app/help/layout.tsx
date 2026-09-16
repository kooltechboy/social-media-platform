import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, GraduationCap, ArrowLeft, LifeBuoy, Compass, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TUKUBI Help Center — The Caribbean Connected',
  description: 'Guides, troubleshooting, FAQs, and documentation for the TUKUBI Caribbean social, creator, and commerce platform.',
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
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
          <Link href="/help" className="flex items-center gap-2 font-black text-white text-sm sm:text-base tracking-tight hover:opacity-90">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral p-0.5 flex items-center justify-center shadow-md">
              <LifeBuoy className="w-4 h-4 text-slate-950" />
            </span>
            <span>TUKUBI <span className="text-brand-caribbeanSea">Help</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
          <Link
            href="/learn"
            className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 transition-all flex items-center gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Learn Center</span>
          </Link>
          <Link
            href="/explore"
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-brand-goldenHour" />
            <span className="hidden sm:inline">Explore</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {children}
      </div>
    </div>
  );
}
