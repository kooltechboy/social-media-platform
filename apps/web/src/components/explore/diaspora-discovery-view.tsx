'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  MapPin,
  Globe,
  Sparkles,
  Users,
  Calendar,
  Building2,
  Heart,
  MessageCircle,
  CheckCircle,
  ArrowLeft,
  Flame,
  Clock,
  ExternalLink,
  Music2,
  Play,
  Pause,
  Share2,
  Radio,
  ShoppingBag,
  Award,
  BookOpen,
} from 'lucide-react';
import GeographyFlag from '../geography-flag';
import {
  getOriginNationsForHub,
  type CanonicalGeography,
} from '../../lib/explore/canonical-geography';
import type { ExploreQueryResult } from '../../lib/explore/constants';
import { rsvpAction } from '../../lib/events/actions';

interface DiasporaDiscoveryViewProps {
  hub: CanonicalGeography;
  data: ExploreQueryResult;
}

export default function DiasporaDiscoveryView({
  hub,
  data,
}: DiasporaDiscoveryViewProps) {
  const [activeTab, setActiveTab] = useState<
    'all' | 'roots' | 'communities' | 'events' | 'creators' | 'posts' | 'sounds' | 'products'
  >('all');

  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [rsvpPendingId, setRsvpPendingId] = useState<string | null>(null);
  const [rsvpSuccessId, setRsvpSuccessId] = useState<string | null>(null);

  const { counts, livestreams, sounds, products, officialStories } = data;
  const originNations = getOriginNationsForHub(hub.slug);

  const handlePlaySound = (soundId: string, previewUrl?: string) => {
    if (!previewUrl) return;
    if (playingSoundId === soundId) {
      audioElement?.pause();
      setPlayingSoundId(null);
      return;
    }
    if (audioElement) {
      audioElement.pause();
    }
    const audio = new Audio(previewUrl);
    audio.play().catch(() => {});
    audio.onended = () => setPlayingSoundId(null);
    setAudioElement(audio);
    setPlayingSoundId(soundId);
  };

  const handleRsvp = async (eventId: string, status: 'going' | 'interested') => {
    setRsvpPendingId(eventId);
    try {
      const res = await rsvpAction(eventId, status);
      if (!res.error && res.status) {
        setRsvpSuccessId(eventId);
        setTimeout(() => setRsvpSuccessId(null), 3000);
      }
    } catch {
      // Graceful fallback
    } finally {
      setRsvpPendingId(null);
    }
  };

  const handleShare = async (title: string, url: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Ignored
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-16">
      {/* ── Breadcrumbs ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-sandstone/80 hover:text-brand-caribbeanSea transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Caribbean Discovery
        </Link>
        <span className="text-[11px] md:text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
          DIASPORA METROPOLIS: {hub.iso}
        </span>
      </div>

      {/* ── Hub Hero ── */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden border border-amber-500/30">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-4">
            <GeographyFlag geo={hub.iso} size="hero" className="shadow-lg" />
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                Global Caribbean Diaspora Center
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {hub.name}
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/90 leading-relaxed md:leading-[1.6]">
            {hub.summary}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-brand-sandstone/70 pt-2 border-t border-white/10">
            <span><strong>Metropolitan Area:</strong> {hub.capital}</span>
            <span>•</span>
            <span><strong>Languages:</strong> {hub.languages.join(', ')}</span>
            <span>•</span>
            <span><strong>Currency:</strong> {hub.currency}</span>
          </div>

          {hub.topFestivals && hub.topFestivals.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-amber-400">Celebrations:</span>
              {hub.topFestivals.map((fest) => (
                <span key={fest} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white font-medium">
                  {fest}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Caribbean Roots & Origin Nations ── */}
      {originNations.length > 0 && (
        <section className="space-y-4 surface-card rounded-3xl p-6 sm:p-8 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" /> Origin Roots in {hub.name}
              </h2>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">
                Major Caribbean nations, islands, and communities that anchor the diaspora in this metropolis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {originNations.map((origin) => (
              <Link
                key={origin.iso}
                href={`/explore/${origin.slug}`}
                className="surface-card surface-card-interactive rounded-2xl p-3.5 flex flex-col items-center text-center gap-2 border border-white/10 group"
              >
                <GeographyFlag geo={origin.iso} size="md" className="group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                  {origin.name}
                </span>
                <span className="text-[10px] text-brand-sandstone/60 font-mono">
                  {origin.iso}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Category Filter Tabs ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
          {[
            { id: 'all', label: `All (${data.totalMatches})` },
            { id: 'communities', label: `Communities (${counts.communities})` },
            { id: 'events', label: `Events (${counts.events})` },
            { id: 'sounds', label: `Sounds (${sounds.length})` },
            { id: 'creators', label: `Creators (${counts.creators})` },
            { id: 'posts', label: `Discussions (${counts.posts})` },
            { id: 'products', label: `Marketplace (${products.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all min-h-[38px] ${
                activeTab === t.id
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
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
            <Compass className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
            <div className="space-y-1.5">
              <h3 className="text-lg md:text-xl font-black text-white">
                No active listings in {hub.name} yet
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 leading-relaxed">
                Connect the diaspora! Be the first to start a local Caribbean community guild or post an event in {hub.capital}.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link
                href="/communities"
                className="px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md"
              >
                Create a Community Guild
              </Link>
              <Link
                href="/events"
                className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md"
              >
                Host an Event
              </Link>
            </div>
          </div>
        )}

        {/* ── Communities ── */}
        {(activeTab === 'all' || activeTab === 'communities') && data.communities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Diaspora Community Guilds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.communities.map((comm) => (
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
                      className="w-full text-center bg-cyan-400 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all block"
                    >
                      Join Community Guild →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Events with RSVP ── */}
        {(activeTab === 'all' || activeTab === 'events') && data.events.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Caribbean Events &amp; Fetes in {hub.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.events.map((evt) => (
                <div
                  key={evt.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-lg border border-white/10"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                      {evt.event_kind}
                    </span>
                    <h4 className="font-black text-base text-white leading-snug">{evt.title}</h4>
                    {evt.description && (
                      <p className="text-xs text-brand-sandstone/85 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                    <div className="text-xs text-brand-sandstone/70 space-y-1 pt-1">
                      <p className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{new Date(evt.starts_at).toLocaleDateString()}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                        <span>{evt.venue || hub.capital}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRsvp(evt.id, 'going')}
                        disabled={rsvpPendingId === evt.id}
                        className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:brightness-110 transition-all text-center"
                      >
                        {rsvpSuccessId === evt.id ? '✓ RSVP\'d' : 'Going'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRsvp(evt.id, 'interested')}
                        disabled={rsvpPendingId === evt.id}
                        className="px-3 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-all"
                      >
                        Interested
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare(evt.title, typeof window !== 'undefined' ? window.location.href : '')}
                        className="p-2 rounded-xl bg-white/10 text-brand-sandstone/80 hover:text-white transition-all"
                        title="Share Event"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Sounds / Music ── */}
        {(activeTab === 'all' || activeTab === 'sounds') && sounds.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-pink-400 flex items-center gap-2">
              <Music2 className="w-4 h-4" /> Sounds of the Diaspora
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sounds.map((sound) => (
                <div
                  key={sound.id}
                  className="surface-card rounded-2xl p-4 flex items-center justify-between border border-white/10 hover:border-pink-500/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handlePlaySound(sound.id, sound.audioUrl)}
                      className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-slate-950 transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      {playingSoundId === sound.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <Link
                        href={`/sounds?id=${sound.id}`}
                        className="font-black text-sm text-white hover:text-pink-400 transition-colors truncate block"
                      >
                        {sound.title}
                      </Link>
                      <p className="text-xs text-brand-sandstone/70 truncate">{sound.artist}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-pink-300 flex-shrink-0">
                    {sound.genre}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Shop / Products ── */}
        {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Marketplace from {hub.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => (
                <div key={p.id} className="surface-card rounded-2xl p-5 space-y-3 border border-white/10">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 uppercase">
                    {p.product_kind}
                  </span>
                  <h4 className="font-black text-sm text-white truncate">{p.title}</h4>
                  <div className="pt-2 flex items-center justify-between text-xs font-bold">
                    <span>{p.currency} \$${(p.price_minor / 100).toFixed(2)}</span>
                    <Link href="/marketplace" className="text-emerald-400 hover:underline">
                      Buy Now →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Creators & Members ── */}
        {(activeTab === 'all' || activeTab === 'creators') && data.creators.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-2">
              <Users className="w-4 h-4" /> Creators &amp; Diaspora Leaders in {hub.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.creators.map((c) => (
                <div
                  key={c.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-sm shadow-md flex-shrink-0">
                      {(c.display_name || 'MB').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm text-white truncate flex items-center gap-1.5">
                        {c.display_name}
                        {c.is_verified && (
                          <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                        )}
                      </h4>
                      <p className="text-xs text-brand-sandstone/70 truncate">@{c.username}</p>
                      {c.city && (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-white/10 px-2 py-0.5 rounded mt-1 inline-block">
                          {c.city}
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

        {/* ── Posts / Discussions ── */}
        {(activeTab === 'all' || activeTab === 'posts') && data.posts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Flame className="w-4 h-4" /> Discussions in {hub.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.posts.map((post) => {
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
                          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                            {(author?.display_name || 'MB').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
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
                        <span className="text-xs text-brand-sandstone/50">
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
                        <MessageCircle className="w-4 h-4 text-amber-300" />{' '}
                        {post.comments_count ?? 0}
                      </span>
                      <Link
                        href="/"
                        className="text-amber-300 hover:underline text-xs font-black flex items-center"
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
      </section>
    </div>
  );
}
