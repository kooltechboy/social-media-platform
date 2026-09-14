'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Compass,
  Search,
  Globe,
  MapPin,
  Sparkles,
  ArrowUpRight,
  Filter,
  X,
  Users,
  Calendar,
  ShoppingBag,
  Heart,
  MessageCircle,
  CheckCircle,
  Building2,
  Tv,
  Radio,
  Flame,
  Clock,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import GeographyFlag from './geography-flag';
import { VIBE_CATEGORIES, type VibeCategory, type ExploreQueryResult } from '../lib/explore/constants';
import {
  CANONICAL_GEOGRAPHIES,
  CARIBBEAN_CORE_ENTITIES,
  CARIBBEAN_SOVEREIGN_COUNTRIES,
  CARIBBEAN_TERRITORIES_ONLY,
  DIASPORA_HUBS_ONLY,
  resolveGeography,
  type CanonicalGeography,
} from '../lib/explore/canonical-geography';
import TrendingPanel from './trending/trending-panel';
import type { TrendingSignal } from '../lib/explore/actions';
import { track } from '../lib/monitoring/analytics';

interface ExploreDiscoveryClientProps {
  initialResult: ExploreQueryResult;
  trendingSignals?: TrendingSignal[];
  activeVibeKey?: string | null;
  activeCountryKey?: string | null;
  activeHubKey?: string | null;
  activeQueryText?: string | null;
}

export default function ExploreDiscoveryClient({
  initialResult,
  trendingSignals = [],
  activeVibeKey,
  activeCountryKey,
  activeHubKey,
  activeQueryText,
}: ExploreDiscoveryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [vibe, setVibe] = useState<string | null>(activeVibeKey || null);
  const [country, setCountry] = useState<string | null>(activeCountryKey || null);
  const [hub, setHub] = useState<string | null>(activeHubKey || null);
  const [query, setQuery] = useState<string>(activeQueryText || '');
  const [geoTab, setGeoTab] = useState<'all' | 'sovereign' | 'territories' | 'diaspora'>('all');
  const [activeTab, setActiveTab] = useState<
    'all' | 'posts' | 'creators' | 'events' | 'communities' | 'businesses' | 'products' | 'reels' | 'podcasts'
  >('all');

  // Synchronize state with URL parameters
  useEffect(() => {
    setVibe(searchParams.get('vibe'));
    setCountry(searchParams.get('geo') || searchParams.get('country'));
    setHub(searchParams.get('hub'));
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  function updateFilters(next: {
    vibe?: string | null;
    country?: string | null;
    hub?: string | null;
    q?: string | null;
  }) {
    const params = new URLSearchParams();
    const newVibe = next.vibe !== undefined ? next.vibe : vibe;
    const newCountry = next.country !== undefined ? next.country : country;
    const newHub = next.hub !== undefined ? next.hub : hub;
    const newQ = next.q !== undefined ? next.q : query;

    if (newVibe) params.set('vibe', newVibe);
    if (newCountry) params.set('country', newCountry);
    if (newHub) params.set('hub', newHub);
    if (newQ && newQ.trim()) params.set('q', newQ.trim());

    const url = params.toString() ? `/explore?${params.toString()}` : '/explore';
    startTransition(() => {
      router.push(url);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ q: query });
  }

  function clearAllFilters() {
    setVibe(null);
    setCountry(null);
    setHub(null);
    setQuery('');
    startTransition(() => {
      router.push('/explore');
    });
  }

  const hasActiveFilters = Boolean(vibe || country || hub || query.trim());

  const selectedVibeObj = VIBE_CATEGORIES.find((v) => v.id === vibe);
  const selectedGeographyObj = resolveGeography(country);
  const selectedHubObj = resolveGeography(hub);

  // Filtered geographies based on user sub-tab
  const visibleGeographies = (() => {
    switch (geoTab) {
      case 'sovereign':
        return CARIBBEAN_SOVEREIGN_COUNTRIES;
      case 'territories':
        return CARIBBEAN_TERRITORIES_ONLY;
      case 'diaspora':
        return DIASPORA_HUBS_ONLY;
      default:
        return CARIBBEAN_CORE_ENTITIES;
    }
  })();

  const { counts } = initialResult;

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* ────────────────────────────────────────────────────────── */}
      {/* HERO & DISCOVERY SEARCH BAR                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden border border-brand-caribbeanSea/30">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-caribbeanSea/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/40 text-brand-caribbeanSea text-xs md:text-sm font-black tracking-wide uppercase">
            <Compass className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-goldenHour" /> Tukubi Discovery Engine
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Explore Caribbean Vibes, Territories &amp; Global Diaspora
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/85 leading-relaxed md:leading-[1.6]">
            Discover 31+ Caribbean island nations, global diaspora hubs from Brooklyn to London, verified creators, festivals, and cultural commerce.
          </p>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative pt-2 w-full max-w-xl">
            <Search className="absolute left-4 top-5.5 md:top-6 w-4 h-4 md:w-5 md:h-5 text-brand-caribbeanSea pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search music, creators, jerk spots, fetes, or island..."
              className="w-full bg-slate-950/80 border border-white/20 hover:border-brand-caribbeanSea/60 rounded-2xl pl-11 md:pl-12 pr-28 py-3 md:py-3.5 text-xs sm:text-sm md:text-base text-white placeholder-brand-sandstone/50 focus:outline-none focus:border-brand-caribbeanSea focus:ring-2 focus:ring-brand-caribbeanSea/30 transition-all shadow-inner min-h-[44px] md:min-h-[48px]"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  updateFilters({ q: '' });
                }}
                className="absolute right-24 top-5 md:top-5.5 text-brand-sandstone/60 hover:text-white"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="absolute right-2 top-3 md:top-3.5 bg-brand-caribbeanSea hover:brightness-110 text-slate-950 font-black px-4 md:px-5 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-1.5 shadow-md shadow-brand-caribbeanSea/20 min-h-[38px] md:min-h-[42px]"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              <span>Search</span>
            </button>
          </form>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ACTIVE FILTER PILLS / BREADCRUMBS                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="p-4 md:p-5 rounded-2xl surface-card flex flex-wrap items-center justify-between gap-3 animate-fadeIn border border-white/10">
          <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
            <span className="text-xs md:text-sm font-black uppercase text-brand-caribbeanSea flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-caribbeanSea" /> Active Filters:
            </span>

            {selectedVibeObj && (
              <button
                type="button"
                onClick={() => updateFilters({ vibe: null })}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40 hover:bg-purple-500/30 transition-colors min-h-[34px]"
              >
                <span>{selectedVibeObj.icon} Vibe: {selectedVibeObj.name}</span>
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            )}

            {selectedGeographyObj && (
              <button
                type="button"
                onClick={() => updateFilters({ country: null })}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/40 hover:bg-brand-caribbeanSea/30 transition-colors min-h-[34px]"
              >
                <GeographyFlag geo={selectedGeographyObj} size="xs" />
                <span>Territory: {selectedGeographyObj.name}</span>
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            )}

            {selectedHubObj && (
              <button
                type="button"
                onClick={() => updateFilters({ hub: null })}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 transition-colors min-h-[34px]"
              >
                <GeographyFlag geo={selectedHubObj.iso} size="xs" />
                <span>Diaspora Hub: {selectedHubObj.capital || selectedHubObj.name}</span>
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            )}

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  updateFilters({ q: '' });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/40 hover:bg-brand-sunriseCoral/30 transition-colors min-h-[34px]"
              >
                <span>Keyword: &quot;{query}&quot;</span>
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs md:text-sm font-black text-rose-400 hover:text-rose-300 underline transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TRENDING SIGNALS                                           */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <TrendingPanel
          signals={trendingSignals}
          territory={selectedGeographyObj?.name || null}
        />
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. EXPLORE BY VIBE (Interactive Selection Rail)            */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-brand-goldenHour" /> 1. Explore by Vibe
          </h2>
          <span className="text-xs md:text-sm text-brand-sandstone/60">Select a cultural theme to filter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 3xl:grid-cols-8 gap-3.5">
          {VIBE_CATEGORIES.map((v) => {
            const isSelected = vibe === v.id;
            return (
              <Link
                key={v.id}
                href={`/explore/vibe/${v.id}`}
                onClick={() => track('vibe_selected', { vibe: v.id })}
                className={`relative rounded-3xl p-4 md:p-5 transition-all flex flex-col justify-between shadow-lg group border cursor-pointer ${
                  isSelected
                    ? 'surface-card border-purple-400 ring-2 ring-purple-400/50 shadow-purple-500/20 scale-[1.02]'
                    : 'surface-card surface-card-interactive hover:border-purple-400/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">
                    {v.icon}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-400 text-slate-950">
                        ACTIVE
                      </span>
                    )}
                    <span className="text-brand-sandstone/40 group-hover:text-purple-300 transition-colors p-1">
                      <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-left w-full">
                  <h3
                    className={`font-black text-sm sm:text-base md:text-lg transition-colors ${
                      isSelected ? 'text-purple-300' : 'text-white group-hover:text-purple-300'
                    }`}
                  >
                    {v.name}
                  </h3>
                  <p className="text-xs md:text-sm text-brand-sandstone/80 mt-1 leading-snug">
                    {v.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. ISLAND NATIONS & TERRITORIES (Vector Flag Cards)       */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
              <Globe className="w-4 h-4 md:w-5 md:h-5 text-brand-sunriseCoral" /> 2. Discover Caribbean Nations &amp; Territories
            </h2>
            <span className="text-xs md:text-sm text-brand-sandstone/60">
              Select an island to filter, or open its dedicated discovery portal
            </span>
          </div>

          {/* Sub-tabs for filtering sovereign vs territory vs diaspora */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setGeoTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                geoTab === 'all'
                  ? 'bg-brand-caribbeanSea text-slate-950'
                  : 'text-brand-sandstone hover:text-white'
              }`}
            >
              All ({CARIBBEAN_CORE_ENTITIES.length})
            </button>
            <button
              type="button"
              onClick={() => setGeoTab('sovereign')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                geoTab === 'sovereign'
                  ? 'bg-brand-caribbeanSea text-slate-950'
                  : 'text-brand-sandstone hover:text-white'
              }`}
            >
              Sovereign ({CARIBBEAN_SOVEREIGN_COUNTRIES.length})
            </button>
            <button
              type="button"
              onClick={() => setGeoTab('territories')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                geoTab === 'territories'
                  ? 'bg-brand-caribbeanSea text-slate-950'
                  : 'text-brand-sandstone hover:text-white'
              }`}
            >
              Islands &amp; Territories ({CARIBBEAN_TERRITORIES_ONLY.length})
            </button>
            <button
              type="button"
              onClick={() => setGeoTab('diaspora')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                geoTab === 'diaspora'
                  ? 'bg-brand-caribbeanSea text-slate-950'
                  : 'text-brand-sandstone hover:text-white'
              }`}
            >
              Diaspora Hubs ({DIASPORA_HUBS_ONLY.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 3xl:grid-cols-8 gap-3">
          {visibleGeographies.map((terr) => {
            const isSelected = country === terr.slug || country === terr.iso;
            const targetHref = terr.isDiasporaHub ? `/explore/diaspora/${terr.slug}` : `/explore/${terr.slug}`;
            return (
              <Link
                key={terr.slug}
                href={targetHref}
                onClick={() => track('destination_selected', { destination: terr.slug, iso: terr.iso })}
                className={`relative rounded-2xl p-3.5 md:p-4 transition-all flex flex-col justify-between shadow-md group border cursor-pointer ${
                  isSelected
                    ? 'surface-card border-brand-caribbeanSea ring-2 ring-brand-caribbeanSea/50 scale-[1.02]'
                    : 'surface-card surface-card-interactive hover:border-brand-caribbeanSea/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <GeographyFlag geo={terr} size="md" className="group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] md:text-xs font-mono font-black text-brand-caribbeanSea bg-white/10 px-1.5 py-0.5 rounded">
                      {terr.iso}
                    </span>
                    <span className="text-brand-sandstone/40 group-hover:text-brand-caribbeanSea transition-colors p-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </span>
                  </div>
                </div>

                <div className="text-left w-full">
                  <h4
                    className={`font-bold text-xs sm:text-sm md:text-[15px] truncate transition-colors ${
                      isSelected ? 'text-brand-caribbeanSea font-black' : 'text-white group-hover:text-brand-caribbeanSea'
                    }`}
                  >
                    {terr.name}
                  </h4>
                  <span className="text-[10px] md:text-xs text-brand-sandstone/70 block mt-0.5 truncate">
                    {terr.sovereign ? 'Sovereign' : terr.isDiasporaHub ? 'Diaspora Hub' : 'Territory'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. GLOBAL DIASPORA HUBS                                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-brand-goldenHour" /> 3. Global Diaspora Hubs
          </h2>
          <span className="text-xs md:text-sm text-brand-sandstone/60">
            Caribbean communities across North America, Europe &amp; beyond
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-6 gap-3.5">
          {DIASPORA_HUBS_ONLY.map((cityHub) => {
            const isSelected =
              hub === cityHub.slug ||
              (hub && cityHub.capital.toLowerCase().includes(hub.toLowerCase()));
            return (
              <Link
                key={cityHub.slug}
                href={`/explore/diaspora/${cityHub.slug}`}
                onClick={() => track('diaspora_hub_selected', { hub: cityHub.slug, iso: cityHub.iso })}
                className={`relative rounded-2xl p-4 md:p-5 transition-all flex flex-col justify-between shadow-md group border cursor-pointer ${
                  isSelected
                    ? 'surface-card border-amber-400 ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'surface-card surface-card-interactive hover:border-amber-400/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <GeographyFlag geo={cityHub.iso} size="md" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] md:text-xs font-black text-brand-goldenHour uppercase">
                      {cityHub.currency}
                    </span>
                    <span className="text-brand-sandstone/40 group-hover:text-amber-300 transition-colors p-0.5">
                      <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 text-left w-full">
                  <h4
                    className={`font-bold text-xs sm:text-sm md:text-base leading-snug transition-colors ${
                      isSelected ? 'text-amber-300 font-black' : 'text-white group-hover:text-brand-goldenHour'
                    }`}
                  >
                    {cityHub.name}
                  </h4>
                  <p className="text-[11px] md:text-xs text-brand-sandstone/70 mt-0.5">
                    {cityHub.capital}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. DYNAMIC DISCOVERY FEED & MATCHES                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-6 pt-8 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-brand-caribbeanSea" />
              {hasActiveFilters ? 'Discovery Feed & Matches' : 'Trending Across the Caribbean'}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/70 mt-1">
              {hasActiveFilters
                ? `Showing real-time matches for ${[selectedVibeObj?.name, selectedGeographyObj?.name, selectedHubObj?.capital || hub, query ? `"${query}"` : null].filter(Boolean).join(' • ')}`
                : 'Real cultural discussions, top creators, events, communities, and artisan commerce.'}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: `All (${initialResult.totalMatches})` },
              { id: 'posts', label: `Feed (${counts.posts})` },
              { id: 'creators', label: `Creators (${counts.creators})` },
              { id: 'events', label: `Events (${counts.events})` },
              { id: 'communities', label: `Guilds (${counts.communities})` },
              { id: 'businesses', label: `Businesses (${counts.businesses})` },
              { id: 'products', label: `Shop (${counts.products})` },
              { id: 'reels', label: `Reels (${counts.reels})` },
              { id: 'podcasts', label: `Podcasts (${counts.podcasts})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all min-h-[38px] md:min-h-[42px] ${
                  activeTab === t.id
                    ? 'bg-brand-caribbeanSea text-slate-950 font-black shadow-md shadow-brand-caribbeanSea/20'
                    : 'bg-white/5 hover:bg-white/10 text-brand-sandstone/80 border border-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty State ── */}
        {initialResult.totalMatches === 0 && (
          <div className="surface-card rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto border border-white/10">
            <Compass className="w-12 h-12 md:w-14 md:h-14 text-brand-caribbeanSea/80 mx-auto animate-pulse" />
            <div className="space-y-1.5">
              <h3 className="text-lg md:text-xl font-black text-white">No exact matches found</h3>
              <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 leading-relaxed md:leading-[1.6]">
                We couldn&apos;t find content matching your specific combination. Try exploring another vibe or clearing filters.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link
                href="/explore/vibe/music"
                onClick={() => track('vibe_selected', { vibe: 'music' })}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-purple-500/20 text-purple-200 text-xs md:text-sm font-bold border border-purple-500/40 hover:bg-purple-500/30 min-h-[38px] inline-flex items-center"
              >
                🎵 Soca &amp; Reggae
              </Link>
              <Link
                href="/explore/vibe/carnival"
                onClick={() => track('vibe_selected', { vibe: 'carnival' })}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-rose-500/20 text-rose-200 text-xs md:text-sm font-bold border border-rose-500/40 hover:bg-rose-500/30 min-h-[38px] inline-flex items-center"
              >
                🎭 Carnival &amp; Fetes
              </Link>
              <Link
                href="/explore/vibe/food"
                onClick={() => track('vibe_selected', { vibe: 'food' })}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-amber-500/20 text-amber-200 text-xs md:text-sm font-bold border border-amber-500/40 hover:bg-amber-500/30 min-h-[38px] inline-flex items-center"
              >
                🍛 Food &amp; Rum
              </Link>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-white/10 text-white text-xs md:text-sm font-bold border border-white/15 hover:bg-white/15 min-h-[38px]"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* ── Feed Posts ── */}
        {(activeTab === 'all' || activeTab === 'posts') && initialResult.posts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 md:w-4 md:h-4" /> Cultural Discussions &amp; Posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-4">
              {initialResult.posts.map((post) => {
                const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                return (
                  <article
                    key={post.id}
                    className="surface-card rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg flex flex-col justify-between border border-white/10"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/profile/${author?.username || 'member'}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black flex items-center justify-center text-xs md:text-sm shadow-md">
                            {(author?.display_name || 'MB').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-sm md:text-base text-white group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1.5">
                              {author?.display_name || 'Caribbean Member'}
                              {author?.is_verified && <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" />}
                            </h4>
                            <span className="text-xs md:text-sm text-brand-sandstone/60">@{author?.username || 'member'}</span>
                          </div>
                        </Link>
                        <span className="text-xs md:text-sm text-brand-sandstone/50">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/90 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs md:text-sm text-brand-sandstone/70">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-400" /> {post.likes_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-brand-caribbeanSea" /> {post.comments_count ?? 0}
                      </span>
                      <Link
                        href="/"
                        className="text-brand-caribbeanSea hover:underline text-xs md:text-sm font-black flex items-center"
                      >
                        View in Feed →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Creators & Profiles ── */}
        {(activeTab === 'all' || activeTab === 'creators') && initialResult.creators.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-2">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" /> Featured Creators &amp; Leaders
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 gap-4">
              {initialResult.creators.map((c) => (
                <div
                  key={c.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md group border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-sm md:text-base shadow-md flex-shrink-0">
                      {(c.display_name || 'CR').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm md:text-base text-white truncate group-hover:text-brand-sunriseCoral transition-colors flex items-center gap-1.5">
                        {c.display_name}
                        {c.is_verified && <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" />}
                      </h4>
                      <p className="text-xs md:text-sm text-brand-sandstone/70 truncate">@{c.username}</p>
                      {(c.island || c.country) && (
                        <span className="text-[10px] md:text-xs font-mono font-black text-brand-goldenHour bg-white/10 px-2 py-0.5 rounded mt-1 inline-block">
                          {c.island || c.country}
                        </span>
                      )}
                    </div>
                  </div>

                  {c.bio && (
                    <p className="text-xs md:text-sm text-brand-sandstone/85 leading-relaxed line-clamp-2">{c.bio}</p>
                  )}

                  <div className="pt-3 border-t border-white/10">
                    <Link
                      href={`/profile/${c.username}`}
                      className="w-full text-center bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black py-2 rounded-xl text-xs md:text-sm transition-all block min-h-[38px] flex items-center justify-center"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Events ── */}
        {(activeTab === 'all' || activeTab === 'events') && initialResult.events.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-yellow-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" /> Cultural Events &amp; Fetes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialResult.events.map((evt) => (
                <div
                  key={evt.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg border border-white/10"
                >
                  <div className="space-y-2.5">
                    <span className="text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 uppercase tracking-wider">
                      {evt.event_kind}
                    </span>
                    <h4 className="font-black text-base md:text-lg text-white leading-snug">{evt.title}</h4>
                    {evt.description && (
                      <p className="text-xs md:text-sm text-brand-sandstone/85 line-clamp-2 leading-relaxed">{evt.description}</p>
                    )}
                    <div className="text-xs md:text-sm text-brand-sandstone/70 space-y-1.5 pt-1">
                      <p className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{new Date(evt.starts_at).toLocaleDateString()}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                        <span>{evt.venue || evt.cities?.name || 'Caribbean'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <Link
                      href="/events"
                      className="w-full text-center bg-yellow-400 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-md shadow-yellow-500/20 block min-h-[42px] flex items-center justify-center"
                    >
                      Get Tickets / RSVP →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Communities ── */}
        {(activeTab === 'all' || activeTab === 'communities') && initialResult.communities.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" /> Diaspora Hubs &amp; Communities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialResult.communities.map((comm) => (
                <div
                  key={comm.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg border border-white/10"
                >
                  <div className="space-y-2.5">
                    <h4 className="font-black text-base md:text-lg text-white leading-snug">{comm.name}</h4>
                    {comm.description && (
                      <p className="text-xs md:text-sm text-brand-sandstone/85 line-clamp-2 leading-relaxed">{comm.description}</p>
                    )}
                    <span className="text-xs md:text-sm text-brand-sandstone/70 block">
                      {comm.member_count ?? 0} Active Members
                    </span>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <Link
                      href={`/communities/${comm.slug || comm.id}`}
                      className="w-full text-center bg-cyan-400 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-md shadow-cyan-500/20 block min-h-[42px] flex items-center justify-center"
                    >
                      Join Community Guild →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Businesses ── */}
        {(activeTab === 'all' || activeTab === 'businesses') && initialResult.businesses.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Verified Caribbean Businesses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialResult.businesses.map((b) => (
                <div
                  key={b.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-lg border border-white/10"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                        {b.category}
                      </span>
                      {b.is_verified && (
                        <span className="text-[10px] font-bold text-brand-caribbeanSea flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-base text-white">{b.name}</h4>
                    {b.description && (
                      <p className="text-xs text-brand-sandstone/85 line-clamp-2">{b.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-brand-sandstone/70">
                    {b.website ? (
                      <a
                        href={b.website.startsWith('http') ? b.website : `https://${b.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-caribbeanSea hover:underline inline-flex items-center gap-1 font-bold"
                      >
                        Website <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span>Local Enterprise</span>
                    )}
                    <Link href={`/pages/${b.slug}`} className="text-white hover:underline font-bold">
                      View Page →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Products & Marketplace ── */}
        {(activeTab === 'all' || activeTab === 'products') && initialResult.products.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" /> Marketplace &amp; Artisan Craft
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {initialResult.products.map((prod) => (
                <div
                  key={prod.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg border border-white/10"
                >
                  <div className="space-y-2.5">
                    <span className="text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 uppercase tracking-wider">
                      {prod.product_kind}
                    </span>
                    <h4 className="font-black text-base text-white leading-snug">{prod.title}</h4>
                    {prod.description && (
                      <p className="text-xs md:text-sm text-brand-sandstone/85 line-clamp-2 leading-relaxed">{prod.description}</p>
                    )}
                    <p className="text-lg md:text-xl font-black text-brand-goldenHour">
                      ${(prod.price_minor / 100).toFixed(2)} USD
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <Link
                      href="/marketplace"
                      className="w-full text-center bg-orange-400 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-md shadow-orange-500/20 block min-h-[42px] flex items-center justify-center"
                    >
                      Order with Tukubi Escrow →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reels ── */}
        {(activeTab === 'all' || activeTab === 'reels') && initialResult.reels.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 md:w-4 md:h-4" /> Reels &amp; Video Shorts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {initialResult.reels.map((reel) => (
                <Link
                  key={reel.id}
                  href="/reels"
                  className="surface-card surface-card-interactive rounded-2xl p-4 space-y-2 block border border-white/10 group"
                >
                  <div className="aspect-[9/16] bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-white/5">
                    {reel.thumbnail_path ? (
                      <img
                        src={reel.thumbnail_path}
                        alt={reel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Tv className="w-8 h-8 text-brand-sandstone/40" />
                    )}
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-slate-950/80 px-2 py-0.5 rounded text-white">
                      {reel.view_count ?? 0} views
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white truncate">{reel.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
