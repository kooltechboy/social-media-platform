'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  Users,
  Globe,
  Flame,
  Filter,
  UserPlus,
  Compass,
  ArrowRight,
  Building2,
  ShieldCheck,
  Palette,
} from 'lucide-react';
import { type FeedMode } from '@caribbean/social';
import FeedStream, { type FeedPostData } from '../feed-stream';
import RightRail from '../right-rail';
import FeedsRail from '../rails/feeds-rail';
import IdentitySwitcher from '../identity-switcher';

export interface FeedsViewProps {
  mode: FeedMode;
  initialPosts: FeedPostData[];
  currentUserId: string;
  nextCursor?: string;
  friendsCount?: number;
  followingCount?: number;
  favoritesCount?: number;
  suggestedCreators?: any[];
  trendingTopics?: any[];
}

const TABS: Array<{
  id: FeedMode;
  slug: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    id: 'for_you',
    slug: 'for-you',
    label: 'For You',
    description: 'Personalized Caribbean recommendations & trending culture',
    icon: Sparkles,
    color: 'text-brand-caribbeanSea',
  },
  {
    id: 'following',
    slug: 'following',
    label: 'Following',
    description: 'People, creators & verified pages you follow',
    icon: Layers,
    color: 'text-sky-400',
  },
  {
    id: 'friends',
    slug: 'friends',
    label: 'Friends',
    description: 'Mutual accepted friends only — 0% algorithmic injection',
    icon: Users,
    color: 'text-emerald-400',
  },
  {
    id: 'pages',
    slug: 'pages',
    label: 'Pages',
    description: 'Updates and content from verified Caribbean pages & businesses',
    icon: Building2,
    color: 'text-sky-400',
  },
  {
    id: 'creators',
    slug: 'creators',
    label: 'Creators',
    description: 'Original music, art, culture, and storytelling creators',
    icon: Palette,
    color: 'text-brand-sunriseCoral',
  },
  {
    id: 'official',
    slug: 'official',
    label: 'Official',
    description: 'Verified platform announcements and safety alerts from @tukubi',
    icon: ShieldCheck,
    color: 'text-brand-goldenHour',
  },
  {
    id: 'caribbean',
    slug: 'caribbean',
    label: 'Caribbean',
    description: 'Updates from island territories and regional cultural tags',
    icon: Globe,
    color: 'text-amber-400',
  },
  {
    id: 'communities',
    slug: 'communities',
    label: 'Communities',
    description: 'Discussions from your joined diaspora hubs',
    icon: Flame,
    color: 'text-rose-400',
  },
];

export default function FeedsView({
  mode,
  initialPosts,
  currentUserId,
  nextCursor,
  friendsCount = 0,
  followingCount = 0,
  favoritesCount = 0,
  suggestedCreators = [],
  trendingTopics = [],
}: FeedsViewProps) {
  const activeTabMeta = TABS.find((t) => t.id === mode) || TABS[0];

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      {/* ── Main Feeds Column ── */}
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[740px] xl:max-w-[760px] mx-auto lg:mx-0">
        {/* Feeds Surface Header */}
        <header className="glass-aerospace rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl border border-white/12">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-black uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" /> Social Streams
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Your TUKUBI Feeds
              </h1>
              <p className="text-xs sm:text-sm text-brand-sandstone/70">
                Focus on the social content that matters to you with clean, transparent filtering.
              </p>
            </div>

            <div className="hidden sm:block shrink-0">
              <IdentitySwitcher variant="compact" />
            </div>
          </div>

          {/* 5 Real Tabs */}
          <nav aria-label="Feeds Tabs" className="pt-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1" role="tablist">
              {TABS.map((tab) => {
                const isActive = mode === tab.id;
                const Icon = tab.icon;

                return (
                  <Link
                    key={tab.id}
                    href={tab.id === 'for_you' ? '/?tab=for_you' : `/?tab=${tab.slug}`}
                    role="tab"
                    aria-selected={isActive}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap min-h-[42px] transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
                        : 'bg-white/5 hover:bg-white/10 text-brand-sandstone/80 hover:text-white border border-white/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : tab.color}`} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </header>

        {/* Active Stream Indicator Banner */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-brand-sandstone/80">
          <div className="flex items-center gap-2 min-w-0">
            <Filter className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
            <span className="truncate">
              Showing: <strong className="text-white font-black">{activeTabMeta.label}</strong> — {activeTabMeta.description}
            </span>
          </div>
          <Link href="/" className="text-brand-goldenHour hover:underline font-bold text-[11px] shrink-0 ml-2">
            Switch to Home →
          </Link>
        </div>

        {/* Post Stream or Empty State */}
        {initialPosts && initialPosts.length > 0 ? (
          <section aria-label={`${activeTabMeta.label} Post Stream`}>
            <FeedStream
              initialPosts={initialPosts}
              currentUserId={currentUserId}
              mode={mode}
              nextCursor={nextCursor}
            />
          </section>
        ) : (
          /* Intelligent Empty State */
          <div className="glass rounded-3xl p-8 sm:p-12 text-center space-y-4 border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-brand-caribbeanSea/20 flex items-center justify-center mx-auto text-brand-caribbeanSea">
              {mode === 'friends' ? (
                <Users className="w-7 h-7" />
              ) : mode === 'communities' ? (
                <Flame className="w-7 h-7" />
              ) : (
                <Globe className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-black text-white">
                {mode === 'friends'
                  ? 'No Friends Posts Yet'
                  : mode === 'following'
                  ? 'Your Following Feed is Quiet'
                  : mode === 'communities'
                  ? 'No Community Posts Yet'
                  : 'No Content Found in This Feed'}
              </h3>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed">
                {mode === 'friends'
                  ? 'Friends are mutual accepted relationships. Connect with people you know from your island or diaspora community to see their personal updates here.'
                  : mode === 'following'
                  ? 'Follow Caribbean creators, verified businesses, cultural leaders, and friends to build your personalized stream.'
                  : mode === 'communities'
                  ? 'Join diaspora hubs and interest groups to see discussions from your communities.'
                  : 'Be the first to share a post in this channel, or explore other Caribbean horizons.'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {mode === 'friends' && (
                <Link
                  href="/people"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-caribbeanSea hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Find Caribbean Friends</span>
                </Link>
              )}

              {mode === 'following' && (
                <Link
                  href="/explore"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-goldenHour hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md"
                >
                  <Compass className="w-4 h-4" />
                  <span>Discover Creators &amp; Pages</span>
                </Link>
              )}

              {mode === 'communities' && (
                <Link
                  href="/communities"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 hover:brightness-110 text-white font-black text-xs transition-all shadow-md"
                >
                  <Flame className="w-4 h-4" />
                  <span>Explore Diaspora Hubs</span>
                </Link>
              )}

              <Link
                href="/create"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
              >
                <span>Create a Post</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Rail: Contextual Feeds Controls & Social Graph ── */}
      <RightRail ariaLabel="Feeds Contextual Controls">
        <FeedsRail
          activeMode={mode}
          friendsCount={friendsCount}
          followingCount={followingCount}
          favoritesCount={favoritesCount}
          suggestedCreators={suggestedCreators}
          trendingTopics={trendingTopics}
        />
      </RightRail>
    </div>
  );
}
