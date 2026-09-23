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
} from 'lucide-react';
import { type FeedMode } from '@caribbean/social';
import UserAvatar from '../user-avatar';
import UniversalComposer from '../universal-composer';
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
    id: 'communities',
    slug: 'communities',
    label: 'Communities',
    description: 'Discussions from your joined diaspora hubs',
    icon: Flame,
    color: 'text-rose-400',
  },
  {
    id: 'caribbean',
    slug: 'caribbean',
    label: 'Caribbean',
    description: 'Updates from island territories and regional cultural tags',
    icon: Globe,
    color: 'text-amber-400',
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
}: HomeDashboardProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedMode>(initialMode);
  const [feedPosts, setFeedPosts] = useState<FeedPostData[]>(initialPosts);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(nextCursor);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  const activeTabMeta = FEED_TABS.find((t) => t.id === activeTab) || FEED_TABS[0];

  // Quick Action Buttons
  const QUICK_ACTIONS = [
    { label: 'Post', icon: '📝', href: '/create', color: 'hover:border-brand-caribbeanSea/50' },
    { label: 'Reel', icon: '🎬', href: '/reels', color: 'hover:border-rose-500/50' },
    { label: 'Go Live', icon: '🔴', href: '/live', color: 'hover:border-red-500/50' },
    { label: 'Create Event', icon: '🎟️', href: '/events', color: 'hover:border-amber-400/50' },
    { label: 'Sell Item', icon: '🛒', href: '/marketplace/seller-center/create', color: 'hover:border-brand-goldenHour/50' },
    { label: 'Launch Hub', icon: '🌴', href: '/communities/create', color: 'hover:border-cyan-400/50' },
  ];

  const handleTabChange = async (tab: typeof FEED_TABS[number]) => {
    if (tab.id === activeTab || isLoadingTab) return;

    setActiveTab(tab.id);
    setIsLoadingTab(true);

    const targetUrl = tab.id === 'for_you' ? '/' : `/?tab=${tab.slug}`;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', targetUrl);
    }

    try {
      const res = await fetchFeedPostsAction({ mode: tab.id });
      setFeedPosts(res.posts || []);
      setCurrentCursor(res.nextCursor);
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

        {/* 2. Welcome & Post Creation Horizon Card */}
        <div className="glass-aerospace rounded-3xl p-5 sm:p-6 border border-white/12 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <UserAvatar
                src={user.avatarUrl}
                name={user.displayName}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white truncate">
                    Welcome back, {user.displayName.split(' ')[0]} 🌴
                  </h1>
                </div>
                <p className="text-xs text-brand-sandstone/70 truncate">
                  Your primary home across the Caribbean digital ecosystem
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <IdentitySwitcher variant="compact" />
            </div>
          </div>

          {/* Quick Creation Bar Trigger */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowComposer((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-brand-caribbeanSea/50 text-left transition-all group"
            >
              <span className="text-xs sm:text-sm text-brand-sandstone/60 group-hover:text-white transition-colors">
                What’s happening across your Caribbean world?
              </span>
              <span className="px-3 py-1 rounded-xl bg-brand-caribbeanSea/20 text-brand-caribbeanSea font-bold text-xs border border-brand-caribbeanSea/30">
                {showComposer ? 'Close Composer' : 'Write Post'}
              </span>
            </button>
          </div>

          {/* Inline Composer (Expandable) */}
          {showComposer && (
            <div className="pt-2 animate-fadeIn">
              <UniversalComposer
                displayName={user.displayName}
                avatarInitials={user.username.slice(0, 2).toUpperCase()}
                userId={user.id}
                defaultExpanded={true}
                onPostCreated={handlePostCreated}
              />
            </div>
          )}

          {/* Quick Creation Actions Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center min-h-[66px] ${action.color}`}
              >
                <span className="text-lg mb-0.5">{action.icon}</span>
                <span className="text-[11px] font-bold text-white truncate w-full">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Live Broadcast Discovery Spotlight (if active) */}
        {activeLiveStream && (
          <section aria-label="Live Broadcasts">
            <LiveBroadcastDiscovery activeStream={activeLiveStream} />
          </section>
        )}

        {/* 4. Trending Caribbean Reels Preview */}
        {topReels && topReels.length > 0 && (
          <section aria-label="Top Caribbean Reels" className="glass rounded-3xl p-4 sm:p-5 space-y-3.5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-pink-400" />
                <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Trending Caribbean Reels
                </h2>
              </div>
              <Link
                href="/reels"
                className="text-xs font-bold text-brand-caribbeanSea hover:underline flex items-center gap-1"
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
              <section aria-label="Marketplace Discoveries" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-brand-goldenHour" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
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
                            <span className="text-[10px] text-brand-sandstone/60 truncate">
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
              <section aria-label="Upcoming Cultural Events" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
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
                          <p className="text-[10px] text-brand-sandstone/60 truncate mt-1">
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

        {/* 6. PRIMARY HOME FEED ENGINE & CONTROL AREA */}
        <section aria-label="Home Feed Stream" className="space-y-4 pt-2">
          {/* Feed Filter Segmented Controls */}
          <div className="glass-aerospace rounded-3xl p-3 sm:p-4 border border-white/12 shadow-xl space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-caribbeanSea" />
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Home Stream
                </h2>
              </div>
              <span className="text-[11px] font-bold text-brand-sandstone/60">
                {activeTabMeta.label}
              </span>
            </div>

            {/* 5 Standard Feed Tabs */}
            <nav aria-label="Home Feed Tabs">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5" role="tablist">
                {FEED_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`feed-panel-${tab.id}`}
                      onClick={() => handleTabChange(tab)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap min-h-[44px] transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20 scale-[1.02]'
                          : 'bg-white/5 hover:bg-white/10 text-brand-sandstone/80 hover:text-white border border-white/10'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : tab.color}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Active Stream Indicator Banner */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-brand-sandstone/80">
            <div className="flex items-center gap-2 min-w-0">
              <Filter className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
              <span className="truncate">
                Showing: <strong className="text-white font-black">{activeTabMeta.label}</strong> — {activeTabMeta.description}
              </span>
            </div>
            {activeTab !== 'for_you' && (
              <button
                type="button"
                onClick={() => handleTabChange(FEED_TABS[0])}
                className="text-brand-goldenHour hover:underline font-bold text-[11px] shrink-0 ml-2"
              >
                Reset to For You
              </button>
            )}
          </div>

          {/* Stream Content Loading State */}
          {isLoadingTab ? (
            <div className="glass rounded-3xl p-12 text-center space-y-3 border border-white/10 animate-fadeIn">
              <Loader2 className="w-8 h-8 rounded-full text-brand-caribbeanSea animate-spin mx-auto" />
              <p className="text-xs text-brand-sandstone/70">Loading {activeTabMeta.label} updates...</p>
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
            <div className="glass rounded-3xl p-8 sm:p-12 text-center space-y-4 border border-white/10">
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
                <p className="text-xs sm:text-sm text-brand-sandstone/70 leading-relaxed">
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
        />
      </RightRail>
    </div>
  );
}
