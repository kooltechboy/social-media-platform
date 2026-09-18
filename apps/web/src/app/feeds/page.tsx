import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Star,
  Building2,
  Flame,
  Globe,
  Compass,
  Sparkles,
  Layers,
  Filter,
} from 'lucide-react';
import {
  createSupabaseServerClient,
  getCurrentUser,
} from '../../lib/supabase/server';
import { isFeedMode, type FeedMode } from '@caribbean/social';
import { encodeCursor } from '@caribbean/database';
import FeedStream, { type FeedPostData } from '../../components/feed-stream';
import RightRail from '../../components/right-rail';
import { buildRankedFeed } from '../../lib/feed/ranking';
import { ErrorBoundary } from '../../components/error-boundary';
import FeedSkeleton from '../../components/ui/skeletons/feed-skeleton';
import PublicFrontDoor from '../../components/public-front-door';
import IdentitySwitcher from '../../components/identity-switcher';

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

interface FeedsPageProps {
  searchParams?: Promise<{ mode?: string; filter?: string; cursor?: string }>;
}

const FEED_FILTERS: Array<{
  id: FeedMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'following', label: 'All Connected', description: 'People, Pages & Creators you follow', icon: Layers },
  { id: 'friends', label: 'Friends', description: 'Accepted mutual friends only — 0% recommendations', icon: Users },
  { id: 'favorites', label: 'Favorites', description: 'Your favorited people, creators & pages', icon: Star },
  { id: 'pages', label: 'Pages & Stores', description: 'Verified businesses, cultural institutions & stores', icon: Building2 },
  { id: 'communities', label: 'Communities', description: 'Content from your joined diaspora hubs', icon: Flame },
  { id: 'caribbean', label: 'Caribbean Islands', description: 'Local island & regional territory updates', icon: Globe },
];

export default async function FeedsPage(props: FeedsPageProps) {
  const searchParams = await props.searchParams;
  const rawMode = searchParams?.filter || searchParams?.mode || 'following';
  let normalizedMode = typeof rawMode === 'string' ? rawMode.toLowerCase().replace(/-/g, '_') : 'following';
  if (normalizedMode === 'all') normalizedMode = 'following';
  const mode = isFeedMode(normalizedMode) ? (normalizedMode as FeedMode) : 'following';
  const cursor = typeof searchParams?.cursor === 'string' ? searchParams.cursor : undefined;

  const user = await getCurrentUser();
  if (!user) {
    return <PublicFrontDoor />;
  }

  const supabase = await createSupabaseServerClient();
  let feedPosts: FeedPostData[] = [];
  let nextCursor: string | undefined = undefined;

  // Connection counts
  let friendsCount = 0;
  let followingCount = 0;
  let favoritesCount = 0;

  if (supabase) {
    const [postsRes, friendsRes, followsRes, favsRes] = await Promise.all([
      buildRankedFeed(user.id, mode, supabase, cursor, { skipCache: true }),
      supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted'),
      supabase
        .from('follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', user.id),
      supabase
        .from('user_favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    friendsCount = friendsRes.count || 0;
    followingCount = followsRes.count || 0;
    favoritesCount = favsRes.count || 0;

    let data = postsRes.data;
    if (postsRes.nextCursor) {
      nextCursor = postsRes.nextCursor;
    } else if (data && data.length === 30) {
      const lastPost = data[data.length - 1];
      nextCursor = encodeCursor({ sortKey: lastPost.created_at, id: lastPost.id });
    }

    if (data && data.length > 0) {
      // Check user liked posts
      const postIds = data.map((p: any) => p.id);
      const { data: reactions } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      const userLikedPostIds = new Set(reactions?.map((r: any) => r.post_id) || []);

      feedPosts = data.map((p: any) => {
        const rawProfile = p.profiles;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
        const isPostOfficial = profile?.username?.toLowerCase() === 'tukubi' || profile?.is_verified || false;
        return {
          id: p.id,
          authorId: p.author_id,
          author: profile?.display_name || 'Caribbean Member',
          handle: profile?.username || 'member',
          avatarUrl: profile?.avatar_url || (isPostOfficial ? '/brand/tukubi-emblem.png' : null),
          verified: profile?.is_verified ?? false,
          isOfficial: isPostOfficial,
          isPinned: p.is_pinned || false,
          officialContentType: p.official_content_type,
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
  }

  const activeFilterMeta = FEED_FILTERS.find((f) => f.id === mode) || FEED_FILTERS[0];

  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full">
      {/* Main Feeds Workspace */}
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[740px] xl:max-w-[760px] mx-auto lg:mx-0">
        {/* Feeds Surface Header */}
        <header className="glass-aerospace rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-black uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" /> Controlled Social Feeds
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Your Relationships &amp; Communities
              </h1>
              <p className="text-xs sm:text-sm text-brand-sandstone/70 mt-1 leading-relaxed">
                Stay updated on people, Pages, and Caribbean communities you already care about. Pure timeline, no unwanted clutter.
              </p>
            </div>
            <div className="hidden sm:block shrink-0">
              <IdentitySwitcher variant="compact" />
            </div>
          </div>

          {/* Controlled Filter Tabs */}
          <nav aria-label="Feeds Filter" className="pt-2">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {FEED_FILTERS.map((item) => {
                const isActive = mode === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={`/feeds?filter=${item.id}`}
                    scroll={false}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap min-h-[42px] transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
                        : 'bg-white/5 hover:bg-white/10 text-brand-sandstone/80 hover:text-white border border-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </header>

        {/* Current Active Filter Indicator Banner */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-brand-sandstone/80">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-brand-caribbeanSea" />
            <span>Showing: <strong className="text-white font-black">{activeFilterMeta.label}</strong> — {activeFilterMeta.description}</span>
          </div>
          <Link href="/" className="text-brand-goldenHour hover:underline font-bold text-[11px] shrink-0">
            Switch to Discovery Home →
          </Link>
        </div>

        {/* Feeds Stream List */}
        <section aria-label="Feeds Post Stream">
          <ErrorBoundary sectionName="Feeds Stream">
            <Suspense fallback={<FeedSkeleton />}>
              <FeedStream
                initialPosts={feedPosts}
                currentUserId={user?.id}
                mode={mode}
                nextCursor={nextCursor}
              />
            </Suspense>
          </ErrorBoundary>
        </section>
      </div>

      {/* Right Column: Connection Control Rail */}
      <RightRail ariaLabel="Feeds Connection Hub">
        <div className="glass rounded-2xl p-5 space-y-5 border border-white/10">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea">
              Your Social Graph
            </h3>
            <p className="text-xs text-brand-sandstone/60">
              Connections powering your controlled feeds
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Link
              href="/friends"
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block"
            >
              <p className="text-lg font-black text-white">{friendsCount}</p>
              <p className="text-[10px] text-brand-sandstone/60 uppercase font-black">Friends</p>
            </Link>
            <Link
              href="/people"
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block"
            >
              <p className="text-lg font-black text-white">{followingCount}</p>
              <p className="text-[10px] text-brand-sandstone/60 uppercase font-black">Following</p>
            </Link>
            <Link
              href="/feeds?filter=favorites"
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors block"
            >
              <p className="text-lg font-black text-brand-goldenHour">{favoritesCount}</p>
              <p className="text-[10px] text-brand-goldenHour/70 uppercase font-black">Favorites</p>
            </Link>
          </div>

          <div className="h-px bg-white/10" />

          {/* Favorites Explainer */}
          <div className="space-y-2">
            <p className="text-xs font-black text-white flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-brand-goldenHour" /> What are Favorites?
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Designate close friends, priority creators, business pages, or hubs as favorites to keep their updates at your fingertips without algorithmic interruption.
            </p>
          </div>

          <div className="h-px bg-white/10" />

          {/* Discovery Switcher */}
          <div className="p-4 rounded-xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/20 space-y-2">
            <p className="text-xs font-black text-brand-caribbeanSea flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Looking to Discover?
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              TUKUBI Home is your discovery engine for trending Caribbean media, Reels, podcasts, marketplace items, and new creators.
            </p>
            <Link
              href="/"
              className="inline-block w-full text-center py-2 px-3 rounded-xl bg-brand-caribbeanSea hover:bg-brand-caribbeanSea/80 text-slate-950 font-black text-xs transition-colors shadow-sm"
            >
              Go to Discovery Home
            </Link>
          </div>
        </div>
      </RightRail>
    </div>
  );
}
