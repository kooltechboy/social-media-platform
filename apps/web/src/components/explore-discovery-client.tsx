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
  Share2,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Flame,
  Radio,
  Clock,
  Loader2,
} from 'lucide-react';
import { VIBE_CATEGORIES, type VibeCategory, type ExploreQueryResult } from '../lib/explore/constants';
import { CARIBBEAN_TERRITORIES, type CaribbeanTerritory } from '../lib/constants/caribbean-territories';
import { DIASPORA_CITY_HUBS, type DiasporaCityHub } from '../lib/constants/diaspora-hubs';

interface ExploreDiscoveryClientProps {
  initialResult: ExploreQueryResult;
  activeVibeKey?: string | null;
  activeCountryKey?: string | null;
  activeHubKey?: string | null;
  activeQueryText?: string | null;
}

export default function ExploreDiscoveryClient({
  initialResult,
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
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'creators' | 'events' | 'communities' | 'products'>('all');

  // Sync state with URL params
  useEffect(() => {
    setVibe(searchParams.get('vibe'));
    setCountry(searchParams.get('country'));
    setHub(searchParams.get('hub'));
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  function updateFilters(next: { vibe?: string | null; country?: string | null; hub?: string | null; q?: string | null }) {
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

  function handleVibeClick(vibeId: string) {
    if (vibe === vibeId) {
      updateFilters({ vibe: null });
    } else {
      updateFilters({ vibe: vibeId });
    }
  }

  function handleCountryClick(isoCode: string) {
    if (country === isoCode) {
      updateFilters({ country: null });
    } else {
      updateFilters({ country: isoCode });
    }
  }

  function handleHubClick(hubCity: string) {
    if (hub === hubCity) {
      updateFilters({ hub: null });
    } else {
      updateFilters({ hub: hubCity });
    }
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
  const selectedCountryObj = CARIBBEAN_TERRITORIES.find((c) => c.iso === country);
  const selectedHubObj = DIASPORA_CITY_HUBS.find((h) => h.city.toLowerCase().includes((hub || '').toLowerCase()));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ────────────────────────────────────────────────────────── */}
      {/* HERO & DISCOVERY SEARCH BAR                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-brand-caribbeanSea/20 via-brand-dusk to-brand-twilight border border-brand-caribbeanSea/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-caribbeanSea/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-[11px] font-black tracking-wide uppercase">
            <Compass className="w-3.5 h-3.5" /> Antilia Discovery Engine
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-brand-sandstone tracking-tight leading-tight">
            Explore Caribbean Vibes, Territories &amp; Global Diaspora
          </h1>

          <p className="text-xs md:text-sm text-brand-sandstone/70 leading-relaxed">
            Connect across 28+ island nations, global diaspora hubs from Brooklyn to London, verified creators, festivals, and cultural discussions.
          </p>

          {/* Live Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative pt-2 w-full max-w-xl">
            <Search className="absolute left-4 top-5.5 w-4 h-4 text-brand-caribbeanSea" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search music, creators, jerk spots, fetes, or island..."
              className="w-full bg-brand-twilight/90 border border-slate-700/80 hover:border-brand-caribbeanSea/60 rounded-full pl-11 pr-28 py-3 text-xs md:text-sm text-brand-sandstone placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea focus:ring-2 focus:ring-brand-caribbeanSea/30 transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  updateFilters({ q: '' });
                }}
                className="absolute right-20 top-5 text-brand-sandstone/40 hover:text-brand-sandstone"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="absolute right-2 top-3 bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-black px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shadow-md shadow-brand-caribbeanSea/20"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </form>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ACTIVE FILTER PILLS / BREADCRUMBS                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="p-4 rounded-2xl bg-brand-dusk/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase text-brand-sandstone/60 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Active Filters:
            </span>

            {selectedVibeObj && (
              <button
                type="button"
                onClick={() => updateFilters({ vibe: null })}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
              >
                <span>{selectedVibeObj.icon} Vibe: {selectedVibeObj.name}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {selectedCountryObj && (
              <button
                type="button"
                onClick={() => updateFilters({ country: null })}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30 hover:bg-brand-caribbeanSea/30 transition-colors"
              >
                <span>{selectedCountryObj.flag} Territory: {selectedCountryObj.name}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {hub && (
              <button
                type="button"
                onClick={() => updateFilters({ hub: null })}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
              >
                <span>🗽 Diaspora Hub: {selectedHubObj?.city || hub}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  updateFilters({ q: '' });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 hover:bg-brand-sunriseCoral/30 transition-colors"
              >
                <span>Keyword: &quot;{query}&quot;</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 underline transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. EXPLORE BY VIBE (Interactive Selection Rail)            */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-goldenHour" /> 1. Explore by Vibe
          </h2>
          <span className="text-xs text-brand-sandstone/40">Select a cultural theme</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
          {VIBE_CATEGORIES.map((v) => {
            const isSelected = vibe === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVibeClick(v.id)}
                className={`text-left rounded-3xl p-4 transition-all flex flex-col justify-between shadow-lg group cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-500/20 via-brand-dusk to-brand-twilight border-purple-400 ring-2 ring-purple-400/40 shadow-purple-500/20 scale-[1.02]'
                    : 'bg-brand-dusk/80 hover:bg-brand-dusk border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{v.icon}</span>
                  {isSelected ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500 text-slate-950">
                      ACTIVE
                    </span>
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-brand-caribbeanSea transition-colors" />
                  )}
                </div>
                <div className="mt-3">
                  <h3 className={`font-extrabold text-sm transition-colors ${isSelected ? 'text-purple-300' : 'text-brand-sandstone group-hover:text-brand-caribbeanSea'}`}>
                    {v.name}
                  </h3>
                  <p className="text-[11px] text-brand-sandstone/60 mt-0.5 leading-snug">{v.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. ISLAND NATIONS & TERRITORIES (Interactive Cards)       */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-brand-sunriseCoral" /> 2. Island Nations &amp; Territories
          </h2>
          <span className="text-xs text-brand-sandstone/40">28+ Caribbean States</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {CARIBBEAN_TERRITORIES.map((terr) => {
            const isSelected = country === terr.iso;
            return (
              <button
                key={terr.iso}
                type="button"
                onClick={() => handleCountryClick(terr.iso)}
                className={`text-left rounded-3xl p-3.5 transition-all flex flex-col justify-between shadow-md group cursor-pointer border ${
                  isSelected
                    ? 'bg-brand-caribbeanSea/20 border-brand-caribbeanSea ring-2 ring-brand-caribbeanSea/40 scale-[1.02]'
                    : 'bg-brand-dusk/70 hover:bg-brand-dusk/90 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{terr.flag}</span>
                  <span className="text-[9px] font-mono font-bold text-brand-sandstone/40 bg-brand-twilight px-1.5 py-0.5 rounded">
                    {terr.iso}
                  </span>
                </div>
                <div>
                  <h4 className={`font-bold text-xs truncate transition-colors ${isSelected ? 'text-brand-caribbeanSea font-black' : 'text-brand-sandstone group-hover:text-brand-caribbeanSea'}`}>
                    {terr.name}
                  </h4>
                  <span className="text-[10px] text-brand-sandstone/50 block mt-0.5">
                    {terr.sovereign ? 'Sovereign' : 'Territory'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. GLOBAL DIASPORA HUBS (Interactive Cards)               */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-brand-sandstone flex items-center gap-2 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-brand-goldenHour" /> 3. Global Diaspora Hubs
          </h2>
          <span className="text-xs text-brand-sandstone/40">Global Diaspora Centers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {DIASPORA_CITY_HUBS.map((cityHub) => {
            const isSelected = (hub || '').toLowerCase().includes(cityHub.city.toLowerCase().split(' ')[0]);
            return (
              <button
                key={cityHub.id}
                type="button"
                onClick={() => handleHubClick(cityHub.city)}
                className={`text-left rounded-3xl p-4 transition-all flex flex-col justify-between shadow-md group cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 scale-[1.02]'
                    : 'bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cityHub.flag}</span>
                  <span className="text-[9px] font-black text-brand-goldenHour uppercase">
                    {cityHub.countryIso}
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className={`font-bold text-xs leading-snug ${isSelected ? 'text-amber-300 font-black' : 'text-brand-sandstone group-hover:text-brand-goldenHour'}`}>
                    {cityHub.city}
                  </h4>
                  <p className="text-[10px] text-brand-sandstone/60 mt-0.5">{cityHub.country}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. DYNAMIC DISCOVERY RESULTS WORKSPACE                     */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-6 pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-black text-brand-sandstone flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-caribbeanSea" />
              {hasActiveFilters ? 'Discovery Feed & Matches' : 'Trending Across the Caribbean'}
            </h2>
            <p className="text-xs text-brand-sandstone/60">
              {hasActiveFilters
                ? `Showing real-time matches for ${[selectedVibeObj?.name, selectedCountryObj?.name, hub, query ? `"${query}"` : null].filter(Boolean).join(' • ')}`
                : 'Curated cultural updates, top creators, events, and diaspora communities.'}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: `All (${initialResult.totalMatches})` },
              { id: 'posts', label: `Feed (${initialResult.posts.length})` },
              { id: 'creators', label: `Creators (${initialResult.creators.length})` },
              { id: 'events', label: `Events (${initialResult.events.length})` },
              { id: 'communities', label: `Hubs (${initialResult.communities.length})` },
              { id: 'products', label: `Shop (${initialResult.products.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'bg-brand-caribbeanSea text-slate-950 font-black shadow-md shadow-brand-caribbeanSea/20'
                    : 'bg-brand-dusk/70 text-brand-sandstone/60 hover:text-brand-sandstone border border-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content Rendering ────────────────────────────────────────── */}

        {/* Empty State */}
        {initialResult.totalMatches === 0 && (
          <div className="bg-brand-dusk/60 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto">
            <Compass className="w-10 h-10 text-brand-caribbeanSea/60 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-brand-sandstone">No exact matches found</h3>
              <p className="text-xs text-brand-sandstone/60 leading-relaxed">
                We couldn&apos;t find content matching your specific combination. Try exploring another vibe or clearing filters.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleVibeClick('music')}
                className="px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 hover:bg-purple-500/30"
              >
                🎵 Soca &amp; Reggae
              </button>
              <button
                type="button"
                onClick={() => handleVibeClick('carnival')}
                className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 hover:bg-rose-500/30"
              >
                🎭 Carnival &amp; Fetes
              </button>
              <button
                type="button"
                onClick={() => handleVibeClick('food')}
                className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30"
              >
                🍛 Food &amp; Rum
              </button>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3.5 py-1.5 rounded-full bg-brand-dusk text-slate-300 text-xs font-bold border border-slate-700 hover:bg-slate-700"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Feed Posts */}
        {(activeTab === 'all' || activeTab === 'posts') && initialResult.posts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Cultural Discussions &amp; Posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialResult.posts.map((post) => {
                const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                return (
                  <article
                    key={post.id}
                    className="bg-brand-dusk/80 border border-slate-800/90 rounded-3xl p-5 space-y-3 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/profile/${author?.username || 'user'}`}
                          className="flex items-center gap-2.5 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                            {(author?.display_name || 'CO').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-brand-sandstone group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1">
                              {author?.display_name || 'Caribbean Member'}
                              {author?.is_verified && <CheckCircle className="w-3 h-3 text-brand-caribbeanSea" />}
                            </h4>
                            <span className="text-[10px] text-brand-sandstone/50">@{author?.username || 'user'}</span>
                          </div>
                        </Link>
                        <span className="text-[10px] text-brand-sandstone/40">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-brand-sandstone/60">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" /> {post.likes_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" /> {post.comments_count ?? 0}
                      </span>
                      <Link
                        href="/"
                        className="text-brand-caribbeanSea hover:underline text-[11px] font-bold"
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

        {/* Creators & Profiles */}
        {(activeTab === 'all' || activeTab === 'creators') && initialResult.creators.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Featured Creators &amp; Leaders
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {initialResult.creators.map((c) => (
                <div
                  key={c.id}
                  className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between space-y-3 shadow-md group hover:border-brand-sunriseCoral/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-sm shadow-md flex-shrink-0">
                      {(c.display_name || 'CR').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs text-brand-sandstone truncate group-hover:text-brand-sunriseCoral transition-colors flex items-center gap-1">
                        {c.display_name}
                        {c.is_verified && <CheckCircle className="w-3 h-3 text-brand-caribbeanSea" />}
                      </h4>
                      <p className="text-[10px] text-brand-sandstone/60 truncate">@{c.username}</p>
                      {c.origin_country_iso && (
                        <span className="text-[9px] font-mono font-bold text-brand-goldenHour bg-brand-twilight px-1.5 py-0.5 rounded mt-1 inline-block">
                          {c.origin_country_iso}
                        </span>
                      )}
                    </div>
                  </div>

                  {c.bio && (
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{c.bio}</p>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <Link
                      href={`/profile/${c.username}`}
                      className="w-full text-center bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-black py-1.5 rounded-xl text-[11px] transition-all shadow-sm"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {(activeTab === 'all' || activeTab === 'events') && initialResult.events.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Cultural Events &amp; Fetes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialResult.events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-lg hover:border-yellow-500/40 transition-all"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase">
                      {evt.event_kind}
                    </span>
                    <h4 className="font-extrabold text-sm text-brand-sandstone leading-snug">{evt.title}</h4>
                    {evt.description && (
                      <p className="text-xs text-slate-300 line-clamp-2">{evt.description}</p>
                    )}
                    <div className="text-[11px] text-brand-sandstone/60 space-y-0.5 pt-1">
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        <span>{new Date(evt.starts_at).toLocaleDateString()}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-caribbeanSea" />
                        <span>{evt.venue || evt.cities?.name || 'Caribbean'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <Link
                      href="/events"
                      className="block w-full text-center bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2 rounded-2xl text-xs transition-all shadow-md shadow-yellow-500/20"
                    >
                      Get Tickets / RSVP →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communities */}
        {(activeTab === 'all' || activeTab === 'communities') && initialResult.communities.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Diaspora Hubs &amp; Communities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialResult.communities.map((comm) => (
                <div
                  key={comm.id}
                  className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-sm text-brand-sandstone leading-snug">{comm.name}</h4>
                    {comm.description && (
                      <p className="text-xs text-slate-300 line-clamp-2">{comm.description}</p>
                    )}
                    <span className="text-[11px] text-brand-sandstone/60 block">
                      {comm.member_count ?? 1200} Active Members
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <Link
                      href={`/communities/${comm.slug || comm.id}`}
                      className="block w-full text-center bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-2 rounded-2xl text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                      Join Community Guild →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {(activeTab === 'all' || activeTab === 'products') && initialResult.products.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Marketplace &amp; Artisan Craft
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialResult.products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase">
                      {prod.product_kind}
                    </span>
                    <h4 className="font-extrabold text-sm text-brand-sandstone leading-snug">{prod.title}</h4>
                    {prod.description && (
                      <p className="text-xs text-slate-300 line-clamp-2">{prod.description}</p>
                    )}
                    <p className="text-base font-black text-brand-sunriseCoral">
                      ${(prod.price_minor / 100).toFixed(2)} USD
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <Link
                      href="/marketplace"
                      className="block w-full text-center bg-orange-500 hover:bg-orange-400 text-slate-950 font-black py-2 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
                    >
                      Order with SpotPay Escrow →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
