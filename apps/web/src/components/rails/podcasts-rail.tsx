'use client';

import React from 'react';
import Link from 'next/link';
import {
  Mic,
  PlusCircle,
  Headphones,
  Flame,
  Radio,
  ChevronRight,
  Star,
} from 'lucide-react';

export default function PodcastsRail() {
  const PODCAST_CATEGORIES = [
    'Culture & Heritage',
    'Caribbean Music & Soca',
    'Diaspora Politics',
    'Business & Technology',
    'Comedy & Stories',
    'Sports & Cricket',
  ];

  return (
    <div className="space-y-5">
      {/* 1. Host Podcast CTA */}
      <div className="glass rounded-3xl p-5 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent space-y-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-400 to-brand-sunriseCoral flex items-center justify-center text-slate-950 font-black shadow-md">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Host a Podcast</h3>
            <p className="text-[10px] text-brand-sandstone/60">
              Caribbean audio network
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Distribute your audio stories, discussions, and interviews across the Caribbean diaspora.
        </p>
        <Link
          href="/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-purple-400 hover:bg-purple-300 text-slate-950 font-black text-xs transition-all shadow-md"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>Publish Episode</span>
        </Link>
      </div>

      {/* 2. Podcasts Channels */}
      <section aria-label="Podcast Navigation" className="glass rounded-3xl p-4 sm:p-5 space-y-2 border border-white/10">
        <h4 className="text-xs font-black text-white uppercase tracking-wider">
          Audio Channels
        </h4>
        <nav className="space-y-1 pt-1">
          <Link
            href="/podcasts"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-purple-400" />
              Discover Shows
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </Link>
          <Link
            href="/podcasts?tab=trending"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-brand-goldenHour" />
              Trending Episodes
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </Link>
        </nav>
      </section>

      {/* 3. Audio Categories */}
      <section aria-label="Podcast Categories" className="glass rounded-3xl p-4 sm:p-5 space-y-2.5 border border-white/10">
        <h4 className="text-xs font-black text-white uppercase tracking-wider">
          Categories
        </h4>
        <div className="space-y-1 pt-0.5">
          {PODCAST_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/podcasts?category=${encodeURIComponent(cat)}`}
              className="flex items-center justify-between p-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span>{cat}</span>
              <ChevronRight className="w-3 h-3 text-white/30" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
