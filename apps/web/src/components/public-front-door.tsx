'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
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
  CheckCircle2,
  Home,
  Film,
  Radio,
  Search,
  Bell,
  MessageCircle,
  Image as ImageIcon,
  Video,
  Link2,
  Smile,
  TrendingUp,
  Lock,
  Languages,
  Accessibility,
} from 'lucide-react';
import { TukubiLogo } from './brand/tukubi-logo';
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

const MOVEMENT_VALUES = [
  { label: 'Connect', icon: Users },
  { label: 'Create', icon: Film },
  { label: 'Discover', icon: Search },
  { label: 'Support', icon: Heart },
  { label: 'Grow', icon: TrendingUp },
] as const;

const PREVIEW_NAV = [
  { label: 'Home', href: '/feeds', icon: Home, active: true },
  { label: 'Explore', href: '/explore', icon: Compass, active: false },
  { label: 'Shorts', href: '/shorts', icon: Film, active: false },
  { label: 'Communities', href: '/communities', icon: Users, active: false },
  { label: 'Pages', href: '/pages', icon: Building2, active: false },
  { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag, active: false },
  { label: 'Events', href: '/events', icon: Calendar, active: false },
  { label: 'Creator Studio', href: '/login', icon: Radio, active: false },
] as const;

const PREVIEW_TOPICS = [
  { tag: '#CaribbeanCulture', region: 'Pan-Caribbean', href: '/explore?q=CaribbeanCulture' },
  { tag: '#CaribbeanMusic', region: 'Sounds & Stems', href: '/sounds' },
  { tag: '#IslandTravel', region: '30+ Geographies', href: '/map' },
  { tag: '#SupportLocal', region: 'Verified Pages', href: '/pages' },
] as const;

const PREVIEW_DIRECTORY = [
  { initials: 'TK', name: 'TUKUBI Official', handle: '@tukubi', href: '/profile/tukubi' },
  { initials: 'CS', name: 'Caribbean Sounds', handle: 'Audio Vault', href: '/sounds' },
  { initials: 'CM', name: 'Caribbean Map', handle: 'Islands & Hubs', href: '/map' },
] as const;

export default function PublicFrontDoor() {
  const [selectedIsland, setSelectedIsland] = useState<CanonicalGeography>(FEATURED_ISLANDS[0]);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    <div className="w-full max-w-full overflow-x-clip text-brand-porcelain selection:bg-brand-caribbeanSea/30 selection:text-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ──────────────────────────────────────────────────────────── */}
      {/* EXECUTIVE DESKTOP HERO & LIVE WORKSPACE SHOWCASE             */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-10 pb-20 lg:pt-16 lg:pb-28 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Brand Positioning */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0B1B3B]/85 border border-brand-caribbeanTeal/30 text-brand-porcelain text-xs font-semibold tracking-[0.04em] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-brand-caribbeanTeal shadow-[0_0_10px_#00C2A8]" />
              <span>The Caribbean Connected.</span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl sm:text-5xl xl:text-[54px] font-bold tracking-[-0.025em] leading-[1.08] text-white">
                More Than a Social Network.{' '}
                <span className="tk-text-gradient block mt-1">
                  It&apos;s a Movement.
                </span>
              </h1>
              <p className="font-display text-base sm:text-lg font-medium text-brand-porcelain/90 tracking-[-0.01em]">
                Born in the Caribbean.{' '}
                <span className="text-brand-caribbeanTeal">Built for the World.</span>
              </p>
            </div>

            <p className="text-[15.5px] sm:text-base text-brand-mist leading-relaxed max-w-xl">
              TUKUBI brings together people, culture, creators, businesses, and communities
              across the Caribbean basin and the global diaspora — engineered with modern
              privacy, sovereign financial safety, and authentic cultural discovery.
            </p>

            {/* 5 Movement Values Row */}
            <div className="grid grid-cols-5 gap-2 max-w-md pt-1">
              {MOVEMENT_VALUES.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#0A1324]/80 border border-white/[0.08] text-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-caribbeanSea/12 border border-brand-caribbeanSea/25 flex items-center justify-center text-brand-caribbeanTeal">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-brand-porcelain/90">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Primary Conversion CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="tk-btn-primary px-6 py-3.5 rounded-xl text-sm sm:text-[15px] inline-flex items-center gap-2 group min-h-[48px]"
              >
                <span>Join the Caribbean Network</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/explore"
                className="px-5 py-3.5 rounded-xl bg-[#0B1424]/90 hover:bg-[#111E35] border border-white/[0.12] hover:border-white/[0.22] text-white font-semibold text-sm sm:text-[15px] transition-colors inline-flex items-center gap-2 min-h-[48px]"
              >
                <Compass className="w-4 h-4 text-brand-caribbeanSea" />
                <span>Explore Culture &amp; Islands</span>
              </Link>
              <Link
                href="/login"
                className="px-4 py-3.5 rounded-xl text-brand-mist hover:text-white font-semibold text-sm transition-colors min-h-[48px] inline-flex items-center"
              >
                Sign In &rarr;
              </Link>
            </div>

            {/* Quiet Trust Indicators */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-brand-mist">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-caribbeanTeal" />
                30+ Islands &amp; Territories
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                Licensed Sounds &amp; Stems
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-goldenHour" />
                Verified Creators &amp; Pages
              </span>
            </div>
          </div>

          {/* Right Column: Executive Desktop Platform Window Showcase */}
          <div className="lg:col-span-7">
            <div
              aria-label="TUKUBI Desktop Workspace Preview"
              className="relative rounded-2xl bg-[#070D1A]/95 border border-white/[0.14] shadow-[0_32px_90px_-20px_rgba(0,0,0,0.88),0_0_0_1px_rgba(255,255,255,0.04)_inset] overflow-hidden backdrop-blur-2xl"
            >
              {/* Subtle top ambient edge highlight */}
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand-caribbeanSea/50 to-transparent" />

              {/* Window Top App Bar */}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#080F1E] border-b border-white/[0.07]">
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 mr-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/[0.14]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/[0.14]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/[0.14]" />
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Image
                      src="/brand/tukubi-symbol.svg"
                      alt=""
                      aria-hidden="true"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className="font-display text-sm font-bold tracking-[0.04em] text-white">
                      TUKUBI
                    </span>
                  </div>
                </div>

                <Link
                  href="/explore"
                  className="flex-1 max-w-xs h-8 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] flex items-center gap-2 text-xs text-brand-mist transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-brand-mist/80" />
                  <span>Search TUKUBI...</span>
                </Link>

                <div className="flex items-center gap-2 text-brand-mist">
                  <span className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5" />
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </span>
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#162744] to-[#0B1424] ring-1 ring-white/[0.16] flex items-center justify-center text-[10px] font-semibold text-white">
                    TK
                  </span>
                </div>
              </div>

              {/* 3-Column Desktop Workspace Interior */}
              <div className="grid grid-cols-12 gap-3 p-3.5 bg-[#070D1A]">
                {/* Left Navigation Column */}
                <div className="hidden sm:flex sm:col-span-3 flex-col gap-0.5 p-2 rounded-xl bg-[#0A1324]/90 border border-white/[0.07]">
                  {PREVIEW_NAV.map(({ label, href, icon: Icon, active }) => (
                    <Link
                      key={label}
                      href={href}
                      className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        active
                          ? 'bg-brand-caribbeanSea/[0.14] text-white font-semibold'
                          : 'text-brand-mist hover:text-white hover:bg-white/[0.04] font-medium'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-r-full bg-gradient-to-b from-brand-caribbeanTeal to-brand-caribbeanSea" />
                      )}
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          active ? 'text-brand-caribbeanSea' : 'text-brand-mist'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  ))}
                </div>

                {/* Center Feed Column */}
                <div className="col-span-12 sm:col-span-9 md:col-span-6 space-y-3">
                  {/* Editorial Composer Card */}
                  <div className="rounded-xl bg-[#0A1324]/90 border border-white/[0.07] p-3 space-y-2.5">
                    <Link
                      href="/signup"
                      className="flex items-center gap-2.5 group"
                    >
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#162744] to-[#0B1424] ring-1 ring-white/[0.14] flex items-center justify-center text-[10px] font-semibold text-brand-caribbeanTeal shrink-0">
                        +
                      </span>
                      <span className="flex-1 h-8 px-3 rounded-lg bg-white/[0.03] group-hover:bg-white/[0.06] border border-white/[0.07] flex items-center text-xs text-brand-mist transition-colors">
                        What&apos;s on your mind?
                      </span>
                    </Link>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-brand-mist">
                      <span className="inline-flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-brand-caribbeanTeal" /> Photo
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Video
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-violet-400" /> Link
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5 text-brand-goldenHour" /> Feeling
                      </span>
                    </div>
                  </div>

                  {/* Featured Editorial Post */}
                  <div className="rounded-xl bg-[#0A1324]/90 border border-white/[0.07] p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Link href="/profile/tukubi" className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-[#0B1B3B] ring-1 ring-brand-caribbeanTeal/35 flex items-center justify-center">
                          <Image
                            src="/brand/tukubi-symbol.svg"
                            alt=""
                            aria-hidden="true"
                            width={18}
                            height={18}
                            className="object-contain"
                          />
                        </span>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-white">TUKUBI</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                          </div>
                          <span className="text-[10.5px] text-brand-mist">
                            @tukubi • Caribbean Basin &amp; Diaspora
                          </span>
                        </div>
                      </Link>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-caribbeanSea/12 text-brand-caribbeanSea border border-brand-caribbeanSea/25">
                        Official
                      </span>
                    </div>

                    <p className="text-xs text-brand-porcelain/95 leading-relaxed">
                      Every island, creator, storefront, and diaspora hub — connected in one
                      calm, sovereign home.{' '}
                      <span className="text-brand-caribbeanSea">#TheCaribbeanConnected</span>
                    </p>

                    <div className="relative h-36 sm:h-40 rounded-lg overflow-hidden border border-white/[0.08]">
                      <img
                        src="/backgrounds/caribbean-blue-hour.jpg"
                        alt="Aerial Caribbean coastline at blue hour"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070D1A]/75 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10.5px] text-white/90">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-brand-caribbeanTeal" />
                          Greater &amp; Lesser Antilles • Guianas • Diaspora
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Community Note */}
                  <div className="rounded-xl bg-[#0A1324]/90 border border-white/[0.07] p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        The Caribbean is stronger when we support each other.
                      </p>
                      <p className="text-[11px] text-brand-mist truncate">
                        #TUKUBI • #SupportLocal • Multilingual EN / ES / FR / HT
                      </p>
                    </div>
                    <Link
                      href="/explore"
                      className="shrink-0 px-3 py-1.5 rounded-full bg-brand-caribbeanSea hover:bg-[#38BDF8] text-[#04101F] text-[11px] font-semibold transition-colors"
                    >
                      Explore
                    </Link>
                  </div>
                </div>

                {/* Right Discovery Column */}
                <div className="hidden md:flex md:col-span-3 flex-col gap-3">
                  {/* Discovery Topics */}
                  <div className="rounded-xl bg-[#0A1324]/90 border border-white/[0.07] p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white">
                        Discovery Channels
                      </span>
                      <TrendingUp className="w-3.5 h-3.5 text-brand-caribbeanTeal" />
                    </div>
                    <div className="space-y-1.5">
                      {PREVIEW_TOPICS.map((topic, idx) => (
                        <Link
                          key={topic.tag}
                          href={topic.href}
                          className="flex items-start gap-2 py-1 rounded-md hover:bg-white/[0.04] px-1 transition-colors"
                        >
                          <span className="text-[10.5px] font-semibold text-brand-mist w-3">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11.5px] font-semibold text-brand-porcelain truncate">
                              {topic.tag}
                            </p>
                            <p className="text-[10px] text-brand-mist truncate">
                              {topic.region}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Verified Directory */}
                  <div className="rounded-xl bg-[#0A1324]/90 border border-white/[0.07] p-3 space-y-2.5">
                    <span className="text-[11px] font-semibold text-white block">
                      Platform Hubs
                    </span>
                    <div className="space-y-2">
                      {PREVIEW_DIRECTORY.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#162744] to-[#0B1424] ring-1 ring-white/[0.14] flex items-center justify-center text-[9.5px] font-semibold text-white shrink-0">
                              {entry.initials}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-white truncate">
                                {entry.name}
                              </p>
                              <p className="text-[9.5px] text-brand-mist truncate">
                                {entry.handle}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={entry.href}
                            className="shrink-0 px-2.5 py-1 rounded-full bg-brand-caribbeanSea hover:bg-[#38BDF8] text-[#04101F] text-[10px] font-semibold transition-colors"
                          >
                            Open
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SIX PILLARS OF TUKUBI — WHAT MAKES TUKUBI DIFFERENT          */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto border-t border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="tk-section-label text-brand-caribbeanTeal block mb-2">
              What Makes TUKUBI Different
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Engineered Around Caribbean Identity
            </h2>
            <p className="text-sm sm:text-base text-brand-mist mt-3 leading-relaxed">
              TUKUBI is not a generic template with tropical colors layered on top.
              Every social graph boundary, audio stem registry, map index, and double-entry
              commerce workflow is built specifically for Caribbean communities and the diaspora.
            </p>
          </div>
          <Link
            href="/learn"
            className="text-sm font-semibold text-brand-caribbeanSea hover:text-white transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            <span>Architecture &amp; Platform Guide</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Pillar 1: Real Social Connection */}
          <div className="tk-panel p-6 sm:p-7 hover:border-brand-caribbeanTeal/35 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-brand-caribbeanTeal/12 border border-brand-caribbeanTeal/25 text-brand-caribbeanTeal flex items-center justify-center mb-5">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Real Social Connection
            </h3>
            <p className="text-sm text-brand-mist leading-relaxed">
              Clear, honest relationships: separate mutual Friends, directional Followers,
              and community Members. No fabricated engagement or artificial follower bots.
            </p>
          </div>

          {/* Pillar 2: Caribbean Sounds & Stems */}
          <div className="tk-panel p-6 sm:p-7 hover:border-brand-goldenHour/35 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-brand-goldenHour/12 border border-brand-goldenHour/25 text-brand-goldenHour flex items-center justify-center mb-5">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Caribbean Sounds &amp; Stems
            </h3>
            <p className="text-sm text-brand-mist leading-relaxed">
              Royalty-free riddims, authentic tenor pan stems, Kompa gouyad, Dancehall dubplates,
              and Soca rhythm tracks cleared for creator video sync and audio lounges.
            </p>
          </div>

          {/* Pillar 3: Caribbean Map & Discovery */}
          <div className="tk-panel p-6 sm:p-7 hover:border-brand-caribbeanSea/35 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-brand-caribbeanSea/12 border border-brand-caribbeanSea/25 text-brand-caribbeanSea flex items-center justify-center mb-5">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Caribbean Map &amp; Discovery
            </h3>
            <p className="text-sm text-brand-mist leading-relaxed">
              Geospatial discovery covering sovereign nations, constituent territories,
              and overseas departments across Greater Antilles, Lesser Antilles, and the Guianas.
            </p>
          </div>

          {/* Pillar 4: Creators, Reels & Podcasts */}
          <div className="tk-panel p-6 sm:p-7 hover:border-violet-400/35 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-violet-500/12 border border-violet-400/25 text-violet-300 flex items-center justify-center mb-5">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Creators, Reels &amp; Podcasts
            </h3>
            <p className="text-sm text-brand-mist leading-relaxed">
              9:16 vertical video studio with live camera capture, WebRTC live broadcasts,
              and complete podcast network distribution with Apple &amp; Spotify RSS syndication.
            </p>
          </div>

          {/* Pillar 5: Commerce & Bespoke Stores */}
          <div className="tk-panel p-6 sm:p-7 hover:border-emerald-400/35 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/12 border border-emerald-400/25 text-emerald-300 flex items-center justify-center mb-5">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Commerce &amp; Bespoke Stores
            </h3>
            <p className="text-sm text-brand-mist leading-relaxed">
              Verified business storefronts, artisan island marketplaces, physical and digital goods,
              and cultural event ticketing built for local and cross-border Caribbean trade.
            </p>
          </div>

          {/* Pillar 6: Global Diaspora Hubs */}
          <div className="tk-panel p-6 sm:p-7 hover:border-sky-400/35 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-sky-500/12 border border-sky-400/25 text-sky-300 flex items-center justify-center mb-5">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Global Diaspora Hubs
            </h3>
            <p className="text-sm text-brand-mist leading-relaxed">
              Dedicated city discovery for New York, Miami, Toronto, London, Paris, Montreal,
              Atlanta, and Amsterdam, keeping diaspora families anchored to their home roots.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE ISLAND & CULTURE EXPLORER PREVIEW                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto border-t border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 tk-section-label text-brand-caribbeanSea mb-2">
              <MapPin className="w-3.5 h-3.5" /> Cultural Sovereignty &amp; Heritage
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Explore by Island &amp; Territory
            </h2>
          </div>
          <Link
            href="/explore"
            className="text-sm font-semibold text-brand-caribbeanSea hover:text-white transition-colors inline-flex items-center gap-1"
          >
            Open Universal Discovery Engine &rarr;
          </Link>
        </div>

        {/* Island Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {FEATURED_ISLANDS.map((island) => {
            const active = selectedIsland.id === island.id;
            return (
              <button
                key={island.id}
                type="button"
                onClick={() => setSelectedIsland(island)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 min-h-[42px] ${
                  active
                    ? 'tk-btn-primary shadow-md'
                    : 'bg-[#0A1324]/90 hover:bg-[#111E35] text-brand-porcelain/85 border border-white/[0.08]'
                }`}
              >
                <span>{island.flagEmoji}</span>
                <span>{island.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Island Showcase Card */}
        {selectedIsland && (
          <div className="mt-4 tk-panel p-6 sm:p-8 md:p-10 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl sm:text-4xl">{selectedIsland.flagEmoji}</span>
                  <div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                      {selectedIsland.name}
                    </h3>
                    <p className="text-xs text-brand-mist mt-0.5">
                      Capital: {selectedIsland.capital} • Region: {selectedIsland.region}
                    </p>
                  </div>
                </div>

                <p className="text-sm sm:text-[15px] text-brand-porcelain/85 leading-relaxed">
                  {selectedIsland.summary}
                </p>

                {/* Cultural Highlights */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-brand-goldenHour mr-1">
                      Music:
                    </span>
                    {selectedIsland.musicGenres.map((g) => (
                      <span
                        key={g}
                        className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-brand-porcelain/90"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-brand-caribbeanTeal mr-1">
                      Cuisine:
                    </span>
                    {selectedIsland.cuisineTags.slice(0, 5).map((c) => (
                      <span
                        key={c}
                        className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-brand-porcelain/90"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-brand-caribbeanSea mr-1">
                      Festivals:
                    </span>
                    {selectedIsland.topFestivals.slice(0, 3).map((f) => (
                      <span
                        key={f}
                        className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-brand-porcelain/90"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Island CTAs */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  href={`/explore?geo=${selectedIsland.slug}`}
                  className="tk-btn-primary px-6 py-3.5 rounded-xl text-xs sm:text-sm text-center min-h-[44px] flex items-center justify-center"
                >
                  Explore {selectedIsland.name} Content
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.12] text-white font-semibold text-xs sm:text-sm transition-colors text-center min-h-[44px] flex items-center justify-center"
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
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto border-t border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 tk-section-label text-brand-goldenHour mb-2">
              <Music className="w-3.5 h-3.5" /> Rhythm Stems &amp; Audio Vault
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Authentic Caribbean Sounds
            </h2>
          </div>
          <Link
            href="/sounds"
            className="text-sm font-semibold text-brand-caribbeanSea hover:text-white transition-colors inline-flex items-center gap-1"
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
                className="tk-panel p-5 flex flex-col justify-between space-y-4 group hover:border-white/[0.18] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-md bg-brand-goldenHour/12 text-brand-goldenHour border border-brand-goldenHour/25">
                      {sound.genre}
                    </span>
                    <span className="text-xs text-brand-mist">
                      {sound.flag} {sound.countryIso}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-brand-caribbeanSea transition-colors line-clamp-1">
                    {sound.title}
                  </h4>
                  <p className="text-xs text-brand-mist mt-0.5 line-clamp-1">
                    {sound.artist}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
                  <span className="text-xs text-brand-mist tabular-nums">
                    {sound.durationFormatted}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePlaySound(sound)}
                    className="w-10 h-10 rounded-full bg-brand-caribbeanSea hover:bg-[#38BDF8] text-[#04101F] flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-sm"
                    aria-label={isPlaying ? `Pause ${sound.title}` : `Play ${sound.title}`}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SECURITY, ACCESSIBILITY & MULTILINGUAL GOVERNANCE STRIP      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto border-t border-white/[0.08]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="tk-panel p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-brand-caribbeanTeal/12 border border-brand-caribbeanTeal/25 text-brand-caribbeanTeal flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Row-Level Security</h3>
              <p className="text-xs text-brand-mist mt-1 leading-relaxed">
                Database-enforced authorization and double-entry financial ledger protection.
              </p>
            </div>
          </div>

          <div className="tk-panel p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-brand-caribbeanSea/12 border border-brand-caribbeanSea/25 text-brand-caribbeanSea flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Privacy by Default</h3>
              <p className="text-xs text-brand-mist mt-1 leading-relaxed">
                Cultural and location identity is optional and user-controlled at every layer.
              </p>
            </div>
          </div>

          <div className="tk-panel p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-violet-500/12 border border-violet-400/25 text-violet-300 flex items-center justify-center shrink-0">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Multilingual Support</h3>
              <p className="text-xs text-brand-mist mt-1 leading-relaxed">
                Native support across English, Spanish, French, and Haitian Creole.
              </p>
            </div>
          </div>

          <div className="tk-panel p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-brand-goldenHour/12 border border-brand-goldenHour/25 text-brand-goldenHour flex items-center justify-center shrink-0">
              <Accessibility className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">WCAG 2.2 AA Design</h3>
              <p className="text-xs text-brand-mist mt-1 leading-relaxed">
                High-contrast Midnight Reef surfaces, keyboard navigation, and responsive rails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* FINAL CALL TO ACTION                                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-br from-[#0B1B3B] via-[#0A1324] to-[#070D1A] border border-brand-caribbeanSea/25 p-8 sm:p-12 md:p-16 shadow-panel-lg relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-caribbeanTeal/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-brand-caribbeanSea/10 blur-3xl pointer-events-none" />

          <span className="tk-section-label text-brand-caribbeanTeal block mb-3">
            Together, We Build a Stronger Caribbean
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Join The Caribbean Connected.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-brand-mist max-w-2xl mx-auto leading-relaxed">
            Whether you are on island or in the diaspora, an artisan merchant, a recording creator,
            or a family member staying connected — welcome home to TUKUBI.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/signup"
              className="tk-btn-primary px-8 py-4 rounded-xl text-sm sm:text-[15px] min-h-[48px] inline-flex items-center gap-2"
            >
              <span>Create Your Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.14] text-white font-semibold text-sm min-h-[48px] inline-flex items-center transition-colors"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* PUBLIC FOOTER                                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] py-10 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto text-xs text-brand-mist">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <TukubiLogo variant="horizontal" size="xs" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
