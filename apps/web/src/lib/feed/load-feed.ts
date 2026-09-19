import {
  createSupabaseServerClient,
  getCurrentUser,
} from '../supabase/server';
import { isFeedMode, type FeedMode } from '@caribbean/social';
import { encodeCursor } from '@caribbean/database';
import { buildRankedFeed } from './ranking';
import { type FeedPostData } from '../../components/feed-stream';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export async function loadFeedPageData(rawMode?: string, cursor?: string) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      mode: 'for_you' as FeedMode,
      posts: [],
      friendsCount: 0,
      followingCount: 0,
      favoritesCount: 0,
      suggestedCreators: [],
      trendingTopics: [],
    };
  }

  let normalizedMode = typeof rawMode === 'string' ? rawMode.toLowerCase().replace(/-/g, '_') : 'for_you';
  if (normalizedMode === 'foryou') normalizedMode = 'for_you';
  const mode: FeedMode = isFeedMode(normalizedMode) ? (normalizedMode as FeedMode) : 'for_you';

  const supabase = await createSupabaseServerClient();
  let posts: FeedPostData[] = [];
  let nextCursor: string | undefined = undefined;
  let friendsCount = 0;
  let followingCount = 0;
  let favoritesCount = 0;
  let suggestedCreators: any[] = [];
  let trendingTopics: Array<{ tag: string; post_count?: number }> = [];

  if (supabase) {
    const [postsRes, friendsRes, followsRes, favsRes, creatorsRes, trendingRes] = await Promise.all([
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
      supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, is_verified, origin_country_iso')
        .neq('id', user.id)
        .eq('is_verified', true)
        .limit(3),
      supabase
        .from('trending_signals')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('score', { ascending: false })
        .limit(8),
    ]);

    friendsCount = friendsRes.count || 0;
    followingCount = followsRes.count || 0;
    favoritesCount = favsRes.count || 0;
    suggestedCreators = creatorsRes.data || [];
    trendingTopics = (trendingRes.data || []).map((s: any) => ({
      tag: (s.entity_label || '').replace(/^#/, ''),
      post_count: s.post_count_last_24h,
    })).filter((t: any) => Boolean(t.tag));

    const data = postsRes.data;
    if (postsRes.nextCursor) {
      nextCursor = postsRes.nextCursor;
    } else if (data && data.length === 30) {
      const lastPost = data[data.length - 1];
      nextCursor = encodeCursor({ sortKey: lastPost.created_at, id: lastPost.id });
    }

    if (data && data.length > 0) {
      const postIds = data.map((p: any) => p.id);
      const { data: reactions } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      const userLikedSet = new Set(reactions?.map((r: any) => r.post_id) || []);

      posts = data.map((p: any) => {
        const rawProfile = p.profiles;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
        const isPostOfficial =
          profile?.username?.toLowerCase() === 'tukubi' || profile?.is_verified || false;

        return {
          id: p.id,
          authorId: p.author_id,
          author: profile?.display_name || 'Caribbean Member',
          handle: profile?.username || 'member',
          avatarUrl:
            profile?.avatar_url || (isPostOfficial ? '/brand/tukubi-emblem.png' : null),
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
          isUserLiked: userLikedSet.has(p.id),
          category: 'caribbean',
        };
      });
    }
  }

  return {
    user,
    mode,
    posts,
    nextCursor,
    friendsCount,
    followingCount,
    favoritesCount,
    suggestedCreators,
    trendingTopics,
  };
}
