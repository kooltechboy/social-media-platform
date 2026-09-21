'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Compass,
  Globe,
  Users,
  Music,
  Tv,
  ShoppingBag,
  Building2,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  MapPin,
  Heart,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { CARIBBEAN_SOUNDS, type CaribbeanSound } from '../lib/constants/caribbean-sounds';
import {
  CANONICAL_GEOGRAPHIES,
  type CanonicalGeography,
} from '../lib/explore/canonical-geography';

const FEATURED_ISLANDS: CanonicalGeography[] = [
  CANONICAL_GEOGRAPHIES.find((g) => g.slug === 'jamaica')!,
  CANONICAL_GEOGRAPHIES.find((g) => g.slug === 'haiti')!,
  CANONICAL_GEOGRAPHIES.find((g) => g.slug === 'trinidad-and-tobago')!,
  CANONICAL_GEOGRAPHIES.find((g) => g.slug === 'dominican-republic')!,
  CANONICAL_GEOGRAPHIES.find((g) => g.slug === 'barbados')!,
  CANONICAL_GEOGRAPHIES.find((g) => g.slug === 'guyana')!,
  CANONICAL_GEOGRAPHIES.find((g) => g.slug === 'bahamas')!,
].filter(Boolean);

export default function PublicFrontDoor() {
  const [selectedIsland, setSelectedIsland] = useState<CanonicalGeography>(FEATURED_ISLANDS[0]);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Selected sample preview sounds
  const previewSounds = CARIBBEAN_SOUNDS.slice(0, 4);

  const togglePlaySound = (sound: CaribbeanSound) => {
    if (playingSoundId === sound.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingSoundId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(sound.audioUrl);
      audio.onended = () => setPlayingSoundId(null);
      audio.onerror = () => setPlayingSoundId(null);
      audio.play().catch(() => setPlayingSoundId(null));
      audioRef.current = audio;
      setPlayingSoundId(sound.id);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TUKUBI',
    url: 'https://www.tukubi.com',
    description: 'The Caribbean Connected. Born in the Caribbean. Built for the World.',
    publisher: {
      '@type': 'Organization',
      name: 'TUKUBI Inc.',
      url: 'https://www.tukubi.com',
      logo: 'https://www.tukubi.com/brand/tukubi-emblem.png',
      sameAs: [
        'https://twitter.com/tukubiofficial',
        'https://instagram.com/tukubiofficial',
      ],
    },
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden text-white selection:bg-[#FF7A59]/30 selection:text-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ──────────────────────────────────────────────────────────── */}
      {/* HERO SECTION                                                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-sunriseCoral/20 via-brand-caribbeanSea/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Official Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-brand-sunriseCoral/40 text-brand-sunriseCoral text-xs sm:text-sm font-black tracking-widest uppercase mb-6 shadow-lg shadow-brand-sunriseCoral/10 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-brand-goldenHour" />
          <span>The Caribbean Connected.</span>
        </div>

        {/* Master Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] max-w-5xl mx-auto">
          Born in the Caribbean. <br />
          <span className="bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea bg-clip-text text-transparent">
            Built for the World.
          </span>
        </h1>

        {/* Core Proposition */}
        <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-brand-sandstone/85 max-w-3xl mx-auto leading-relaxed font-normal">
          Connect with your people. Discover your culture. Share your world.
          The dedicated social, creator, cultural, and commerce platform engineered
          for the Caribbean basin and the global diaspora.
        </p>

        {/* Primary Call-to-Actions */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-slate-950 font-black text-sm sm:text-base hover:brightness-110 transition-all shadow-xl shadow-brand-sunriseCoral/25 flex items-center gap-2 group min-h-[48px]"
          >
            <span>Join the Caribbean Network</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/explore"
            className="px-8 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-sm sm:text-base transition-all flex items-center gap-2 min-h-[48px]"
          >
            <Compass className="w-4 h-4 text-brand-caribbeanSea" />
            <span>Explore Culture &amp; Islands</span>
          </Link>
          <Link
            href="/login"
            className="px-6 py-4 rounded-2xl text-slate-300 hover:text-white font-bold text-sm transition-colors"
          >
            Sign In &rarr;
          </Link>
        </div>

        {/* Trust & Architecture Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-brand-sandstone/70">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 30+ Islands &amp; Territories
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-caribbeanSea" /> Real Caribbean Sounds &amp; Stems
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-goldenHour" /> Verified Creators &amp; Stores
          </span>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SIX PILLARS OF TUKUBI                                        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
            Engineered Around Caribbean Identity
          </h2>
          <p className="text-sm sm:text-base text-brand-sandstone/75 mt-3">
            TUKUBI is not a generic social app with tropical colors added afterward.
            Every protocol, feed, audio registry, and commerce engine was intentionally crafted
            for Caribbean realities and global diaspora connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pillar 1: Social Connection */}
          <div className="bg-[#140C22]/80 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-brand-sunriseCoral/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-sunriseCoral/15 text-brand-sunriseCoral flex items-center justify-center mb-5">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Real Social Connection</h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/75 leading-relaxed">
              Clear, honest relationships: separate mutual Friends, directional Followers,
              and community Members. No fabricated engagement or artificial follower bots.
            </p>
          </div>

          {/* Pillar 2: Caribbean Culture & Sounds */}
          <div className="bg-[#140C22]/80 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-brand-goldenHour/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-goldenHour/15 text-brand-goldenHour flex items-center justify-center mb-5">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Caribbean Sounds &amp; Stems</h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/75 leading-relaxed">
              Royalty-free riddims, authentic tenor pan stems, Kompa gouyad, Dancehall dubplates,
              and Soca rhythm tracks cleared for creator video sync and audio lounges.
            </p>
          </div>

          {/* Pillar 3: Geospatial Discovery & Map */}
          <div className="bg-[#140C22]/80 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-brand-caribbeanSea/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-caribbeanSea/15 text-brand-caribbeanSea flex items-center justify-center mb-5">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Caribbean Map &amp; Discovery</h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/75 leading-relaxed">
              Geospatial discovery covering sovereign nations, constituent territories,
              and overseas departments across Greater Antilles, Lesser Antilles, and the Guianas.
            </p>
          </div>

          {/* Pillar 4: Creators, Reels & Live */}
          <div className="bg-[#140C22]/80 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-purple-400/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-5">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Creators, Reels &amp; Podcasts</h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/75 leading-relaxed">
              9:16 vertical video studio with live camera capture, WebRTC live broadcasts,
              and complete podcast network distribution with Apple &amp; Spotify RSS syndication.
            </p>
          </div>

          {/* Pillar 5: Marketplace & Pages */}
          <div className="bg-[#140C22]/80 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-emerald-400/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-5">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Commerce &amp; Bespoke Stores</h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/75 leading-relaxed">
              Verified business storefronts, artisan island marketplaces, physical and digital goods,
              and cultural event ticketing built for local and cross-border Caribbean trade.
            </p>
          </div>

          {/* Pillar 6: Global Diaspora Bridges */}
          <div className="bg-[#140C22]/80 border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-sky-400/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-5">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Global Diaspora Hubs</h3>
            <p className="text-xs sm:text-sm text-brand-sandstone/75 leading-relaxed">
              Dedicated city discovery for New York, Miami, Toronto, London, Paris, Montreal,
              Atlanta, and Amsterdam, keeping diaspora families anchored to their home roots.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE ISLAND & CULTURE EXPLORER PREVIEW                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-brand-caribbeanSea uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5" /> Cultural Sovereignty &amp; Heritage
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              Explore by Island &amp; Territory
            </h2>
          </div>
          <Link
            href="/explore"
            className="text-xs sm:text-sm font-bold text-brand-goldenHour hover:underline flex items-center gap-1"
          >
            Open Universal Discovery Engine &rarr;
          </Link>
        </div>

        {/* Island Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none">
          {FEATURED_ISLANDS.map((island) => (
            <button
              key={island.id}
              onClick={() => setSelectedIsland(island)}
              className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                selectedIsland.id === island.id
                  ? 'bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-slate-950 shadow-md shadow-brand-sunriseCoral/20 scale-105'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/10'
              }`}
            >
              <span>{island.flagEmoji}</span>
              <span>{island.name}</span>
            </button>
          ))}
        </div>

        {/* Selected Island Showcase Card */}
        {selectedIsland && (
          <div className="mt-6 bg-[#140C22]/90 border border-brand-sunriseCoral/30 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl">{selectedIsland.flagEmoji}</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {selectedIsland.name}
                    </h3>
                    <p className="text-xs text-brand-sandstone/60">
                      Capital: {selectedIsland.capital} • Region: {selectedIsland.region}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-brand-sandstone/80 leading-relaxed">
                  {selectedIsland.summary}
                </p>

                {/* Cultural Highlights */}
                <div className="space-y-2 pt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-brand-goldenHour mr-1">Music:</span>
                    {selectedIsland.musicGenres.map((g) => (
                      <span
                        key={g}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-brand-sunriseCoral mr-1">Cuisine:</span>
                    {selectedIsland.cuisineTags.slice(0, 5).map((c) => (
                      <span
                        key={c}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-brand-caribbeanSea mr-1">Festivals:</span>
                    {selectedIsland.topFestivals.slice(0, 3).map((f) => (
                      <span
                        key={f}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Island CTA */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  href={`/explore?geo=${selectedIsland.slug}`}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 transition-all text-center"
                >
                  Explore {selectedIsland.name} Content
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm transition-colors text-center"
                >
                  Connect with {selectedIsland.name} Members
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CARIBBEAN SOUNDS PREVIEW                                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-brand-goldenHour uppercase tracking-wider mb-2">
              <Music className="w-3.5 h-3.5" /> Rhythm Stems &amp; Audio Vault
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              Authentic Caribbean Sounds
            </h2>
          </div>
          <Link
            href="/sounds"
            className="text-xs sm:text-sm font-bold text-brand-goldenHour hover:underline flex items-center gap-1"
          >
            Browse Full Sounds Directory &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {previewSounds.map((sound) => {
            const isPlaying = playingSoundId === sound.id;
            return (
              <div
                key={sound.id}
                className="bg-[#140C22]/80 border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 group transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-brand-goldenHour/15 text-brand-goldenHour border border-brand-goldenHour/30">
                      {sound.genre}
                    </span>
                    <span className="text-xs text-brand-sandstone/60">{sound.flag} {sound.countryIso}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-brand-caribbeanSea transition-colors line-clamp-1">
                    {sound.title}
                  </h4>
                  <p className="text-xs text-brand-sandstone/60 line-clamp-1">
                    {sound.artist}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-xs text-brand-sandstone/60">{sound.durationFormatted}</span>
                  <button
                    type="button"
                    onClick={() => togglePlaySound(sound)}
                    className="p-2.5 rounded-full bg-brand-sunriseCoral text-slate-950 hover:brightness-110 transition-transform active:scale-95 cursor-pointer shadow-md shadow-brand-sunriseCoral/20"
                    aria-label={isPlaying ? `Pause ${sound.title}` : `Play ${sound.title}`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* FINAL CALL TO ACTION                                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-white/10">
        <div className="bg-gradient-to-tr from-brand-sunriseCoral/20 via-[#140C22] to-brand-caribbeanSea/20 border border-brand-sunriseCoral/30 rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
            Join The Caribbean Connected.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-brand-sandstone/80 max-w-2xl mx-auto leading-relaxed">
            Whether you are on island or in the diaspora, an artisan merchant, a recording creator,
            or a family member staying connected — welcome home to TUKUBI.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour text-slate-950 font-black text-sm sm:text-base hover:brightness-110 transition-all shadow-xl shadow-brand-sunriseCoral/25 min-h-[48px] flex items-center gap-2"
            >
              <span>Create Your Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm min-h-[48px] flex items-center"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* PUBLIC FOOTER                                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-brand-sandstone/60">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-black text-white text-sm">TUKUBI</span>
            <span>•</span>
            <span>The Caribbean Connected.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/map" className="hover:text-white transition-colors">Caribbean Map</Link>
            <Link href="/sounds" className="hover:text-white transition-colors">Sounds</Link>
            <Link href="/podcasts" className="hover:text-white transition-colors">Podcasts</Link>
            <Link href="/reels" className="hover:text-white transition-colors">Reels</Link>
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help Center</Link>
            <Link href="/learn" className="hover:text-white transition-colors">Learn TUKUBI</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <div>
            &copy; {new Date().getFullYear()} TUKUBI Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
