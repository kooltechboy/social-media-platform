'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  MapPin,
  Globe,
  Sparkles,
  Users,
  Calendar,
  ShoppingBag,
  Building2,
  Tv,
  Radio,
  Heart,
  MessageCircle,
  CheckCircle,
  ArrowLeft,
  Filter,
  Flame,
  Clock,
  ExternalLink,
  Music,
  Play,
  Pause,
  Share2,
  Copy,
  Check,
  TrendingUp,
  Utensils,
  Palmtree,
  Newspaper,
  ShieldCheck,
  Disc,
  ArrowUpRight,
  Send,
  UserCheck,
} from 'lucide-react';
import GeographyFlag from '../geography-flag';
import {
  type CanonicalGeography,
  getDiasporaHubsForGeography,
} from '../../lib/explore/canonical-geography';
import { VIBE_CATEGORIES, type VibeCategory, type ExploreQueryResult } from '../../lib/explore/constants';
import type { CaribbeanSound } from '../../lib/constants/caribbean-sounds';
import { rsvpAction } from '../../lib/events/actions';
import { track } from '../../lib/monitoring/analytics';

interface GeographyDiscoveryViewProps {
  geography: CanonicalGeography;
  data: ExploreQueryResult;
  activeVibe?: string | null;
}

const CREATOR_CATEGORIES = [
  'All',
  'Music',
  'Food',
  'Culture',
  'Travel',
  'Comedy',
  'Fashion',
  'Sports',
  'Business',
] as const;

export default function GeographyDiscoveryView({
  geography,
  data,
  activeVibe,
}: GeographyDiscoveryViewProps) {
  const router = useRouter();
  const [selectedVibe, setSelectedVibe] = useState<string | null>(activeVibe || null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [creatorCategory, setCreatorCategory] = useState<string>('All');
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rsvpStates, setRsvpStates] = useState<Record<string, 'going' | 'interested' | null>>({});
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const diasporaHubs = getDiasporaHubsForGeography(geography);

  function handleVibeFilter(vibeId: string) {
    if (selectedVibe === vibeId) {
      setSelectedVibe(null);
      router.push(`/explore/${geography.slug}`);
    } else {
      setSelectedVibe(vibeId);
      router.push(`/explore/${geography.slug}?vibe=${vibeId}`);
      track('vibe_selected', { vibe: vibeId, destination: geography.slug });
    }
  }

  function toggleSoundPreview(sound: CaribbeanSound) {
    if (playingSoundId === sound.id) {
      audioRef.current?.pause();
      setPlayingSoundId(null);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(sound.audioUrl);
        audioRef.current.onended = () => setPlayingSoundId(null);
      } else {
        audioRef.current.src = sound.audioUrl;
      }
      audioRef.current.play().catch(() => {});
      setPlayingSoundId(sound.id);
      track('sound_opened', { soundId: sound.id, destination: geography.slug });
    }
  }

  async function handleRsvp(eventId: string, status: 'going' | 'interested') {
    setRsvpLoading((prev) => ({ ...prev, [eventId]: true }));
    try {
      const res = await rsvpAction(eventId, status);
      setRsvpStates((prev) => ({
        ...prev,
        [eventId]: res.status === status ? status : null,
      }));
      track('event_opened', { eventId, rsvpStatus: status, destination: geography.slug });
    } catch (err) {
      console.error('RSVP error:', err);
    } finally {
      setRsvpLoading((prev) => ({ ...prev, [eventId]: false }));
    }
  }

  function handleShare(url: string, id: string) {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  }

  const {
    posts = [],
    creators = [],
    events = [],
    communities = [],
    businesses = [],
    products = [],
    reels = [],
    podcasts = [],
    livestreams = [],
    sounds = [],
    officialStories = [],
    trendingSignals = [],
    counts,
  } = data;

  // Filtered creators based on category pill
  const filteredCreators = creators.filter((c: any) => {
    if (creatorCategory === 'All') return true;
    const text = `${c.bio || ''} ${c.display_name || ''} ${c.account_type || ''}`.toLowerCase();
    return text.includes(creatorCategory.toLowerCase());
  });

  // Trending posts (scored by likes, comments, recency)
  const trendingPosts = [...posts].sort(
    (a, b) => (b.likes_count ?? 0) + (b.comments_count ?? 0) - ((a.likes_count ?? 0) + (a.comments_count ?? 0))
  );

  return (
    <div className="w-full space-y-10 animate-fadeIn pb-24">
      {/* ────────────────────────────────────────────────────────── */}
      {/* BREADCRUMB & UTILITY BAR                                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-sandstone/80 hover:text-brand-caribbeanSea transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Caribbean Explore
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleShare(typeof window !== 'undefined' ? window.location.href : '', 'geo-share')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-brand-sandstone text-xs font-bold border border-white/10 transition-all min-h-[36px]"
          >
            {copiedId === 'geo-share' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedId === 'geo-share' ? 'Link Copied!' : 'Share'}</span>
          </button>
          <span className="text-[11px] md:text-xs font-mono font-bold text-brand-caribbeanSea bg-brand-caribbeanSea/10 px-3 py-1 rounded-full border border-brand-caribbeanSea/30">
            ISO: {geography.iso}
          </span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* DESTINATION HERO HEADER                                     */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden border border-brand-caribbeanSea/30">
        <div className="absolute right-0 top-0 w-[30rem] h-[30rem] bg-brand-caribbeanSea/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-brand-sunriseCoral/10 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="flex flex-wrap items-center gap-4">
            <GeographyFlag geo={geography} size="hero" className="shadow-2xl ring-2 ring-white/20" />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-white/10 text-brand-goldenHour border border-white/10">
                  {geography.region}
                </span>
                <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                  {geography.sovereign ? 'Sovereign Caribbean State' : 'Caribbean Island / Territory'}
                </span>
                {geography.subregion && (
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    {geography.subregion}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight flex items-center gap-3">
                <span>{geography.name}</span>
                <span className="text-2xl sm:text-3xl md:text-4xl">{geography.flagEmoji}</span>
              </h1>
              <p className="text-sm sm:text-base font-bold text-brand-caribbeanSea">
                Discover {geography.name} on TUKUBI — The Caribbean Connected.
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/90 leading-relaxed md:leading-[1.7] max-w-3xl font-normal">
            {geography.summary}
          </p>

          {/* Quick Destination Metadata Strip */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-brand-sandstone/75 pt-3 border-t border-white/10">
            <span><strong>Capital:</strong> {geography.capital}</span>
            <span>•</span>
            <span><strong>Languages:</strong> {geography.languages.join(', ')}</span>
            <span>•</span>
            <span><strong>Currency:</strong> {geography.currency}</span>
            {geography.callingCode && (
              <>
                <span>•</span>
                <span><strong>Calling Code:</strong> {geography.callingCode}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* VIBE CROSS-FILTERING RAIL                                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs md:text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-goldenHour" /> Cultural Vibes in {geography.name}
          </h2>
          {selectedVibe && (
            <button
              type="button"
              onClick={() => handleVibeFilter(selectedVibe)}
              className="text-xs text-rose-400 hover:underline font-bold cursor-pointer"
            >
              Clear Vibe Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {VIBE_CATEGORIES.map((v) => {
            const isSelected = selectedVibe === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVibeFilter(v.id)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border min-h-[40px] cursor-pointer ${
                  isSelected
                    ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-brand-sandstone border-white/10'
                }`}
              >
                <span>{v.icon}</span>
                <span>{v.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* DISCOVERY MODULE NAVIGATION TABS                           */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none text-xs sm:text-sm">
        {[
          { id: 'all', label: `All Discovery (${data.totalMatches})` },
          { id: 'happening-now', label: `Happening Now (${counts.posts + livestreams.length})` },
          { id: 'news', label: `News & Stories (${officialStories.length})` },
          { id: 'music', label: `Music & Sounds (${sounds.length})` },
          { id: 'food', label: `Food & Culture` },
          { id: 'culture', label: `Culture & Heritage` },
          { id: 'people', label: `People & Creators (${counts.creators})` },
          { id: 'communities', label: `Communities (${counts.communities})` },
          { id: 'diaspora', label: `Diaspora Hubs (${diasporaHubs.length})` },
          { id: 'shop', label: `Shop ${geography.name} (${counts.products})` },
          { id: 'live', label: `Live (${counts.livestreams})` },
          { id: 'reels', label: `Reels (${counts.reels})` },
          { id: 'podcasts', label: `Podcasts (${counts.podcasts})` },
          { id: 'events', label: `Events (${counts.events})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all min-h-[42px] cursor-pointer ${
              activeTab === t.id
                ? 'bg-brand-caribbeanSea text-slate-950 font-black shadow-md shadow-brand-caribbeanSea/20'
                : 'bg-white/5 hover:bg-white/10 text-brand-sandstone/80 border border-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 1: HAPPENING NOW                                   */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'happening-now') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-brand-sunriseCoral" /> Happening Now in {geography.name}
            </h3>
            <span className="text-xs text-brand-sandstone/60">Real-time platform activity</span>
          </div>

          {/* Live broadcast highlight banner */}
          {livestreams.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex flex-wrap items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <div>
                  <span className="text-xs font-black uppercase text-rose-400">Live Broadcast Available</span>
                  <h4 className="text-sm sm:text-base font-black text-white">{livestreams[0].title}</h4>
                </div>
              </div>
              <Link
                href="/live"
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition-all"
              >
                Watch Stream Live →
              </Link>
            </div>
          )}

          {/* Trending signals tags */}
          {trendingSignals.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl surface-card border border-white/10">
              <span className="text-xs font-black uppercase text-brand-caribbeanSea flex items-center gap-1.5 mr-2">
                <TrendingUp className="w-4 h-4" /> Trending Topics:
              </span>
              {trendingSignals.map((sig: any) => (
                <Link
                  key={sig.id}
                  href={`/explore?q=${encodeURIComponent(sig.entity_label)}`}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition-colors"
                >
                  #{sig.entity_label}
                </Link>
              ))}
            </div>
          )}

          {/* Recent & Trending Posts Grid */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingPosts.slice(0, 6).map((post) => {
                const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                return (
                  <article
                    key={post.id}
                    className="surface-card rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between border border-white/10 hover:border-brand-caribbeanSea/40 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/profile/${author?.username || 'member'}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                            {(author?.display_name || 'MB').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-white group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1.5">
                              {author?.display_name || 'Caribbean Member'}
                              {author?.is_verified && (
                                <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                              )}
                            </h4>
                            <span className="text-xs text-brand-sandstone/60">
                              @{author?.username || 'member'}
                            </span>
                          </div>
                        </Link>
                        <span className="text-[11px] text-brand-sandstone/50 font-mono">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-brand-sandstone/90 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {post.cultural_tags && post.cultural_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {post.cultural_tags.map((t: string) => (
                            <span key={t} className="text-[10px] font-bold text-brand-goldenHour bg-white/5 px-2 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-brand-sandstone/70">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-400" /> {post.likes_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-brand-caribbeanSea" />{' '}
                        {post.comments_count ?? 0}
                      </span>
                      <Link
                        href="/"
                        className="text-brand-caribbeanSea hover:underline text-xs font-black"
                      >
                        View in Feed →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-white/10">
              <Compass className="w-10 h-10 text-brand-caribbeanSea/60 mx-auto" />
              <h4 className="text-base font-bold text-white">No discussions posted in {geography.name} yet</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto">
                Be the first to share an update, cultural commentary, or discovery note from {geography.name}.
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs transition-all mt-2"
              >
                Create a Post
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 2: NEWS & STORIES                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'news') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-sky-400" /> {geography.name} News &amp; Stories
            </h3>
            <span className="text-xs text-brand-sandstone/60">Distinguishing official, community &amp; creator updates</span>
          </div>

          {officialStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officialStories.map((story: any) => {
                const author = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
                const isOfficial = story.is_official || story.official_content_type === 'news';
                return (
                  <div
                    key={story.id}
                    className={`p-5 rounded-2xl border space-y-3 flex flex-col justify-between ${
                      isOfficial
                        ? 'surface-card border-brand-caribbeanSea/50 bg-brand-caribbeanSea/5'
                        : 'surface-card border-white/10'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            isOfficial
                              ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {isOfficial ? 'TUKUBI Official Update' : 'Community Story'}
                        </span>
                        <span className="text-xs text-brand-sandstone/50 font-mono">
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-black text-sm sm:text-base text-white">{author?.display_name || 'TUKUBI'}</h4>
                      <p className="text-xs sm:text-sm text-brand-sandstone/90 leading-relaxed line-clamp-3">
                        {story.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-brand-sandstone/60">Verified Caribbean Source</span>
                      <Link href="/" className="text-brand-caribbeanSea hover:underline font-bold">
                        Read Story →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-white/10">
              <ShieldCheck className="w-10 h-10 text-sky-400/60 mx-auto" />
              <h4 className="text-base font-bold text-white">No official bulletins posted today in {geography.name}</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto">
                Official platform dispatches, civic announcements, and verified community news will appear here. No fabricated news is ever generated.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 3: MUSIC & SOUNDS DISCOVERY                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'music') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-400" /> Music &amp; Sounds of {geography.name}
            </h3>
            <Link
              href={`/sounds?search=${encodeURIComponent(geography.name)}`}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Open Sounds System <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Cultural Music Genres in this Destination */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-brand-sandstone/60 tracking-wider">
              Signature Musical Genres &amp; Rhythms:
            </span>
            <div className="flex flex-wrap gap-2">
              {geography.musicGenres.map((genre) => (
                <Link
                  key={genre}
                  href={`/sounds?search=${encodeURIComponent(genre)}`}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Disc className="w-3.5 h-3.5 text-purple-400" />
                  <span>{genre}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Sounds Cards Grid */}
          {sounds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sounds.slice(0, 6).map((sound) => {
                const isPlaying = playingSoundId === sound.id;
                return (
                  <div
                    key={sound.id}
                    className="surface-card rounded-2xl p-5 space-y-4 shadow-lg border border-white/10 flex flex-col justify-between group hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sound.coverGradient} flex items-center justify-center shadow-lg shrink-0 border border-white/10 relative overflow-hidden`}>
                        <button
                          type="button"
                          onClick={() => toggleSoundPreview(sound)}
                          className="w-full h-full flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
                          aria-label={isPlaying ? 'Pause sound preview' : 'Play sound preview'}
                        >
                          {isPlaying ? <Pause className="w-6 h-6 text-purple-300" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
                        </button>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                          {sound.genre}
                        </span>
                        <h4 className="font-black text-sm text-white truncate leading-snug">{sound.title}</h4>
                        <p className="text-xs text-brand-sandstone/75 truncate">{sound.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-brand-sandstone/60 pt-2 border-t border-white/10 font-mono">
                      <span>{sound.durationFormatted}</span>
                      <span>{sound.bpm} BPM</span>
                      <Link
                        href={`/sounds?id=${encodeURIComponent(sound.id)}`}
                        className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 font-sans"
                      >
                        Use Sound →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-white/10">
              <Music className="w-10 h-10 text-purple-400/60 mx-auto" />
              <h4 className="text-base font-bold text-white">Explore Caribbean Sounds</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto">
                Discover stems, sound system dubplates, and verified Caribbean tracks from artists across the archipelago.
              </p>
              <Link
                href="/sounds"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 text-white font-black text-xs transition-all mt-2"
              >
                Browse Sounds System
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 4: FOOD & CUISINE                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'food') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" /> Food &amp; Cuisine of {geography.name}
            </h3>
            <span className="text-xs text-brand-sandstone/60">Gastronomy, recipes &amp; culinary artisans</span>
          </div>

          {/* Signature dishes */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-brand-sandstone/60 tracking-wider">
              Signature Traditional Dishes &amp; Specialties:
            </span>
            <div className="flex flex-wrap gap-2">
              {geography.cuisineTags.map((dish) => (
                <Link
                  key={dish}
                  href={`/explore?q=${encodeURIComponent(dish)}`}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>🍛</span>
                  <span>{dish}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Culinary businesses or products */}
          {businesses.filter((b: any) => b.category?.toLowerCase().includes('food') || b.category?.toLowerCase().includes('restaurant')).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {businesses
                .filter((b: any) => b.category?.toLowerCase().includes('food') || b.category?.toLowerCase().includes('restaurant'))
                .map((b: any) => (
                  <div key={b.id} className="surface-card rounded-2xl p-5 space-y-3 border border-white/10">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 uppercase">
                      {b.category}
                    </span>
                    <h4 className="font-black text-base text-white">{b.name}</h4>
                    {b.description && <p className="text-xs text-brand-sandstone/85 line-clamp-2">{b.description}</p>}
                    <Link href={`/pages/${b.slug}`} className="text-xs font-bold text-amber-400 hover:underline block pt-2">
                      View Restaurant / Kitchen →
                    </Link>
                  </div>
                ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-6 border border-white/10 text-xs sm:text-sm text-brand-sandstone/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-black text-white text-sm">Culinary Heritage of {geography.name}</h4>
                <p>Taste the island! Explore Caribbean food creators, family recipes, and spice markets.</p>
              </div>
              <Link
                href="/explore/vibe/food"
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shrink-0 transition-all"
              >
                Explore Caribbean Food Vibe →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 5: CULTURE & HERITAGE                              */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'culture') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Palmtree className="w-5 h-5 text-emerald-400" /> Culture, Heritage &amp; Traditions
            </h3>
            <span className="text-xs text-brand-sandstone/60">Festivals, folklore &amp; national heritage</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Festivals Card */}
            <div className="surface-card rounded-2xl p-6 space-y-4 border border-white/10">
              <div className="flex items-center gap-2 text-brand-goldenHour">
                <Sparkles className="w-5 h-5" />
                <h4 className="font-black text-sm uppercase tracking-wider text-white">Celebrated Festivals &amp; Carnivals</h4>
              </div>
              <div className="space-y-2.5">
                {geography.topFestivals.map((fest) => (
                  <div key={fest} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-lg">🎭</span>
                    <span className="font-bold text-xs sm:text-sm text-white">{fest}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cultural Identity Tags */}
            <div className="surface-card rounded-2xl p-6 space-y-4 border border-white/10">
              <div className="flex items-center gap-2 text-brand-caribbeanSea">
                <Globe className="w-5 h-5" />
                <h4 className="font-black text-sm uppercase tracking-wider text-white">Living Cultural Heritage</h4>
              </div>
              <p className="text-xs sm:text-sm text-brand-sandstone/85 leading-relaxed">
                {geography.name} maintains a rich tapestry of Caribbean traditions, indigenous echoes, language preservation, and historical significance.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {geography.culturalTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-xl bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30 text-xs font-bold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 6: PEOPLE & CREATORS                               */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'people') && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-sunriseCoral" /> People &amp; Creators of {geography.name}
              </h3>
              <span className="text-xs text-brand-sandstone/60">Island natives, resident creators &amp; cultural ambassadors</span>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {CREATOR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCreatorCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    creatorCategory === cat
                      ? 'bg-brand-sunriseCoral text-slate-950 font-black'
                      : 'bg-white/5 text-brand-sandstone hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredCreators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCreators.map((c: any) => (
                <div
                  key={c.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md border border-white/10 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                      {(c.display_name || 'CR').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm text-white truncate flex items-center gap-1.5">
                        {c.display_name}
                        {c.is_verified && <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" />}
                      </h4>
                      <p className="text-xs text-brand-sandstone/70 truncate">@{c.username}</p>
                      {(c.island || c.country) && (
                        <span className="text-[10px] font-mono font-bold text-brand-goldenHour bg-white/10 px-2 py-0.5 rounded mt-1 inline-block">
                          {c.island || c.country}
                        </span>
                      )}
                    </div>
                  </div>

                  {c.bio && (
                    <p className="text-xs text-brand-sandstone/85 leading-relaxed line-clamp-2">
                      {c.bio}
                    </p>
                  )}

                  <div className="pt-3 border-t border-white/10">
                    <Link
                      href={`/profile/${c.username}`}
                      className="w-full text-center bg-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black py-2 rounded-xl text-xs transition-all block"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-white/10">
              <Users className="w-10 h-10 text-brand-sunriseCoral/60 mx-auto" />
              <h4 className="text-base font-bold text-white">No creators in this category yet</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto">
                Are you a creator from {geography.name}? Join TUKUBI Creator Studio and showcase your talent to the Caribbean and its global diaspora.
              </p>
              <Link
                href="/creator-studio"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-sunriseCoral text-slate-950 font-black text-xs transition-all mt-2"
              >
                Join Creator Studio
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 7: COMMUNITIES                                     */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'communities') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" /> Communities &amp; Guilds in {geography.name}
            </h3>
            <Link href="/communities" className="text-xs font-bold text-cyan-400 hover:underline">
              Explore All Communities →
            </Link>
          </div>

          {communities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {communities.map((comm: any) => (
                <div
                  key={comm.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-lg border border-white/10"
                >
                  <div className="space-y-2">
                    <h4 className="font-black text-base text-white leading-snug">{comm.name}</h4>
                    {comm.description && (
                      <p className="text-xs text-brand-sandstone/85 line-clamp-2 leading-relaxed">
                        {comm.description}
                      </p>
                    )}
                    <span className="text-xs text-brand-sandstone/70 block">
                      {comm.member_count ?? 0} Members
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <Link
                      href={`/communities/${comm.slug || comm.id}`}
                      className="w-full text-center bg-cyan-400 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all block cursor-pointer"
                    >
                      Join Community Guild →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-white/10">
              <Globe className="w-10 h-10 text-cyan-400/60 mx-auto" />
              <h4 className="text-base font-bold text-white">No community guilds launched in {geography.name} yet</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto">
                Launch the first community guild for {geography.name}! Connect members through shared culture, music, professional collaboration, and events.
              </p>
              <Link
                href="/communities"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs transition-all mt-2"
              >
                Launch a Community Guild
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 8: DIASPORA DISCOVERY                               */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'diaspora') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" /> {geography.name} Diaspora Worldwide
            </h3>
            <span className="text-xs text-brand-sandstone/60">Major metropolitan hubs connecting this community</span>
          </div>

          {diasporaHubs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {diasporaHubs.map((hub) => (
                <div
                  key={hub.slug}
                  className="surface-card surface-card-interactive rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-md border border-white/10 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <GeographyFlag geo={hub.iso} size="md" />
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {hub.iso}
                      </span>
                    </div>
                    <h4 className="font-black text-base text-white group-hover:text-amber-300 transition-colors">
                      {hub.name}
                    </h4>
                    <p className="text-xs text-brand-sandstone/80 line-clamp-2 leading-relaxed">
                      {hub.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <Link
                      href={`/explore/diaspora/${hub.slug}`}
                      className="w-full text-center bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2 rounded-xl text-xs transition-all block cursor-pointer"
                    >
                      Explore {hub.capital} Hub →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-6 border border-white/10 text-xs sm:text-sm text-brand-sandstone/80">
              <p>Explore Caribbean diaspora hubs in New York, Miami, Toronto, London, Montréal, and beyond on TUKUBI.</p>
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 9: SHOP / MARKETPLACE DISCOVERY                     */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'shop') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" /> Shop {geography.name}
            </h3>
            <Link href="/marketplace" className="text-xs font-bold text-emerald-400 hover:underline">
              Open Marketplace →
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((prod: any) => (
                <div
                  key={prod.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 space-y-3 flex flex-col justify-between border border-white/10"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 uppercase">
                      {prod.product_kind}
                    </span>
                    <h4 className="font-black text-sm text-white line-clamp-1">{prod.title}</h4>
                    {prod.description && (
                      <p className="text-xs text-brand-sandstone/80 line-clamp-2">{prod.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="font-black text-sm text-white font-mono">
                      {prod.currency} ${(prod.price_minor / 100).toFixed(2)}
                    </span>
                    <Link
                      href="/marketplace"
                      className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-all"
                    >
                      Buy Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-white/10">
              <ShoppingBag className="w-10 h-10 text-emerald-400/60 mx-auto" />
              <h4 className="text-base font-bold text-white">No products listed in {geography.name} yet</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto">
                Are you an artisan, food producer, fashion designer, or digital creator from {geography.name}? List your authentic goods on TUKUBI Marketplace.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs transition-all mt-2"
              >
                List on Marketplace
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 10: LIVE DISCOVERY                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'live') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-400" /> Live in {geography.name}
            </h3>
            <Link href="/live" className="text-xs font-bold text-rose-400 hover:underline">
              Live Lounge →
            </Link>
          </div>

          {livestreams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {livestreams.map((stream: any) => (
                <div key={stream.id} className="surface-card rounded-2xl p-5 space-y-3 border border-rose-500/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white uppercase">
                      {stream.state === 'live' ? 'LIVE NOW' : 'SCHEDULED'}
                    </span>
                    <span className="text-xs text-brand-sandstone/60">{stream.peak_viewers} viewers</span>
                  </div>
                  <h4 className="font-black text-sm text-white">{stream.title}</h4>
                  <Link
                    href="/live"
                    className="w-full text-center bg-rose-500 hover:bg-rose-600 text-white font-black py-2 rounded-xl text-xs block transition-all"
                  >
                    Join Stream →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-white/10">
              <Radio className="w-10 h-10 text-rose-400/60 mx-auto" />
              <h4 className="text-base font-bold text-white">No live activity in {geography.name} right now</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto">
                No active broadcasts right now. Creators from {geography.name} can go live directly from the TUKUBI Live Hub.
              </p>
              <Link
                href="/live"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white font-black text-xs transition-all mt-2"
              >
                Go Live on TUKUBI
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 11: REELS & PODCASTS                               */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'reels') && reels.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-rose-400" /> Trending {geography.name} Reels
            </h3>
            <Link href="/reels" className="text-xs font-bold text-rose-400 hover:underline">
              Open Reels Stream →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {reels.map((reel: any) => (
              <Link
                key={reel.id}
                href="/reels"
                className="surface-card surface-card-interactive rounded-2xl p-3 space-y-2 block border border-white/10 group cursor-pointer"
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
        </section>
      )}

      {(activeTab === 'all' || activeTab === 'podcasts') && podcasts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-sky-400" /> Podcasts from {geography.name}
            </h3>
            <Link href="/podcasts" className="text-xs font-bold text-sky-400 hover:underline">
              Podcasts Hub →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {podcasts.map((pod: any) => (
              <div key={pod.id} className="surface-card rounded-2xl p-5 space-y-3 border border-white/10">
                <h4 className="font-black text-base text-white">{pod.title}</h4>
                {pod.description && <p className="text-xs text-brand-sandstone/85 line-clamp-2">{pod.description}</p>}
                <Link href="/podcasts" className="text-xs font-bold text-sky-400 hover:underline block pt-2">
                  Listen to Episodes →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 12: EVENTS WITH INTERACTIONS                       */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'events') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-400" /> Events &amp; Celebrations in {geography.name}
            </h3>
            <Link href="/events" className="text-xs font-bold text-yellow-400 hover:underline">
              All Caribbean Events →
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {events.map((evt: any) => {
                const currentRsvp = rsvpStates[evt.id];
                const isLoading = rsvpLoading[evt.id];
                return (
                  <div
                    key={evt.id}
                    className="surface-card rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg border border-white/10"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 uppercase tracking-wider">
                          {evt.event_kind}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleShare(`${typeof window !== 'undefined' ? window.location.origin : ''}/events`, evt.id)}
                          className="text-brand-sandstone/50 hover:text-white transition-colors cursor-pointer"
                          title="Share event link"
                        >
                          {copiedId === evt.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                        </button>
                      </div>
                      <h4 className="font-black text-base text-white leading-snug">{evt.title}</h4>
                      {evt.description && (
                        <p className="text-xs text-brand-sandstone/85 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      )}
                      <div className="text-xs text-brand-sandstone/70 space-y-1 pt-1">
                        <p className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{new Date(evt.starts_at).toLocaleDateString()}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                          <span>{evt.venue || evt.cities?.name || geography.name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleRsvp(evt.id, 'going')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            currentRsvp === 'going'
                              ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-black shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{currentRsvp === 'going' ? 'Going ✓' : 'Going'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleRsvp(evt.id, 'interested')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            currentRsvp === 'interested'
                              ? 'bg-purple-500 text-white border-purple-400 font-black shadow-md'
                              : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>{currentRsvp === 'interested' ? 'Interested ✓' : 'Interested'}</span>
                        </button>
                      </div>
                      <Link
                        href="/events"
                        className="w-full text-center bg-white/10 hover:bg-white/15 text-white font-bold py-2 rounded-xl text-xs transition-all block"
                      >
                        Get Tickets / Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-white/10">
              <Calendar className="w-10 h-10 text-yellow-400/60 mx-auto" />
              <h4 className="text-base font-bold text-white">No upcoming events listed in {geography.name} yet</h4>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto">
                Host a cultural festival, fete, concert, community meet-up, or virtual celebration in {geography.name}.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs transition-all mt-2"
              >
                Host an Event
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
