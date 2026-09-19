'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Users,
  UserCheck,
  Star,
  Globe,
  Flame,
  Bookmark,
  Sparkles,
  TrendingUp,
  Settings,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { type FeedMode } from '@caribbean/social';
import UserAvatar from '../user-avatar';
import FollowButton from '../follow-button';

export interface FeedsRailProps {
  activeMode: FeedMode;
  friendsCount?: number;
  followingCount?: number;
  favoritesCount?: number;
  trendingTopics?: Array<{ tag: string; post_count?: number }>;
  suggestedCreators?: Array<{
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string | null;
    is_verified?: boolean;
    origin_country_iso?: string | null;
  }>;
}

const FEED_CHANNELS = [
  { id: 'for_you', label: 'For You', desc: 'Algorithmically ranked for you', icon: Sparkles, color: 'text-brand-caribbeanSea' },
  { id: 'following', label: 'Following', desc: 'People, pages & creators you follow', icon: Layers, color: 'text-sky-400' },
  { id: 'friends', label: 'Friends', desc: 'Mutual accepted friendships only', icon: Users, color: 'text-emerald-400' },
  { id: 'caribbean', label: 'Caribbean', desc: 'Islands, territories & culture', icon: Globe, color: 'text-amber-400' },
  { id: 'communities', label: 'Communities', desc: 'Diaspora hubs you joined', icon: Flame, color: 'text-rose-400' },
];

export default function FeedsRail({
  activeMode,
  friendsCount = 0,
  followingCount = 0,
  favoritesCount = 0,
  trendingTopics = [],
  suggestedCreators = [],
}: FeedsRailProps) {
  const displayTrends = trendingTopics;

  return (
    <div className="space-y-5">
      {/* 1. Feed Channels Quick Switcher */}
      <section aria-label="Feed Channels" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-caribbeanSea" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Feed Channels
            </h3>
          </div>
          <span className="text-[10px] font-bold text-brand-sandstone/60 uppercase">
            Active: {activeMode.replace('_', ' ')}
          </span>
        </div>

        <nav className="space-y-1 pt-1" aria-label="Feed channels list">
          {FEED_CHANNELS.map((ch) => {
            const isActive = activeMode === ch.id;
            const Icon = ch.icon;
            const targetUrl = ch.id === 'for_you' ? '/feeds/for-you' : `/feeds/${ch.id.replace('_', '-')}`;

            return (
              <Link
                key={ch.id}
                href={targetUrl}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/10 text-white border border-brand-caribbeanSea/40 shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${ch.color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{ch.label}</p>
                    <p className="text-[10px] text-brand-sandstone/60 truncate">{ch.desc}</p>
                  </div>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-brand-caribbeanSea shadow-[0_0_8px_rgba(0,168,150,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </section>

      {/* 2. Social Graph Metrics */}
      <section aria-label="Your Social Graph" className="glass rounded-3xl p-4 sm:p-5 space-y-3.5 border border-white/10">
        <div className="space-y-0.5">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Your Connections
          </h3>
          <p className="text-[11px] text-brand-sandstone/60">
            People &amp; entities powering your feed
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <Link
            href="/friends"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block"
          >
            <p className="text-base font-black text-white">{friendsCount}</p>
            <p className="text-[9px] text-brand-sandstone/60 uppercase font-black">Friends</p>
          </Link>
          <Link
            href="/people"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block"
          >
            <p className="text-base font-black text-white">{followingCount}</p>
            <p className="text-[9px] text-brand-sandstone/60 uppercase font-black">Following</p>
          </Link>
          <Link
            href="/saved"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block"
          >
            <p className="text-base font-black text-brand-goldenHour">{favoritesCount}</p>
            <p className="text-[9px] text-brand-goldenHour/70 uppercase font-black">Saved</p>
          </Link>
        </div>

        <div className="pt-1">
          <Link
            href="/saved"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-brand-goldenHour" />
              Saved Content &amp; Bookmarks
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-sandstone/60" />
          </Link>
        </div>
      </section>

      {/* 3. Suggested Creators */}
      {suggestedCreators.length > 0 && (
        <section aria-label="Suggested Creators" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-goldenHour" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Caribbean Creators
              </h3>
            </div>
            <Link
              href="/people"
              className="text-[11px] font-bold text-brand-goldenHour hover:underline"
            >
              Discover
            </Link>
          </div>

          <div className="space-y-3 pt-0.5">
            {suggestedCreators.slice(0, 3).map((creator) => (
              <div key={creator.id} className="flex items-center justify-between gap-3">
                <Link
                  href={`/profile/${creator.username}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  <UserAvatar
                    src={creator.avatar_url}
                    name={creator.display_name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-brand-caribbeanSea transition-colors">
                      {creator.display_name}
                    </p>
                    <p className="text-[10px] text-brand-sandstone/60 truncate">
                      @{creator.username}
                    </p>
                  </div>
                </Link>

                <div className="shrink-0">
                  <FollowButton targetUserId={creator.id} isFollowing={false} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Trending Signals in Feeds */}
      <section aria-label="Trending Hashtags" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-caribbeanSea" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Trending Hashtags
            </h3>
          </div>
        </div>

        {displayTrends.length === 0 ? (
          <p className="text-xs text-brand-sandstone/60 py-2">
            Trending topics will appear here as the TUKUBI community grows.
          </p>
        ) : (
          <div className="space-y-2 pt-0.5">
            {displayTrends.slice(0, 5).map((trend) => (
              <Link
                key={trend.tag}
                href={`/explore?q=${encodeURIComponent('#' + trend.tag)}`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <p className="text-xs font-black text-white group-hover:text-brand-caribbeanSea transition-colors truncate">
                  #{trend.tag}
                </p>
                {trend.post_count !== undefined && (
                  <span className="text-[10px] text-brand-sandstone/50 font-bold">
                    {trend.post_count} posts
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 5. Switch to Home Prompt */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
        <p className="text-xs font-black text-brand-goldenHour flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Looking for Discovery?
        </p>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          TUKUBI Home highlights reels, live broadcasts, events, and marketplace products.
        </p>
        <Link
          href="/"
          className="inline-block w-full text-center py-2 px-3 rounded-xl bg-brand-goldenHour hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-sm"
        >
          Go to Home Dashboard
        </Link>
      </div>
    </div>
  );
}
