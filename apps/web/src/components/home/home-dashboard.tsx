'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Film,
  ShoppingBag,
  Calendar,
  Mic,
  Tv,
  Users,
  Play,
  FileText,
  PlusCircle,
  TrendingUp,
  Flame,
  CheckCircle,
  Globe,
  Filter,
  UserPlus,
  Compass,
  Loader2,
  Building2,
  ShieldCheck,
  Palette,
  Image as ImageIcon,
  Video,
  BarChart3,
  Smile,
  Clapperboard,
  Radio,
  CalendarPlus,
  Store,
} from 'lucide-react';
import { type FeedMode } from '@caribbean/social';
import UserAvatar from '../user-avatar';
import UniversalComposer, { type ComposerMode } from '../universal-composer';
import MomentsCinemaRail from '../moments/moments-cinema-rail';
import LiveBroadcastDiscovery from '../feed/live-broadcast-discovery';
import FeedStream, { type FeedPostData } from '../feed-stream';
import RightRail from '../right-rail';
import HomeRail from '../rails/home-rail';
import IdentitySwitcher from '../identity-switcher';
import { fetchFeedPostsAction } from '../../lib/social/actions';

export interface HomeDashboardProps {
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
  initialMode?: FeedMode;
  initialPosts?: FeedPostData[];
  nextCursor?: string;
  friendsCount?: number;
  followingCount?: number;
  liveStories?: any[];
  activeLiveStream?: any;
  topReels?: any[];
  marketProducts?: any[];
  culturalEvents?: any[];
  suggestedPeople?: any[];
  trendingTopics?: any[];
  managedPages?: Array<{
    id: string;
    name: string;
    slug: string;
    category?: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
    userRole?: string | null;
    followerCount?: number;
  }>;
  followedPages?: Array<{
    id: string;
    name: string;
    slug: string;
    category?: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
    followerCount?: number;
  }>;
}

const FEED_TABS: Array<{
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
    id: 'friends',
    slug: 'friends',
    label: 'Friends',
    description: 'Mutual accepted friends only — 0% algorithmic injection',
    icon: Users,
    color: 'text-emerald-400',
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

export default function HomeDashboard({
  user,
  initialMode = 'for_you',
  initialPosts = [],
  nextCursor,
  friendsCount = 0,
  followingCount = 0,
  liveStories = [],
  activeLiveStream = null,
  topReels = [],
  marketProducts = [],
  culturalEvents = [],
  suggestedPeople = [],
  trendingTopics = [],
  managedPages = [],
  followedPages = [],
}: HomeDashboardProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>('text');
  const [activeTab, setActiveTab] = useState<FeedMode>(initialMode);
  const [feedPosts, setFeedPosts] = useState<FeedPostData[]>(initialPosts);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(nextCursor);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  // ── Per-tab feed cache: preserves posts when switching between tabs ──
  // Keyed by FeedMode, stores the fetched posts + cursor so returning to a
  // previously-visited tab restores content instantly without a network call.
  const [tabCache, setTabCache] = useState<
    Record<string, { posts: FeedPostData[]; cursor?: string }>
  >(() => ({
    // Seed the cache with server-rendered initial posts for the landing tab
    [initialMode]: { posts: initialPosts, cursor: nextCursor },
  }));

  const activeTabMeta = FEED_TABS.find((t) => t.id === activeTab) || FEED_TABS[0];

  // Secondary creation shortcuts (icon buttons in the composer footer)
  const QUICK_ACTIONS = [
    { label: 'Create a reel', icon: Clapperboard, href: '/reels' },
    { label: 'Go live', icon: Radio, href: '/live' },
    { label: 'Create an event', icon: CalendarPlus, href: '/events' },
    { label: 'Sell an item', icon: Store, href: '/marketplace/seller-center/create' },
  ];

  const handleTabChange = async (tab: typeof FEED_TABS[number]) => {
    if (tab.id === activeTab || isLoadingTab) return;

    // Before switching away, snapshot the current tab's posts into the cache
    setTabCache((prev) => ({
      ...prev,
      [activeTab]: { posts: feedPosts, cursor: currentCursor },
    }));

    setActiveTab(tab.id);

    const targetUrl = tab.id === 'for_you' ? '/' : `/?tab=${tab.slug}`;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', targetUrl);
    }

    // If we have cached posts for this tab, restore them instantly (no loading spinner)
    const cached = tabCache[tab.id];
    if (cached && cached.posts.length > 0) {
      setFeedPosts(cached.posts);
      setCurrentCursor(cached.cursor);
      // Still re-fetch in the background to pick up new posts, but don't blank the UI
      fetchFeedPostsAction({ mode: tab.id })
        .then((res) => {
          if (res.posts && res.posts.length > 0) {
            setFeedPosts(res.posts);
            setCurrentCursor(res.nextCursor);
            setTabCache((prev) => ({
              ...prev,
              [tab.id]: { posts: res.posts, cursor: res.nextCursor },
            }));
          }
        })
        .catch(() => {
          // Keep cached data on background refresh failure — don't blank the feed
        });
      return;
    }

    // No cache — show loading state and fetch
    setIsLoadingTab(true);
    try {
      const res = await fetchFeedPostsAction({ mode: tab.id });
      const posts = res.posts || [];
      setFeedPosts(posts);
      setCurrentCursor(res.nextCursor);
      // Store in cache for future tab switches
      setTabCache((prev) => ({
        ...prev,
        [tab.id]: { posts, cursor: res.nextCursor },
      }));
    } catch (err) {
      console.error('[HomeDashboard] Failed to fetch feed for tab:', tab.id, err);
      setFeedPosts([]);
      setCurrentCursor(undefined);
    } finally {
      setIsLoadingTab(false);
    }
  };

  const handlePostCreated = (newPost?: any) => {
    if (newPost && newPost.id) {
      setFeedPosts((prev) => [newPost, ...prev]);
    }
    setShowComposer(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      {/* ── Main Center Column: Personalized TUKUBI Home & Feed ── */}
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[740px] xl:max-w-[760px] mx-auto lg:mx-0">
        {/* 1. Moments Cinema Rail (Ephemeral 24h Stories) */}
        {liveStories && liveStories.length > 0 && (
          <section aria-label="Caribbean Moments">
            <MomentsCinemaRail
              initialStories={liveStories}
              currentUserId={user.id}
              currentUserAvatar={user.avatarUrl || undefined}
              currentUserName={user.displayName}
            />
          </section>
        )}

        {/* ── 2A. Mobile Creation Card (Concept Image 1 & 2 Aligned 1-Tap Composer) ── */}
        <div className="md:hidden glass-aerospace rounded-2xl p-3.5 border border-white/12 shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar src={user.avatarUrl} name={user.displayName} size="sm" />
            <button
              type="button"
              onClick={() => {
                setComposerMode('text');
                setShowComposer((prev) => !prev);
              }}
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs text-brand-mist transition-colors flex items-center justify-between"
            >
              <span className="truncate">What&apos;s on your mind?</span>
              <span className="text-[10px] font-black text-brand-caribbeanSea bg-brand-caribbeanSea/10 px-2 py-0.5 rounded-full shrink-0 ml-1">
                {showComposer ? 'Close' : 'Post'}
              </span>
            </button>
          </div>

          {/* Mobile fast action chips: Photo, Video, Poll, Feeling */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-bold text-slate-300">
            <button
              type="button"
              onClick={() => {
                setComposerMode('photo');
                setShowComposer(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 text-emerald-400"
            >
              <span>📷</span> Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setComposerMode('video');
                setShowComposer(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 text-sky-400"
            >
              <span>🎬</span> Video
            </button>
            <button
              type="button"
              onClick={() => {
                setComposerMode('poll');
                setShowComposer(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 text-amber-400"
            >
              <span>📊</span> Poll
            </button>
            <button
              type="button"
              onClick={() => {
                setComposerMode('text');
                setShowComposer(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 text-brand-sunriseCoral"
            >
              <span>😊</span> Feeling
            </button>
          </div>

          {showComposer && (
            <div className="pt-1 animate-fadeIn border-t border-white/10">
              <UniversalComposer
                key={composerMode}
                displayName={user.displayName}
                avatarInitials={user.username.slice(0, 2).toUpperCase()}
                userId={user.id}
                defaultExpanded={true}
                initialMode={composerMode}
                onPostCreated={handlePostCreated}
              />
            </div>
          )}
        </div>

        {/* ── 2B. Desktop Workspace Header & Rich Horizon Discovery (Hidden on mobile) ── */}
        <div className="hidden md:block space-y-6">
        {/* Desktop composer — calm, editorial (ADR-UI-002) */}
        <div className="tk-panel p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={user.avatarUrl}
              name={user.displayName}
              size="md"
            />
            <button
              type="button"
              onClick={() => {
                setComposerMode('text');
                setShowComposer((prev) => !prev);
              }}
              aria-expanded={showComposer}
              className="flex-1 h-11 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.07] text-left text-[14px] text-[#8C99AD] hover:text-[#C3CCDA] transition-colors"
            >
              What&apos;s on your mind, {user.displayName.split(' ')[0]}?
            </button>
            <div className="hidden xl:flex items-center shrink-0">
              <IdentitySwitcher variant="compact" />
            </div>
          </div>

          {/* Composer shortcuts */}
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/[0.06]">
            {([
              { mode: 'photo', label: 'Photo', Icon: ImageIcon, tint: 'text-emerald-400' },
              { mode: 'video', label: 'Video', Icon: Video, tint: 'text-sky-400' },
              { mode: 'poll', label: 'Poll', Icon: BarChart3, tint: 'text-brand-goldenHour' },
              { mode: 'text', label: 'Feeling', Icon: Smile, tint: 'text-brand-sunriseCoral' },
            ] as const).map(({ mode, label, Icon, tint }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setComposerMode(mode as ComposerMode);
                  setShowComposer(true);
                }}
                className="flex items-center gap-2 px-3 h-9 rounded-lg text-[13px] font-medium text-[#C3CCDA] hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <Icon className={`w-[18px] h-[18px] ${tint}`} aria-hidden="true" />
                {label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  title={action.label}
                  aria-label={action.label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-brand-mist hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <action.icon className="w-[18px] h-[18px]" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>

          {/* Inline Composer (Expandable) */}
          {showComposer && (
            <div className="pt-3 mt-3 animate-fadeIn border-t border-white/[0.06]">
              <div className="flex justify-end pb-1">
                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="text-xs font-medium text-brand-mist hover:text-white px-2 py-1 rounded-md hover:bg-white/[0.06] transition-colors"
                >
                  Close composer
                </button>
              </div>
              <UniversalComposer
                key={composerMode}
                displayName={user.displayName}
                avatarInitials={user.username.slice(0, 2).toUpperCase()}
                userId={user.id}
                defaultExpanded={true}
                initialMode={composerMode}
                onPostCreated={handlePostCreated}
              />
            </div>
          )}
        </div>

        {/* 3. Live Broadcast Discovery Spotlight (if active) */}
        {activeLiveStream && (
          <section aria-label="Live Broadcasts">
            <LiveBroadcastDiscovery activeStream={activeLiveStream} />
          </section>
        )}

        {/* 4. Trending Caribbean Reels Preview */}
        {topReels && topReels.length > 0 && (
          <section aria-label="Top Caribbean Reels" className="tk-panel p-4 sm:p-5 space-y-3.5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-pink-400" />
                <h2 className="text-[13.5px] font-semibold text-white">
                  Trending Caribbean Reels
                </h2>
              </div>
              <Link
                href="/reels"
                className="text-xs font-medium text-brand-mist hover:text-white transition-colors flex items-center gap-1"
              >
                Watch All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {topReels.map((reel) => {
                const creator = Array.isArray(reel.profiles) ? reel.profiles[0] : reel.profiles;
                return (
                  <Link
                    key={reel.id}
                    href={`/reels?id=${reel.id}`}
                    className="group relative aspect-[9/14] rounded-2xl overflow-hidden bg-brand-twilight/80 border border-white/10 hover:border-pink-500/50 transition-all block shadow-md"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                    <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                      <Play className="w-3 h-3 fill-white" />
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 space-y-0.5">
                      <p className="text-xs font-black text-white line-clamp-1 group-hover:text-pink-300 transition-colors">
                        {reel.title || 'Caribbean Reel'}
                      </p>
                      <p className="text-[10px] text-white/60 truncate">
                        @{creator?.username || 'creator'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Marketplace & Cultural Events Spotlight */}
        {(marketProducts.length > 0 || culturalEvents.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {marketProducts.length > 0 && (
              <section aria-label="Marketplace Discoveries" className="tk-panel p-4 sm:p-5 space-y-3 border border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-brand-goldenHour" />
                      <h3 className="text-[13.5px] font-semibold text-white">
                        Marketplace
                      </h3>
                    </div>
                    <Link href="/marketplace" className="text-xs font-bold text-brand-goldenHour hover:underline">
                      Explore →
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {marketProducts.slice(0, 2).map((p) => {
                      const biz = Array.isArray(p.businesses) ? p.businesses[0] : p.businesses;
                      return (
                        <Link
                          key={p.id}
                          href={`/marketplace/${p.id}`}
                          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block group"
                        >
                          <p className="text-xs font-black text-white truncate group-hover:text-brand-goldenHour transition-colors">
                            {p.title}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="font-extrabold text-brand-sunriseCoral">
                              ${(p.price_minor / 100).toFixed(2)} {p.currency || 'USD'}
                            </span>
                            <span className="text-[10px] text-brand-mist truncate">
                              {biz?.name || 'Verified Merchant'}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {culturalEvents.length > 0 && (
              <section aria-label="Upcoming Cultural Events" className="tk-panel p-4 sm:p-5 space-y-3 border border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <h3 className="text-[13.5px] font-semibold text-white">
                        Events Horizon
                      </h3>
                    </div>
                    <Link href="/events" className="text-xs font-bold text-amber-400 hover:underline">
                      All Events →
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {culturalEvents.slice(0, 2).map((e) => {
                      const dateStr = new Date(e.start_time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                      return (
                        <Link
                          key={e.id}
                          href="/events"
                          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block group"
                        >
                          <p className="text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                            {e.title}
                          </p>
                          <p className="text-[10px] text-brand-mist truncate mt-1">
                            {dateStr} {e.location_name ? `• ${e.location_name}` : ''}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
        </div>

        {/* 6. PRIMARY HOME FEED ENGINE & CONTROL AREA */}
        <section aria-label="Home Feed Stream" className="space-y-4">
          {/* Feed tabs — understated segmented underline */}
          <div className="tk-panel px-2 sm:px-3">
            <nav aria-label="Home Feed Tabs">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none" role="tablist">
                {FEED_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`feed-panel-${tab.id}`}
                      title={tab.description}
                      onClick={() => handleTabChange(tab)}
                      className={`relative px-3.5 h-12 text-[13.5px] whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-white font-semibold'
                          : 'text-brand-mist font-medium hover:text-white'
                      }`}
                    >
                      {tab.label}
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-3 right-3 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-brand-caribbeanTeal to-brand-caribbeanSea"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Active stream context (only when filtered away from For You) */}
          {activeTab !== 'for_you' && (
            <div className="flex items-center justify-between px-1 text-[12.5px] text-brand-mist">
              <span className="truncate">{activeTabMeta.description}</span>
              <button
                type="button"
                onClick={() => handleTabChange(FEED_TABS[0])}
                className="text-[#C3CCDA] hover:text-white font-medium shrink-0 ml-3"
              >
                Back to For You
              </button>
            </div>
          )}

          {/* Stream Content Loading State */}
          {isLoadingTab ? (
            <div className="tk-panel p-12 text-center space-y-3 animate-fadeIn" role="status" aria-live="polite">
              <Loader2 className="w-6 h-6 text-brand-caribbeanSea animate-spin mx-auto" />
              <p className="text-[13px] text-brand-mist">Loading {activeTabMeta.label}…</p>
            </div>
          ) : feedPosts && feedPosts.length > 0 ? (
            <div id={`feed-panel-${activeTab}`} role="tabpanel" aria-label={`${activeTabMeta.label} Post Stream`}>
              <FeedStream
                key={activeTab}
                initialPosts={feedPosts}
                currentUserId={user.id}
                mode={activeTab}
                nextCursor={currentCursor}
              />
            </div>
          ) : (
            /* Intelligent Empty State (Zero Mock Posts) */
            <div className="tk-panel p-8 sm:p-12 text-center space-y-4 border border-white/10">
              <div className="w-14 h-14 rounded-2xl bg-brand-caribbeanSea/20 flex items-center justify-center mx-auto text-brand-caribbeanSea">
                {activeTab === 'friends' ? (
                  <Users className="w-7 h-7" />
                ) : activeTab === 'communities' ? (
                  <Flame className="w-7 h-7" />
                ) : (
                  <Globe className="w-7 h-7" />
                )}
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-lg font-black text-white">
                  {activeTab === 'friends'
                    ? 'No Friends Posts Yet'
                    : activeTab === 'following'
                    ? 'Your Following Stream is Quiet'
                    : activeTab === 'communities'
                    ? 'No Community Posts Yet'
                    : 'No Content Found in This Feed'}
                </h3>
                <p className="text-xs sm:text-sm text-brand-mist leading-relaxed">
                  {activeTab === 'friends'
                    ? 'Friends are mutual accepted relationships. Connect with people you know from your island or diaspora community to see their personal updates here.'
                    : activeTab === 'following'
                    ? 'Follow Caribbean creators, verified businesses, cultural leaders, and friends to build your personalized stream.'
                    : activeTab === 'communities'
                    ? 'Join diaspora hubs and interest groups to see discussions from your communities.'
                    : 'Be the first to share a post in this channel, or explore other Caribbean horizons.'}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {activeTab === 'friends' && (
                  <Link
                    href="/people"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-caribbeanSea hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Find Caribbean Friends</span>
                  </Link>
                )}

                {activeTab === 'following' && (
                  <Link
                    href="/explore"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-goldenHour hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Discover Creators &amp; Pages</span>
                  </Link>
                )}

                {activeTab === 'communities' && (
                  <Link
                    href="/communities"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 hover:brightness-110 text-white font-black text-xs transition-all shadow-md"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Explore Diaspora Hubs</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setShowComposer(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
                >
                  <span>Create a Post</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Right Rail: Contextual Discovery on Home ── */}
      <RightRail ariaLabel="Home Contextual Discovery">
        <HomeRail
          suggestedPeople={suggestedPeople}
          trendingTopics={trendingTopics}
          upcomingEvents={culturalEvents}
          marketplaceItems={marketProducts}
          activeLiveStream={activeLiveStream}
          managedPages={managedPages}
          followedPages={followedPages}
        />
      </RightRail>
    </div>
  );
}
