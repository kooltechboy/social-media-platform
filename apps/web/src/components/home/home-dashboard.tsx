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
  Radio,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import UniversalComposer from '../universal-composer';
import MomentsCinemaRail from '../moments/moments-cinema-rail';
import LiveBroadcastDiscovery from '../feed/live-broadcast-discovery';
import FeedStream, { type FeedPostData } from '../feed-stream';
import RightRail from '../right-rail';
import HomeRail from '../rails/home-rail';
import IdentitySwitcher from '../identity-switcher';

export interface HomeDashboardProps {
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
  liveStories?: any[];
  activeLiveStream?: any;
  topReels?: any[];
  marketProducts?: any[];
  culturalEvents?: any[];
  topPodcasts?: any[];
  recentPosts?: FeedPostData[];
  suggestedPeople?: any[];
  trendingTopics?: any[];
}

export default function HomeDashboard({
  user,
  liveStories = [],
  activeLiveStream = null,
  topReels = [],
  marketProducts = [],
  culturalEvents = [],
  topPodcasts = [],
  recentPosts = [],
  suggestedPeople = [],
  trendingTopics = [],
}: HomeDashboardProps) {
  const [showComposer, setShowComposer] = useState(false);

  // Quick Action Buttons
  const QUICK_ACTIONS = [
    { label: 'Post', icon: '📝', href: '/create', color: 'hover:border-brand-caribbeanSea/50' },
    { label: 'Reel', icon: '🎬', href: '/reels', color: 'hover:border-rose-500/50' },
    { label: 'Go Live', icon: '🔴', href: '/live', color: 'hover:border-red-500/50' },
    { label: 'Create Event', icon: '🎟️', href: '/events', color: 'hover:border-amber-400/50' },
    { label: 'Sell Item', icon: '🛒', href: '/marketplace/seller-center/create', color: 'hover:border-brand-goldenHour/50' },
    { label: 'Launch Hub', icon: '🌴', href: '/communities/create', color: 'hover:border-cyan-400/50' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      {/* ── Main Center Column: Personalized TUKUBI World ── */}
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

        {/* 2. Welcome & World Status Horizon Card */}
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
                  Your personalized dashboard across the Caribbean ecosystem
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link
                href="/feeds"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/10 hover:border-brand-sunriseCoral/40 min-h-[38px]"
              >
                <Layers className="w-4 h-4 text-brand-sunriseCoral" />
                <span>Go to Feeds</span>
              </Link>
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

        {/* 3. Live Broadcast Discovery Spotlight */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Marketplace Spotlight */}
          {marketProducts && marketProducts.length > 0 && (
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

          {/* Cultural Events Spotlight */}
          {culturalEvents && culturalEvents.length > 0 && (
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

        {/* 6. Personalized World Activity Stream (Recent Highlights from Friends & Following) */}
        <section aria-label="Personalized World Activity" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-caribbeanSea" />
              <h2 className="text-sm sm:text-base font-black text-white">
                Happening in Your World
              </h2>
            </div>
            <Link
              href="/feeds"
              className="text-xs font-bold text-brand-caribbeanSea hover:underline flex items-center gap-1"
            >
              Open Social Feeds <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPosts && recentPosts.length > 0 ? (
            <div className="space-y-4">
              <FeedStream
                initialPosts={recentPosts.slice(0, 6)}
                currentUserId={user.id}
                mode="for_you"
              />

              {/* Jump to Full Feeds CTA Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-caribbeanSea/15 via-brand-sunsetPurple/20 to-brand-sunriseCoral/15 border border-white/10 text-center space-y-2.5">
                <p className="text-sm font-black text-white">
                  Looking for more content from friends and communities?
                </p>
                <p className="text-xs text-brand-sandstone/70 max-w-md mx-auto">
                  Explore full dedicated timelines for Friends only, Following, Caribbean islands, and joined Communities.
                </p>
                <Link
                  href="/feeds"
                  className="inline-flex items-center gap-2 py-2.5 px-6 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-md"
                >
                  <Layers className="w-4 h-4" />
                  <span>Open Dedicated Feeds</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass rounded-3xl p-8 text-center space-y-4 border border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-brand-caribbeanSea/20 flex items-center justify-center mx-auto text-brand-caribbeanSea">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">Your TUKUBI World is Warming Up</h3>
                <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto">
                  Connect with Caribbean friends, join diaspora hubs, and follow your favorite creators to fill your dashboard.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                <Link
                  href="/people"
                  className="px-4 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black text-xs hover:brightness-110 transition-all"
                >
                  Find People &amp; Friends
                </Link>
                <Link
                  href="/communities"
                  className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all"
                >
                  Discover Hubs
                </Link>
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
