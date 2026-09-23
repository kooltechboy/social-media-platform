'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Users,
  Building2,
  Globe,
  Flame,
  ShieldCheck,
  Sparkles,
  PlusCircle,
  Filter,
  UserPlus,
  RefreshCw,
  Columns2,
  LayoutGrid,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { type FeedMode } from '@caribbean/social';
import FeedStream, { type FeedPostData } from '../feed-stream';
import UniversalComposer from '../universal-composer';
import RightRail from '../right-rail';
import FeedsRail from '../rails/feeds-rail';
import { fetchFeedPostsAction } from '../../lib/social/actions';

export interface FeedsTimelineClientProps {
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  } | null;
  activeMode: FeedMode;
  initialPosts: FeedPostData[];
  nextCursor?: string;
  friendsCount?: number;
  followingCount?: number;
  trendingTopics?: Array<{ tag: string; post_count?: number }>;
  suggestedCreators?: any[];
}

export const FEED_CHANNELS_LIST: Array<{
  id: FeedMode;
  slug: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
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
    id: 'caribbean',
    slug: 'caribbean',
    label: 'Caribbean',
    description: 'Updates from island territories and regional cultural tags',
    icon: Globe,
    color: 'text-amber-400',
  },
  {
    id: 'pages',
    slug: 'pages',
    label: 'Pages',
    description: 'Updates and content from verified Caribbean pages & businesses',
    icon: Building2,
    color: 'text-cyan-400',
  },
  {
    id: 'communities',
    slug: 'communities',
    label: 'Communities',
    description: 'Discussions from your joined diaspora hubs',
    icon: Flame,
    color: 'text-rose-400',
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
    id: 'for_you',
    slug: 'for-you',
    label: 'For You',
    description: 'Personalized Caribbean recommendations & trending culture',
    icon: Sparkles,
    color: 'text-brand-caribbeanSea',
  },
];

export default function FeedsTimelineClient({
  user,
  activeMode,
  initialPosts,
  nextCursor,
  friendsCount = 0,
  followingCount = 0,
  trendingTopics = [],
  suggestedCreators = [],
}: FeedsTimelineClientProps) {
  const router = useRouter();
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState<FeedPostData[]>(initialPosts);

  // Desktop Power-User Deck View State
  const [isDeckMode, setIsDeckMode] = useState<boolean>(false);
  const [secondaryMode, setSecondaryMode] = useState<FeedMode>(
    activeMode === 'caribbean' ? 'following' : 'caribbean'
  );
  const [secondaryPosts, setSecondaryPosts] = useState<FeedPostData[]>([]);
  const [secondaryCursor, setSecondaryCursor] = useState<string | undefined>(undefined);
  const [isSecondaryLoading, setIsSecondaryLoading] = useState<boolean>(false);

  const activeChannelMeta =
    FEED_CHANNELS_LIST.find((c) => c.id === activeMode) || FEED_CHANNELS_LIST[0];
  const ChannelIcon = activeChannelMeta.icon;

  const secondaryChannelMeta =
    FEED_CHANNELS_LIST.find((c) => c.id === secondaryMode) || FEED_CHANNELS_LIST[2];
  const SecondaryIcon = secondaryChannelMeta.icon;

  useEffect(() => {
    try {
      const savedDeck = localStorage.getItem('tukubi_feeds_deck_mode');
      if (savedDeck === 'true') setIsDeckMode(true);
      const savedSec = localStorage.getItem('tukubi_feeds_secondary_mode') as FeedMode | null;
      if (savedSec && FEED_CHANNELS_LIST.some((c) => c.id === savedSec)) {
        setSecondaryMode(savedSec);
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleDeckMode = (enabled: boolean) => {
    setIsDeckMode(enabled);
    try {
      localStorage.setItem('tukubi_feeds_deck_mode', enabled ? 'true' : 'false');
    } catch {
      // Ignore
    }
  };

  const changeSecondaryMode = (newMode: FeedMode) => {
    setSecondaryMode(newMode);
    try {
      localStorage.setItem('tukubi_feeds_secondary_mode', newMode);
    } catch {
      // Ignore
    }
  };

  const fetchSecondary = React.useCallback(async (modeToFetch: FeedMode) => {
    setIsSecondaryLoading(true);
    try {
      const res = await fetchFeedPostsAction({
        mode: modeToFetch as any,
      });
      if (res.posts) {
        setSecondaryPosts(res.posts);
        setSecondaryCursor(res.nextCursor);
      }
    } catch (err) {
      console.warn('[FeedsDeck] Error loading secondary channel:', err);
    } finally {
      setIsSecondaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDeckMode) {
      void fetchSecondary(secondaryMode);
    }
  }, [isDeckMode, secondaryMode, fetchSecondary]);

  const handlePostCreated = (newPost?: any) => {
    if (newPost) {
      setPosts((prev) => [newPost, ...prev]);
    }
    setShowComposer(false);
  };

  return (
    <div
      className={`flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full ${
        isDeckMode ? 'max-w-[1780px]' : ''
      }`}
    >
      {/* ── CENTER WORKSPACE: DEDICATED FEEDS TIMELINE (OR DUAL DECK) ── */}
      <div
        className={`flex-1 min-w-0 space-y-6 w-full ${
          isDeckMode ? 'max-w-none' : 'max-w-[840px] xl:max-w-[880px]'
        } mx-auto lg:mx-0 animate-fadeIn`}
      >
        {/* Top Channel Header */}
        <header className="surface-header rounded-3xl p-5 sm:p-7 border border-white/12 shadow-xl bg-gradient-to-br from-[#150F24]/90 via-[#100B1A]/95 to-[#0B0713] backdrop-blur-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
                  <ChannelIcon className={`w-5 h-5 ${activeChannelMeta.color}`} />
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeChannelMeta.label} Feed
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 pl-0.5">
                {activeChannelMeta.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Desktop Layout Switcher: Single vs Dual Deck */}
              <div className="hidden xl:flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => toggleDeckMode(false)}
                  title="Single Column View"
                  aria-label="Single column view"
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    !isDeckMode
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-brand-sandstone/60 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleDeckMode(true)}
                  title="Deck View (Dual Channel Split Screen)"
                  aria-label="Deck view dual channel"
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isDeckMode
                      ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30 shadow-sm'
                      : 'text-brand-sandstone/60 hover:text-white'
                  }`}
                >
                  <Columns2 className="w-4 h-4" />
                </button>
              </div>

              {user && (
                <button
                  type="button"
                  onClick={() => setShowComposer((prev) => !prev)}
                  className="bg-gradient-to-r from-brand-caribbeanSea via-teal-400 to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-brand-caribbeanSea/20 self-start sm:self-auto min-h-[42px] cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{showComposer ? 'Close Composer' : 'Create Post'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Channel Filter Bar */}
          <nav
            aria-label="Feed Channels Bar"
            className="flex items-center gap-2 overflow-x-auto pt-5 mt-4 border-t border-white/10 scrollbar-none"
          >
            {FEED_CHANNELS_LIST.map((channel) => {
              const isActive = channel.id === activeMode;
              const Icon = channel.icon;
              const href = channel.id === 'for_you' ? '/?tab=for_you' : `/?tab=${channel.slug}`;

              return (
                <Link
                  key={channel.id}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[38px] ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-caribbeanSea/30 to-brand-sunriseCoral/20 text-white border border-brand-caribbeanSea/50 shadow-md shadow-brand-caribbeanSea/10'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${channel.color}`} />
                  <span>{channel.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Collapsible Universal Composer */}
        {showComposer && user && (
          <div className="animate-fadeIn">
            <UniversalComposer
              displayName={user.displayName}
              avatarInitials={user.displayName.slice(0, 2).toUpperCase()}
              userId={user.id}
              defaultExpanded={true}
              onPostCreated={handlePostCreated}
            />
          </div>
        )}

        {/* Feeds Rendering: Single Column vs Dual Deck */}
        {!isDeckMode ? (
          /* Single Column Stream */
          posts.length === 0 ? (
            <div className="surface-card rounded-3xl p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto border border-white/10">
              <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-brand-caribbeanSea">
                <ChannelIcon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">
                  No posts in {activeChannelMeta.label}
                </h3>
                <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed">
                  {activeMode === 'friends'
                    ? 'None of your mutual friends have published a post yet. Connect with Caribbean members to populate your private friend timeline.'
                    : activeMode === 'following'
                    ? 'You are not following anyone with recent posts yet. Explore Caribbean creators, businesses, and friends.'
                    : activeMode === 'pages'
                    ? 'No posts from verified Caribbean pages yet. Follow official business, institution, and cultural pages.'
                    : activeMode === 'communities'
                    ? 'No community discussions posted yet. Join diaspora hubs to share conversations.'
                    : activeMode === 'caribbean'
                    ? 'No regional Caribbean updates posted yet. Share a story from your island territory.'
                    : 'There are no posts matching this channel right now.'}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {user ? (
                  <button
                    type="button"
                    onClick={() => setShowComposer(true)}
                    className="bg-brand-caribbeanSea hover:brightness-110 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
                  >
                    Publish First Post
                  </button>
                ) : (
                  <Link
                    href="/login?next=/"
                    className="bg-brand-caribbeanSea hover:brightness-110 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
                  >
                    Sign In to Connect
                  </Link>
                )}

                {activeMode === 'friends' && (
                  <Link
                    href="/friends?tab=discover"
                    className="bg-white/5 hover:bg-white/10 text-brand-sandstone font-bold px-4 py-2.5 rounded-xl text-xs border border-white/10 transition-colors"
                  >
                    Find Friends
                  </Link>
                )}
                {activeMode === 'pages' && (
                  <Link
                    href="/pages"
                    className="bg-white/5 hover:bg-white/10 text-brand-sandstone font-bold px-4 py-2.5 rounded-xl text-xs border border-white/10 transition-colors"
                  >
                    Explore Pages
                  </Link>
                )}
                {activeMode === 'communities' && (
                  <Link
                    href="/communities"
                    className="bg-white/5 hover:bg-white/10 text-brand-sandstone font-bold px-4 py-2.5 rounded-xl text-xs border border-white/10 transition-colors"
                  >
                    Browse Communities
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <FeedStream
              initialPosts={posts}
              currentUserId={user?.id}
              mode={activeMode}
              nextCursor={nextCursor}
            />
          )
        ) : (
          /* Dual Channel Deck View */
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start w-full">
            {/* Column 1: Primary Active Channel */}
            <div className="space-y-4 min-w-0">
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-2">
                  <ChannelIcon className="w-4 h-4" /> Column 1: {activeChannelMeta.label}
                </span>
                <span className="text-[10px] text-brand-sandstone/60">Primary Channel</span>
              </div>

              {posts.length === 0 ? (
                <div className="surface-card rounded-2xl p-8 text-center space-y-2 border border-white/10">
                  <p className="text-xs text-brand-sandstone/70">No posts in this channel yet.</p>
                </div>
              ) : (
                <FeedStream
                  initialPosts={posts}
                  currentUserId={user?.id}
                  mode={activeMode}
                  nextCursor={nextCursor}
                />
              )}
            </div>

            {/* Column 2: Secondary Monitored Channel */}
            <div className="space-y-4 min-w-0">
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-2">
                    <SecondaryIcon className="w-4 h-4" /> Column 2:
                  </span>
                  <select
                    value={secondaryMode}
                    onChange={(e) => changeSecondaryMode(e.target.value as FeedMode)}
                    className="bg-[#181126] text-white text-xs font-bold rounded-lg px-2 py-1 border border-white/15 focus:outline-none focus:border-brand-caribbeanSea"
                    aria-label="Select secondary feed channel"
                  >
                    {FEED_CHANNELS_LIST.map((channel) => (
                      <option key={channel.id} value={channel.id} className="bg-[#181126]">
                        {channel.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => fetchSecondary(secondaryMode)}
                  disabled={isSecondaryLoading}
                  title="Refresh secondary stream"
                  className="p-1.5 rounded-lg text-brand-sandstone/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSecondaryLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isSecondaryLoading ? (
                <div className="surface-card rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-white/10">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-caribbeanSea" />
                  <p className="text-xs text-brand-sandstone/70">
                    Loading {secondaryChannelMeta.label} stream…
                  </p>
                </div>
              ) : secondaryPosts.length === 0 ? (
                <div className="surface-card rounded-2xl p-8 text-center space-y-2 border border-white/10">
                  <p className="text-xs text-brand-sandstone/70">
                    No posts currently available in {secondaryChannelMeta.label}.
                  </p>
                </div>
              ) : (
                <FeedStream
                  key={secondaryMode}
                  initialPosts={secondaryPosts}
                  currentUserId={user?.id}
                  mode={secondaryMode}
                  nextCursor={secondaryCursor}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT COLUMN: CONTEXTUAL FEEDS RAIL ── */}
      <RightRail ariaLabel="Feeds Channels and Trending Context">
        <FeedsRail
          activeMode={activeMode}
          friendsCount={friendsCount}
          followingCount={followingCount}
          trendingTopics={trendingTopics}
          suggestedCreators={suggestedCreators}
        />
      </RightRail>
    </div>
  );
}
