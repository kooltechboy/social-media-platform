'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import GeographyFlag from '../geography-flag';
import type { CanonicalGeography } from '../../lib/explore/canonical-geography';
import { VIBE_CATEGORIES, type VibeCategory, type ExploreQueryResult } from '../../lib/explore/constants';

interface GeographyDiscoveryViewProps {
  geography: CanonicalGeography;
  data: ExploreQueryResult;
  activeVibe?: string | null;
}

export default function GeographyDiscoveryView({
  geography,
  data,
  activeVibe,
}: GeographyDiscoveryViewProps) {
  const router = useRouter();
  const [selectedVibe, setSelectedVibe] = useState<string | null>(activeVibe || null);
  const [activeTab, setActiveTab] = useState<
    'all' | 'posts' | 'creators' | 'events' | 'communities' | 'businesses' | 'products' | 'reels' | 'podcasts'
  >('all');

  function handleVibeFilter(vibeId: string) {
    if (selectedVibe === vibeId) {
      setSelectedVibe(null);
      router.push(`/explore/${geography.slug}`);
    } else {
      setSelectedVibe(vibeId);
      router.push(`/explore/${geography.slug}?vibe=${vibeId}`);
    }
  }

  const { counts } = data;

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-16">
      {/* ────────────────────────────────────────────────────────── */}
      {/* NAVIGATION BREADCRUMB & BACK LINK                          */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-sandstone/80 hover:text-brand-caribbeanSea transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Caribbean Discovery
        </Link>
        <span className="text-[11px] md:text-xs font-mono font-bold text-brand-caribbeanSea bg-brand-caribbeanSea/10 px-3 py-1 rounded-full border border-brand-caribbeanSea/30">
          ISO: {geography.iso}
        </span>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* GEOGRAPHY HERO BANNER                                      */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="surface-header rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden border border-brand-caribbeanSea/30">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-caribbeanSea/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <GeographyFlag geo={geography} size="hero" className="shadow-lg" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-brand-goldenHour">
                    {geography.region}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea">
                    {geography.sovereign ? 'Sovereign Nation' : 'Territory / Island'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  {geography.name}
                </h1>
              </div>
            </div>

            <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/90 leading-relaxed md:leading-[1.6]">
              {geography.summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-brand-sandstone/70 pt-2 border-t border-white/10">
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
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* VIBE CROSS-FILTERING BAR                                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs md:text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-goldenHour" /> Filter by Cultural Vibe in {geography.name}
          </h2>
          {selectedVibe && (
            <button
              type="button"
              onClick={() => handleVibeFilter(selectedVibe)}
              className="text-xs text-rose-400 hover:underline font-bold"
            >
              Reset Vibe
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {VIBE_CATEGORIES.map((v) => {
            const isSelected = selectedVibe === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVibeFilter(v.id)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border min-h-[38px] ${
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
      {/* CATEGORY DISCOVERY TABS                                    */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
          {[
            { id: 'all', label: `All Discovery (${data.totalMatches})` },
            { id: 'posts', label: `Posts (${counts.posts})` },
            { id: 'creators', label: `People & Creators (${counts.creators})` },
            { id: 'events', label: `Events (${counts.events})` },
            { id: 'communities', label: `Communities (${counts.communities})` },
            { id: 'businesses', label: `Businesses (${counts.businesses})` },
            { id: 'products', label: `Marketplace (${counts.products})` },
            { id: 'reels', label: `Reels (${counts.reels})` },
            { id: 'podcasts', label: `Podcasts (${counts.podcasts})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all min-h-[38px] ${
                activeTab === t.id
                  ? 'bg-brand-caribbeanSea text-slate-950 font-black shadow-md shadow-brand-caribbeanSea/20'
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
            <Compass className="w-12 h-12 text-brand-caribbeanSea/80 mx-auto animate-pulse" />
            <div className="space-y-1.5">
              <h3 className="text-lg md:text-xl font-black text-white">
                No content found in {geography.name} {selectedVibe ? `for ${selectedVibe}` : 'yet'}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-brand-sandstone/80 leading-relaxed">
                Be among the pioneers to represent {geography.name}. Create a post, list an event, or launch a community guild!
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link
                href="/create"
                className="px-4 py-2.5 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md"
              >
                Create a Post
              </Link>
              <Link
                href="/events"
                className="px-4 py-2.5 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md"
              >
                Host an Event
              </Link>
              <Link
                href="/communities"
                className="px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md"
              >
                Start a Community
              </Link>
            </div>
          </div>
        )}

        {/* ── 1. Posts Feed ── */}
        {(activeTab === 'all' || activeTab === 'posts') && data.posts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-2">
              <Flame className="w-4 h-4" /> Trending Discussions &amp; Posts in {geography.name}
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
                        <MessageCircle className="w-4 h-4 text-brand-caribbeanSea" />{' '}
                        {post.comments_count ?? 0}
                      </span>
                      <Link
                        href="/"
                        className="text-brand-caribbeanSea hover:underline text-xs font-black flex items-center"
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

        {/* ── 2. People & Creators ── */}
        {(activeTab === 'all' || activeTab === 'creators') && data.creators.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-2">
              <Users className="w-4 h-4" /> People &amp; Creators Connected to {geography.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.creators.map((c) => (
                <div
                  key={c.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-sm shadow-md flex-shrink-0">
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

        {/* ── 3. Events ── */}
        {(activeTab === 'all' || activeTab === 'events') && data.events.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-yellow-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Events &amp; Gatherings in {geography.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.events.map((evt) => (
                <div
                  key={evt.id}
                  className="surface-card surface-card-interactive rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-lg border border-white/10"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 uppercase tracking-wider">
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
                        <Clock className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{new Date(evt.starts_at).toLocaleDateString()}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                        <span>{evt.venue || evt.cities?.name || geography.name}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <Link
                      href="/events"
                      className="w-full text-center bg-yellow-400 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all block"
                    >
                      Get Tickets / RSVP →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Communities ── */}
        {(activeTab === 'all' || activeTab === 'communities') && data.communities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Community Guilds in {geography.name}
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

        {/* ── 5. Businesses ── */}
        {(activeTab === 'all' || activeTab === 'businesses') && data.businesses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Verified Businesses &amp; Brands in {geography.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.businesses.map((b) => (
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

        {/* ── 6. Reels & Video Media ── */}
        {(activeTab === 'all' || activeTab === 'reels') && data.reels.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <Tv className="w-4 h-4" /> Reels &amp; Video Highlights
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.reels.map((reel) => (
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
