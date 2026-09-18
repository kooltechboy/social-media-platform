import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Compass,
  Film,
  ShoppingBag,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Play,
  Flame,
  CheckCircle,
  Radio,
} from 'lucide-react';
import {
  createSupabaseServerClient,
  getCurrentUser,
  checkIsOfficialOperator,
} from '../lib/supabase/server';
import { isFeedMode, type FeedMode } from '@caribbean/social';
import { encodeCursor } from '@caribbean/database';
import UniversalComposer from '../components/universal-composer';
import FeedStream, { type FeedPostData } from '../components/feed-stream';
import TukubiLiveSidebar from '../components/caribbean-now-sidebar';
import RightRail from '../components/right-rail';
import { buildRankedFeed } from '../lib/feed/ranking';
import MomentsCinemaRail from '../components/moments/moments-cinema-rail';
import LiveBroadcastDiscovery from '../components/feed/live-broadcast-discovery';
import { fetchActiveStoriesAction } from '../lib/social/actions';
import { ErrorBoundary } from '../components/error-boundary';
import FeedSkeleton from '../components/ui/skeletons/feed-skeleton';
import SidebarSkeleton from '../components/ui/skeletons/sidebar-skeleton';
import PublicFrontDoor from '../components/public-front-door';
import IdentitySwitcher from '../components/identity-switcher';

export const dynamic = 'force-dynamic';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function HomePage(props: {
  searchParams?: Promise<{ mode?: string; feed?: string; cursor?: string }>;
}) {
  const searchParams = await props.searchParams;
  const rawMode = searchParams?.feed || searchParams?.mode || 'for_you';
  let normalizedMode = typeof rawMode === 'string' ? rawMode.toLowerCase().replace(/-/g, '_') : 'for_you';
  if (normalizedMode === 'foryou') normalizedMode = 'for_you';
  const mode = isFeedMode(normalizedMode) ? (normalizedMode as FeedMode) : 'for_you';
  const cursor = typeof searchParams?.cursor === 'string' ? searchParams.cursor : undefined;

  const user = await getCurrentUser();
  if (!user) {
    return <PublicFrontDoor />;
  }

  const supabase = await createSupabaseServerClient();
  const { stories: liveStories } = await fetchActiveStoriesAction();

  let livePosts: FeedPostData[] = [];
  let officialProfile: any = null;
  let officialCounts: any = null;
  let activeLiveStream: any = null;
  let isOfficialOperator = false;
  let nextCursor: string | undefined = undefined;

  // Discovery Horizon Data
  let topReels: any[] = [];
  let marketProducts: any[] = [];
  let culturalEvents: any[] = [];

  if (supabase) {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const [postsRes, liveRes, officialProfileRes, operatorStatus, reelsRes, marketRes, eventsRes] = await Promise.all([
      buildRankedFeed(user.id, mode, supabase, cursor),
      supabase
        .from('livestreams')
        .select('id, title, peak_viewers, profiles(display_name)')
        .eq('state', 'live')
        .gte('started_at', sixHoursAgo)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio, is_verified')
        .ilike('username', 'tukubi')
        .maybeSingle(),
      checkIsOfficialOperator(user.id),
      // Discovery: Reels preview
      supabase
        .from('videos')
        .select('id, title, duration_seconds, view_count, profiles(id, display_name, username, avatar_url)')
        .eq('video_kind', 'reel')
        .eq('visibility', 'public')
        .order('view_count', { ascending: false })
        .limit(4),
      // Discovery: Marketplace items
      supabase
        .from('products')
        .select('id, title, price_minor, currency, businesses(name, country_iso)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3),
      // Discovery: Cultural events
      supabase
        .from('events')
        .select('id, title, start_time, location_name')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(2),
    ]);

    isOfficialOperator = operatorStatus;
    activeLiveStream = liveRes.data;
    officialProfile = officialProfileRes.data;
    topReels = reelsRes.data || [];
    marketProducts = marketRes.data || [];
    culturalEvents = eventsRes.data || [];

    let data = postsRes.data;
    if (!data && postsRes.error) {
      const fallbackPosts = await supabase
        .from('posts')
        .select('id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, country_id, profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified)')
        .order('created_at', { ascending: false })
        .limit(30);
      data = fallbackPosts.data as any;
    }

    if (postsRes.nextCursor) {
      nextCursor = postsRes.nextCursor;
    } else if (data && data.length === 30) {
      const lastPost = data[data.length - 1];
      nextCursor = encodeCursor({ sortKey: lastPost.created_at, id: lastPost.id });
    }

    if (officialProfile?.id) {
      const { data: counts } = await supabase
        .from('profile_counts')
        .select('followers_count, following_count, posts_count, likes_received_count')
        .eq('profile_id', officialProfile.id)
        .maybeSingle();
      officialCounts = counts;
    }

    let userLikedPostIds = new Set<string>();
    if (user && data && data.length > 0) {
      const postIds = data.map((p: any) => p.id);
      const { data: reactions } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      if (reactions) {
        userLikedPostIds = new Set(reactions.map((r: any) => r.post_id));
      }
    }

    if (data && data.length > 0) {
      livePosts = data.map((p: any) => {
        const rawProfile = p.profiles;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
        const isPostOfficial = profile?.username?.toLowerCase() === 'tukubi' || profile?.is_verified || false;
        return {
          id: p.id,
          authorId: p.author_id,
          author: profile?.display_name || 'Caribbean Member',
          handle: profile?.username || 'member',
          avatarUrl: profile?.avatar_url || (profile?.username?.toLowerCase() === 'tukubi' ? '/brand/tukubi-emblem.png' : null),
          verified: profile?.is_verified ?? false,
          isOfficial: isPostOfficial,
          isPinned: isPostOfficial,
          officialContentType: isPostOfficial ? 'welcome' : undefined,
          location: 'Caribbean 🌴',
          time: relativeTime(p.created_at),
          content: p.content || '',
          mediaUrls: p.media_urls || [],
          culturalTags: p.cultural_tags || [],
          likes: p.likes_count || 0,
          reposts: p.shares_count || 0,
          comments: p.comments_count || 0,
          isUserLiked: userLikedPostIds.has(p.id),
          category: 'caribbean',
        };
      });
    }

    // Guarantee official welcome post
    const hasOfficialPost = livePosts.some((p) => p.handle?.toLowerCase() === 'tukubi' || p.id === 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff');
    if (!hasOfficialPost) {
      const officialLaunchPost: FeedPostData = {
        id: 'd23f3e75-0dfa-47c6-8df9-2c0fa299d7ff',
        authorId: officialProfile?.id || 'ff1e8b1f-7796-4424-b341-3b39e1c993bd',
        author: officialProfile?.display_name || 'TUKUBI',
        handle: officialProfile?.username || 'tukubi',
        avatarUrl: officialProfile?.avatar_url || '/brand/tukubi-emblem.png',
        verified: true,
        isOfficial: true,
        isPinned: true,
        officialContentType: 'welcome',
        location: 'Caribbean 🌴',
        time: 'Inaugural Launch',
        content: `🌴 Welcome to TUKUBI — The Caribbean Connected.\n\nConnecting Caribbean people, culture, creators, businesses & the global diaspora in one unified digital ecosystem.\n\n🌎 Born in the Caribbean. Built for the World.\n\nJoin conversations across the islands, explore live audio/video broadcasts, discover local creators, support Caribbean merchants, and build the future of our digital heritage together. ☀️🌊🎶`,
        mediaUrls: [],
        culturalTags: ['caribbean', 'tukubiofficial', 'welcome', 'diaspora', 'culture'],
        likes: officialCounts?.likes_received_count || 0,
        reposts: 0,
        comments: 0,
        isUserLiked: false,
        category: 'caribbean',
      };
      livePosts = [officialLaunchPost, ...livePosts];
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      {/* Main Discovery Engine Stream */}
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[740px] xl:max-w-[760px] mx-auto lg:mx-0">
        {/* 1. Caribbean Moments Cinema Rail (Ephemeral Stories) */}
        <ErrorBoundary sectionName="Moments Cinema Rail">
          <MomentsCinemaRail
            initialStories={liveStories}
            currentUserId={user?.id}
            currentUserAvatar={user?.avatarUrl}
            currentUserName={user?.displayName}
          />
        </ErrorBoundary>

        {/* 2. Discovery vs Feeds Distinct Switching Banner */}
        <div className="glass-aerospace rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 border border-white/12 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral flex items-center justify-center text-slate-950 font-black shadow-md shadow-brand-caribbeanSea/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white truncate">
                  Discovery Engine
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                  Live Horizon
                </span>
              </div>
              <p className="text-xs text-brand-sandstone/70 truncate">
                Curated Caribbean culture, trending media, and recommended creators
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/feeds"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/10 hover:border-brand-sunriseCoral/40 min-h-[38px]"
            >
              <Layers className="w-4 h-4 text-brand-sunriseCoral" />
              <span className="hidden sm:inline">My Feeds</span>
            </Link>
            <IdentitySwitcher variant="compact" />
          </div>
        </div>

        {/* 3. Primary Universal Inline Composer ("What's happening?") */}
        <section aria-label="Create Post" className="space-y-4">
          <ErrorBoundary sectionName="Composer">
            <UniversalComposer
              displayName={user.displayName || `@${user.username}`}
              avatarInitials={user.username.slice(0, 2).toUpperCase()}
              userId={user.id}
            />
          </ErrorBoundary>
        </section>

        {/* 4. Live Broadcast Discovery */}
        <ErrorBoundary sectionName="Live Broadcasts">
          <LiveBroadcastDiscovery activeStream={activeLiveStream} />
        </ErrorBoundary>

        {/* 5. Reels Horizon Cinema Preview (Discovery Module) */}
        {topReels.length > 0 && (
          <section aria-label="Top Caribbean Reels" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-pink-400" />
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Trending Caribbean Reels
                </h3>
              </div>
              <Link href="/reels" className="text-xs font-bold text-brand-caribbeanSea hover:underline flex items-center gap-1">
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

        {/* 6. Marketplace & Events Horizon Spotlight */}
        {marketProducts.length > 0 && (
          <section aria-label="Caribbean Marketplace Discovery" className="glass rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-goldenHour" />
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Marketplace Discoveries
                </h3>
              </div>
              <Link href="/marketplace" className="text-xs font-bold text-brand-goldenHour hover:underline flex items-center gap-1">
                Explore Market <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {marketProducts.map((p) => {
                const biz = Array.isArray(p.businesses) ? p.businesses[0] : p.businesses;
                const formattedPrice = `$${(p.price_minor / 100).toFixed(2)} ${p.currency || 'USD'}`;
                return (
                  <Link
                    key={p.id}
                    href={`/marketplace/${p.id}`}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all block group"
                  >
                    <p className="text-xs font-black text-white truncate group-hover:text-brand-goldenHour transition-colors">
                      {p.title}
                    </p>
                    <p className="text-sm font-extrabold text-brand-sunriseCoral mt-1">
                      {formattedPrice}
                    </p>
                    <p className="text-[10px] text-brand-sandstone/60 truncate mt-0.5">
                      {biz?.name || 'Verified Merchant'} • {biz?.country_iso || 'Caribbean'}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 7. Caribbean Discovery Feed Stream */}
        <section aria-label="Discovery Feed Stream">
          <ErrorBoundary sectionName="Feed Stream">
            <Suspense fallback={<FeedSkeleton />}>
              <FeedStream
                initialPosts={livePosts}
                currentUserId={user?.id}
                mode={mode}
                nextCursor={nextCursor}
              />
            </Suspense>
          </ErrorBoundary>
        </section>
      </div>

      {/* Right Column: TUKUBI Live & Diaspora Pulse */}
      <RightRail ariaLabel="TUKUBI Live & Diaspora Pulse">
        <ErrorBoundary sectionName="Caribbean Sidebar">
          <Suspense fallback={<SidebarSkeleton />}>
            <TukubiLiveSidebar
              user={user}
              activeLiveStream={activeLiveStream}
              officialProfile={officialProfile}
              officialCounts={officialCounts}
              isOfficialOperator={isOfficialOperator}
            />
          </Suspense>
        </ErrorBoundary>
      </RightRail>
    </div>
  );
}
