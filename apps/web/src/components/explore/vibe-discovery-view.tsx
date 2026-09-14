'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  MapPin,
  Sparkles,
  Users,
  Calendar,
  ShoppingBag,
  Tv,
  Radio,
  Heart,
  MessageCircle,
  CheckCircle,
  ArrowLeft,
  Flame,
  Globe,
  Clock,
  Music,
  Play,
  Pause,
  Share2,
  Check,
  UserCheck,
  Disc,
} from 'lucide-react';
import GeographyFlag from '../geography-flag';
import type { VibeCategory, ExploreQueryResult } from '../../lib/explore/constants';
import { CARIBBEAN_CORE_ENTITIES } from '../../lib/explore/canonical-geography';
import type { CaribbeanSound } from '../../lib/constants/caribbean-sounds';
import { rsvpAction } from '../../lib/events/actions';
import { track } from '../../lib/monitoring/analytics';

interface VibeDiscoveryViewProps {
  vibe: VibeCategory;
  data: ExploreQueryResult;
  activeCountry?: string | null;
}

export default function VibeDiscoveryView({
  vibe,
  data,
  activeCountry,
}: VibeDiscoveryViewProps) {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(activeCountry || null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rsvpStates, setRsvpStates] = useState<Record<string, 'going' | 'interested' | null>>({});
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);

  function handleCountryFilter(geoSlug: string) {
    if (selectedCountry === geoSlug) {
      setSelectedCountry(null);
      router.push(`/explore/vibe/${vibe.id}`);
    } else {
      setSelectedCountry(geoSlug);
      router.push(`/explore/vibe/${vibe.id}?country=${geoSlug}`);
      track('destination_selected', { destination: geoSlug, vibe: vibe.id });
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
      track('sound_opened', { soundId: sound.id, vibe: vibe.id });
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
      track('event_opened', { eventId, rsvpStatus: status, vibe: vibe.id });
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
    products = [],
    reels = [],
    sounds = [],
    podcasts = [],
    counts,
  } = data;

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-20">
      {/* ────────────────────────────────────────────────────────── */}
      {/* BREADCRUMB & BACK LINK                                     */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-sandstone/80 hover:text-brand-caribbeanSea transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Caribbean Explore
        </Link>
        <span className="text-[11px] md:text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
          VIBE: #{vibe.id.toUpperCase()}
        </span>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* VIBE HERO BANNER                                           */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden border border-purple-500/30">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-4">
            <span className="text-4xl sm:text-5xl md:text-6xl p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
              {vibe.icon}
            </span>
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                Cultural Theme
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {vibe.name}
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/90 leading-relaxed md:leading-[1.6]">
            {vibe.desc}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {vibe.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/5 text-brand-sandstone/80 border border-white/10"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* COMBINE WITH GEOGRAPHY (Country Cross-Filter)              */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs md:text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-brand-caribbeanSea" /> Combine &quot;{vibe.name}&quot; with an Island / Territory
          </h2>
          {selectedCountry && (
            <button
              type="button"
              onClick={() => handleCountryFilter(selectedCountry)}
              className="text-xs text-rose-400 hover:underline font-bold cursor-pointer"
            >
              Clear Island Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {CARIBBEAN_CORE_ENTITIES.map((geo) => {
            const isSelected = selectedCountry === geo.slug || selectedCountry === geo.iso;
            return (
              <button
                key={geo.slug}
                type="button"
                onClick={() => handleCountryFilter(geo.slug)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border min-h-[38px] cursor-pointer ${
                  isSelected
                    ? 'bg-brand-caribbeanSea text-slate-950 border-brand-caribbeanSea font-black shadow-md shadow-brand-caribbeanSea/20'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <GeographyFlag geo={geo} size="xs" />
                <span>{geo.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* CATEGORY TABS                                              */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none text-xs sm:text-sm">
          {[
            { id: 'all', label: `All Matches (${data.totalMatches})` },
            { id: 'posts', label: `Posts (${counts.posts})` },
            { id: 'sounds', label: `Sounds (${sounds.length})` },
            { id: 'creators', label: `Creators (${counts.creators})` },
            { id: 'events', label: `Events (${counts.events})` },
            { id: 'communities', label: `Communities (${counts.communities})` },
            { id: 'products', label: `Shop (${counts.products})` },
            { id: 'reels', label: `Reels (${counts.reels})` },
            { id: 'podcasts', label: `Podcasts (${counts.podcasts})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all min-h-[38px] cursor-pointer ${
                activeTab === t.id
                  ? 'bg-purple-500 text-white font-black shadow-md shadow-purple-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-brand-sandstone/80 border border-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Empty State ── */}
        {data.totalMatches === 0 && (
          <div className="surface-card rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto border border-white/10">
            <Compass className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
            <div className="space-y-1.5">
              <h3 className="text-lg md:text-xl font-black text-white">
                No active results for {vibe.name} {selectedCountry ? `in ${selectedCountry}` : 'yet'}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 leading-relaxed">
                Be the first to create posts, host events, or build communities for this cultural vibe!
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link
                href="/create"
                className="px-4 py-2.5 rounded-xl bg-purple-500 text-white font-black text-xs sm:text-sm transition-all shadow-md"
              >
                Post about {vibe.name}
              </Link>
              <Link
                href="/events"
                className="px-4 py-2.5 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md"
              >
                Create an Event
              </Link>
            </div>
          </div>
        )}

        {/* ── Sounds & Music (if available) ── */}
        {(activeTab === 'all' || activeTab === 'sounds') && sounds.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Music className="w-4 h-4" /> Sounds &amp; Tracks for {vibe.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sounds.slice(0, 6).map((sound) => {
                const isPlaying = playingSoundId === sound.id;
                return (
                  <div
                    key={sound.id}
                    className="surface-card rounded-2xl p-4 space-y-3 shadow-lg border border-white/10 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSoundPreview(sound)}
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sound.coverGradient} flex items-center justify-center shadow shrink-0 text-white cursor-pointer`}
                        aria-label={isPlaying ? 'Pause sound preview' : 'Play sound preview'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5 text-purple-300" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-purple-300 uppercase">{sound.genre}</span>
                        <h4 className="font-bold text-sm text-white truncate">{sound.title}</h4>
                        <p className="text-xs text-brand-sandstone/70 truncate">{sound.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-brand-sandstone/60 pt-2 border-t border-white/10">
                      <span>{sound.durationFormatted}</span>
                      <Link href={`/sounds?id=${encodeURIComponent(sound.id)}`} className="text-purple-400 hover:underline font-bold">
                        Use Sound →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Posts ── */}
        {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Flame className="w-4 h-4" /> Cultural Discussions &amp; Posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post: any) => {
                const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                return (
                  <article
                    key={post.id}
                    className="surface-card rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between border border-white/10"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/profile/${author?.username || 'member'}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-purple-500 text-white font-black flex items-center justify-center text-xs shadow-md">
                            {(author?.display_name || 'MB').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
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
                        <span className="text-xs text-brand-sandstone/50 font-mono">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-brand-sandstone/90 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-brand-sandstone/70">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-400" /> {post.likes_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-purple-300" />{' '}
                        {post.comments_count ?? 0}
                      </span>
                      <Link
                        href="/"
                        className="text-purple-300 hover:underline text-xs font-black flex items-center"
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

        {/* ── Creators ── */}
        {(activeTab === 'all' || activeTab === 'creators') && creators.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-2">
              <Users className="w-4 h-4" /> Creators &amp; Artists
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {creators.map((c: any) => (
                <div
                  key={c.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                      {(c.display_name || 'CR').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm text-white truncate flex items-center gap-1.5">
                        {c.display_name}
                        {c.is_verified && (
                          <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                        )}
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
          </div>
        )}

        {/* ── Events ── */}
        {(activeTab === 'all' || activeTab === 'events') && events.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-yellow-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Events &amp; Festivals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {events.map((evt: any) => {
                const currentRsvp = rsvpStates[evt.id];
                const isLoading = rsvpLoading[evt.id];
                return (
                  <div
                    key={evt.id}
                    className="surface-card rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-lg border border-white/10"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 uppercase tracking-wider">
                          {evt.event_kind}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleShare(`${typeof window !== 'undefined' ? window.location.origin : ''}/events`, evt.id)}
                          className="text-brand-sandstone/50 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedId === evt.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
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
                          <span>{evt.venue || evt.cities?.name || 'Caribbean'}</span>
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
                        Get Tickets / RSVP →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Communities ── */}
        {(activeTab === 'all' || activeTab === 'communities') && communities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Related Communities &amp; Guilds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {communities.map((comm: any) => (
                <div key={comm.id} className="surface-card rounded-2xl p-5 space-y-3 border border-white/10">
                  <h4 className="font-black text-base text-white">{comm.name}</h4>
                  {comm.description && <p className="text-xs text-brand-sandstone/85 line-clamp-2">{comm.description}</p>}
                  <Link href={`/communities/${comm.slug || comm.id}`} className="text-xs font-bold text-cyan-400 hover:underline block pt-2">
                    Join Guild →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Shop / Products ── */}
        {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Marketplace Items for {vibe.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => (
                <div key={p.id} className="surface-card rounded-2xl p-5 space-y-3 border border-white/10">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 uppercase">
                    {p.product_kind}
                  </span>
                  <h4 className="font-black text-sm text-white truncate">{p.title}</h4>
                  <div className="pt-2 flex items-center justify-between text-xs font-bold">
                    <span>{p.currency} ${(p.price_minor / 100).toFixed(2)}</span>
                    <Link href="/marketplace" className="text-emerald-400 hover:underline">
                      Buy Now →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reels ── */}
        {(activeTab === 'all' || activeTab === 'reels') && reels.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <Tv className="w-4 h-4" /> Trending Reels
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {reels.map((reel: any) => (
                <Link
                  key={reel.id}
                  href="/reels"
                  className="surface-card surface-card-interactive rounded-2xl p-3 space-y-2 block border border-white/10 group cursor-pointer"
                >
                  <div className="aspect-[9/16] bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-white/5">
                    {reel.thumbnail_path ? (
                      <img src={reel.thumbnail_path} alt={reel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
