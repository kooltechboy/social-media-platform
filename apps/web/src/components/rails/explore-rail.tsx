'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  MapPin,
  TrendingUp,
  Users,
  Calendar,
  ShoppingBag,
  Music,
  Utensils,
  Globe,
  Sparkles,
  Flame,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import {
  resolveGeography,
  CANONICAL_GEOGRAPHIES,
  type CanonicalGeography,
} from '../../lib/explore/canonical-geography';
import GeographyFlag from '../geography-flag';

export interface ExploreRailProps {
  activeGeoKey?: string | null;
  activeContentType?: string | null;
  trendingSignals?: any[];
}

export default function ExploreRail({
  activeGeoKey,
  activeContentType = 'all',
  trendingSignals = [],
}: ExploreRailProps) {
  const geography: CanonicalGeography | null = activeGeoKey ? resolveGeography(activeGeoKey) : null;

  // Selected Geography Contextual Engine
  if (geography) {
    const demonymOrName = geography.name;
    const CONTEXT_ACTIONS = [
      {
        id: 'news',
        label: `${demonymOrName} News & Feed`,
        href: `/explore?geo=${geography.slug}&type=posts`,
        icon: Globe,
        color: 'text-sky-400',
      },
      {
        id: 'creators',
        label: `${demonymOrName} Creators`,
        href: `/explore?geo=${geography.slug}&type=creators`,
        icon: Sparkles,
        color: 'text-brand-goldenHour',
      },
      {
        id: 'communities',
        label: `${demonymOrName} Communities`,
        href: `/explore?geo=${geography.slug}&type=communities`,
        icon: Users,
        color: 'text-brand-caribbeanSea',
      },
      {
        id: 'events',
        label: `${demonymOrName} Cultural Events`,
        href: `/explore?geo=${geography.slug}&type=events`,
        icon: Calendar,
        color: 'text-amber-400',
      },
      {
        id: 'marketplace',
        label: `${demonymOrName} Marketplace`,
        href: `/marketplace?territory=${geography.iso}`,
        icon: ShoppingBag,
        color: 'text-brand-sunriseCoral',
      },
      {
        id: 'music',
        label: `${demonymOrName} Sounds & Rhythms`,
        href: `/explore?geo=${geography.slug}&type=music`,
        icon: Music,
        color: 'text-rose-400',
      },
    ];

    return (
      <div className="space-y-5">
        {/* 1. Geography Identity Card */}
        <div className="glass rounded-3xl p-5 border border-white/15 bg-gradient-to-b from-brand-caribbeanSea/15 via-white/5 to-transparent space-y-3.5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-caribbeanSea px-2 py-0.5 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/30 inline-block">
                {geography.region}
              </span>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>{geography.flagEmoji}</span>
                <span>{geography.name}</span>
              </h3>
              <p className="text-[11px] text-brand-sandstone/70">
                {geography.officialName}
              </p>
            </div>
            <Link
              href="/explore"
              className="text-[10px] font-bold text-brand-sandstone/60 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              Reset
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-brand-sandstone/50 block text-[9px] uppercase font-bold">Capital</span>
              <span className="font-bold text-white truncate block">{geography.capital || 'N/A'}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-brand-sandstone/50 block text-[9px] uppercase font-bold">Currency</span>
              <span className="font-bold text-white truncate block">{geography.currency}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {geography.summary}
          </p>
        </div>

        {/* 2. Contextual Geographic Navigation Links */}
        <section aria-label={`${demonymOrName} Contextual Actions`} className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-caribbeanSea" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                {demonymOrName} Navigator
              </h4>
            </div>
          </div>

          <nav className="space-y-1.5 pt-0.5">
            {CONTEXT_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${action.color}`} />
                    <span className="truncate">{action.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </nav>
        </section>

        {/* 3. Cultural Heritage & Music */}
        {geography.musicGenres.length > 0 && (
          <section aria-label="Music & Rhythms" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Signature Sounds
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {geography.musicGenres.map((genre) => (
                <Link
                  key={genre}
                  href={`/search?q=${encodeURIComponent(genre)}`}
                  className="px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Cuisine & Cultural Tags */}
        {geography.cuisineTags.length > 0 && (
          <section aria-label="Culinary & Culture" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-brand-goldenHour" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Cuisine &amp; Taste
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {geography.cuisineTags.map((food) => (
                <span
                  key={food}
                  className="px-2.5 py-1 rounded-full bg-brand-goldenHour/10 text-brand-goldenHour border border-brand-goldenHour/30 text-[11px] font-bold"
                >
                  {food}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 5. Global Diaspora Connections */}
        {geography.diasporaHubs.length > 0 && (
          <section aria-label="Diaspora Hubs" className="glass rounded-3xl p-4 sm:p-5 space-y-2.5 border border-white/10">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Major Diaspora Hubs
              </h4>
            </div>
            <p className="text-[11px] text-brand-sandstone/70">
              {geography.diasporaHubs.join(' • ')}
            </p>
          </section>
        )}
      </div>
    );
  }

  // Generic Explore Contextual Engine (When no specific island is selected)
  const TOP_ISLANDS = CANONICAL_GEOGRAPHIES.filter((g) => g.isCaribbean && !g.isDiasporaHub).slice(0, 8);

  return (
    <div className="space-y-5">
      {/* 1. Explore Caribbean Overview Card */}
      <div className="glass rounded-3xl p-5 border border-white/10 space-y-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-goldenHour flex items-center justify-center text-slate-950 font-black shadow-md">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Caribbean Geographic Engine</h3>
            <p className="text-[10px] text-brand-sandstone/60">
              30+ nations, territories &amp; diaspora hubs
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Select any island or territory below to adapt your discovery stream, events, creators, and marketplace listings to that country.
        </p>
      </div>

      {/* 2. Popular Island Quick Select */}
      <section aria-label="Select an Island" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-sunriseCoral" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Explore by Island
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {TOP_ISLANDS.map((island) => (
            <Link
              key={island.id}
              href={`/explore?geo=${island.slug}`}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all group"
            >
              <span className="text-base">{island.flagEmoji}</span>
              <span className="truncate group-hover:text-brand-caribbeanSea transition-colors">
                {island.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Caribbean Cultural Vibes */}
      <section aria-label="Cultural Vibes" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-goldenHour" />
          <h4 className="text-xs font-black text-white uppercase tracking-wider">
            Cultural Vibes
          </h4>
        </div>

        <div className="space-y-1.5 pt-0.5">
          {[
            { vibe: 'music_dance', label: 'Carnival, Reggae & Soca', emoji: '🎶' },
            { vibe: 'food_rum', label: 'Cuisine, Spices & Rum', emoji: '🍲' },
            { vibe: 'business_tech', label: 'Caribbean Tech & Ventures', emoji: '🚀' },
            { vibe: 'diaspora_roots', label: 'Diaspora Heritage & History', emoji: '🌴' },
          ].map((v) => (
            <Link
              key={v.vibe}
              href={`/explore?vibe=${v.vibe}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
            >
              <span className="flex items-center gap-2 truncate">
                <span>{v.emoji}</span>
                <span className="truncate">{v.label}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Global Diaspora Hubs */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-caribbeanSea/10 via-brand-sunsetPurple/20 to-transparent border border-white/10 space-y-2">
        <p className="text-xs font-black text-white flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Global Caribbean Diaspora
        </p>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Explore thriving Caribbean communities in New York, Miami, London, Toronto, and beyond.
        </p>
        <Link
          href="/diaspora"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-caribbeanSea hover:underline pt-1"
        >
          View Diaspora Hubs →
        </Link>
      </div>
    </div>
  );
}
