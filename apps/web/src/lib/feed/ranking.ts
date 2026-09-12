import { type SupabaseClient } from '@supabase/supabase-js';
import { type FeedMode } from '@caribbean/social';
import { decodeCursor, encodeCursor } from '@caribbean/database';
import { CaribbeanFeedRanker, type CaribbeanGraphSignals } from '@caribbean/recommendations';
import { cacheGet, cacheSet } from '../cache/redis-cache';

export interface RankedFeedResult {
  data: any[] | null;
  nextCursor?: string;
  error?: any;
}

export async function buildRankedFeed(
  userId: string,
  mode: FeedMode,
  supabase: SupabaseClient,
  cursor?: string,
  options?: { skipCache?: boolean }
): Promise<RankedFeedResult> {
  const isTest = process.env.NODE_ENV === 'test';
  const shouldCache = !isTest && !options?.skipCache;
  const cacheKey = `feed:${userId}:${mode}:${cursor || 'head'}`;

  if (shouldCache) {
    try {
      const cached = await cacheGet<RankedFeedResult>(cacheKey);
      if (cached && cached.data) {
        return cached;
      }
    } catch {
      // Non-blocking cache lookup failure
    }
  }

  try {
    // 1. Check Feature Flag
    const { data: flagData } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('flag_name', 'new_feed_algorithm')
      .maybeSingle();
      
    const isEnabled = flagData?.is_enabled ?? false;

    // 2. Determine if we should rank
    const isRankableMode = mode === 'for_you' || mode === 'caribbean';
    const shouldRank = isEnabled && isRankableMode;
    const limitCount = shouldRank ? 60 : 30;

    // 3. Build the base query
    let postQuery = supabase
      .from('posts')
      .select('id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, country_id, profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified)')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (cursor) {
      const decoded = decodeCursor(cursor);
      postQuery = postQuery.lt('created_at', decoded.sortKey);
    }

    // Apply mode filters
    if (mode === 'following') {
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
      const followingIds = follows?.map((f: any) => f.following_id) || [];
      if (followingIds.length > 0) postQuery = postQuery.in('author_id', followingIds);
      else postQuery = postQuery.in('author_id', ['00000000-0000-0000-0000-000000000000']);
    } else if (mode === 'friends') {
      const { data: f1 } = await supabase.from('friendships').select('addressee_id').eq('requester_id', userId).eq('status', 'accepted');
      const { data: f2 } = await supabase.from('friendships').select('requester_id').eq('addressee_id', userId).eq('status', 'accepted');
      const friendIds = [...(f1?.map((f: any) => f.addressee_id) || []), ...(f2?.map((f: any) => f.requester_id) || [])];
      if (friendIds.length > 0) postQuery = postQuery.in('author_id', friendIds);
      else postQuery = postQuery.in('author_id', ['00000000-0000-0000-0000-000000000000']);
    } else if (mode === 'caribbean') {
      postQuery = postQuery.not('country_id', 'is', null);
    } else if (mode === 'communities') {
      const { data: memberships } = await supabase.from('community_members').select('community_id').eq('profile_id', userId).eq('membership_status', 'active');
      const communityIds = memberships?.map((m: any) => m.community_id) || [];
      if (communityIds.length > 0) {
        const { data: communityMembers } = await supabase.from('community_members').select('profile_id').in('community_id', communityIds);
        const memberIds = communityMembers?.map((m: any) => m.profile_id) || [];
        if (memberIds.length > 0) postQuery = postQuery.in('author_id', memberIds);
        else postQuery = postQuery.in('author_id', ['00000000-0000-0000-0000-000000000000']);
      } else {
        postQuery = postQuery.in('author_id', ['00000000-0000-0000-0000-000000000000']);
      }
    } else if (mode === 'for_you') {
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
      const followingIds = follows?.map((f: any) => f.following_id) || [];
      if (followingIds.length > 0) {
        postQuery = postQuery.or(`author_id.in.(${followingIds.join(',')}),country_id.not.is.null`);
      } else {
        postQuery = postQuery.not('country_id', 'is', null);
      }
    }

    const { data: candidates, error } = await postQuery;
    
    if (error) {
      return { data: null, error };
    }
    
    if (!candidates || candidates.length === 0) {
      return { data: [] };
    }

    // 4. If no ranking, just return chronological
    if (!shouldRank) {
      let nextCursor: string | undefined = undefined;
      if (candidates.length === limitCount) {
        const last = candidates[candidates.length - 1];
        nextCursor = encodeCursor({ sortKey: last.created_at, id: last.id });
      }
      const unrankedResult = { data: candidates, nextCursor };
      if (shouldCache) {
        cacheSet(cacheKey, unrankedResult, 30).catch(() => {});
      }
      return unrankedResult;
    }

    // 5. Fetch context for signals (follows, friendships, user profile)
    const [followsRes, friendshipsRes, profileRes] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', userId),
      supabase.from('friendships').select('requester_id, addressee_id, status')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      supabase.from('profiles').select('country_id').eq('id', userId).single()
    ]);

    const followingSet = new Set(followsRes.data?.map((f: any) => f.following_id) || []);
    const friendsSet = new Set(friendshipsRes.data?.filter((f: any) => f.status === 'accepted').map((f: any) => f.requester_id === userId ? f.addressee_id : f.requester_id) || []);
    const userCountryId = profileRes.data?.country_id;

    // 6. Build Signals and Rank
    const ranker = new CaribbeanFeedRanker();
    
    const rankableItems = candidates.map((post: any) => {
      // Relationship
      let relationshipScore = 0;
      if (followingSet.has(post.author_id)) relationshipScore = 1.0;
      else if (friendsSet.has(post.author_id)) relationshipScore = 0.5;

      // Recency
      const recencyHours = (Date.now() - new Date(post.created_at).getTime()) / 3_600_000;

      // Engagement
      const rawEngagement = (post.likes_count || 0) + (post.comments_count || 0) * 2 + (post.shares_count || 0) * 3;
      const engagementScore = Math.min(1.0, rawEngagement / 500);

      // Content Quality
      let contentQualityScore = 0.7;
      if (post.media_urls && post.media_urls.length > 0) contentQualityScore = 0.9;
      else if (!post.content || post.content.length < 10) contentQualityScore = 0.5;

      // Geographic
      let geographicRelevanceScore = 0;
      if (userCountryId && post.country_id === userCountryId) geographicRelevanceScore = 0.8;
      else if (post.country_id) geographicRelevanceScore = 0.4;

      // Caribbean Relevance
      const caribbeanRelevanceScore = post.country_id ? 0.7 : 0.3;

      const signals: CaribbeanGraphSignals = {
        relationshipScore,
        recencyHours,
        engagementScore,
        contentQualityScore,
        creatorAffinityScore: 0,
        communityAffinityScore: 0,
        geographicRelevanceScore,
        caribbeanRelevanceScore,
        languageMatchScore: 0.5,
        negativeFeedbackPenalty: 0,
        safetyScore: 1.0
      };

      return { item: post, signals };
    });

    const ranked = ranker.rank(rankableItems);
    
    // 7. Return top 30
    const top30 = ranked.slice(0, 30).map(r => r.item);
    
    let nextCursor: string | undefined = undefined;
    if (top30.length > 0) {
      const lastItem = top30[top30.length - 1];
      nextCursor = encodeCursor({ sortKey: lastItem.created_at, id: lastItem.id });
    }

    const rankedResult = { data: top30, nextCursor };
    if (shouldCache) {
      cacheSet(cacheKey, rankedResult, 30).catch(() => {});
    }
    return rankedResult;
  } catch (error) {
    return { data: null, error };
  }
}
