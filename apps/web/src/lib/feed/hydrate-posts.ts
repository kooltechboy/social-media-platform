import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReactionType } from '../../components/reactions/reaction-picker';
import type { FeedPostData } from '../../components/feed-stream';

export function formatRelativeTime(iso?: string): string {
  if (!iso) return 'just now';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (isNaN(diffMs)) return 'just now';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export interface HydratePostsOptions {
  currentUserId?: string | null;
  includeHidden?: boolean;
  defaultLocation?: string;
}

/**
 * Canonical helper that accepts raw post rows from Supabase, batches queries
 * for engagement state (reactions with type, saves, author favorites, hidden posts),
 * and produces unified FeedPostData objects with zero mock metrics.
 */
export async function hydratePostsEngagement(
  rawPosts: any[],
  supabase: SupabaseClient | null,
  options: HydratePostsOptions = {}
): Promise<FeedPostData[]> {
  if (!rawPosts || rawPosts.length === 0) {
    return [];
  }

  const {
    currentUserId,
    includeHidden = false,
    defaultLocation = 'Caribbean 🌴',
  } = options;

  const postIds = rawPosts.map((p) => p.id).filter(Boolean);
  const authorIds = Array.from(
    new Set(rawPosts.map((p) => p.author_id || p.authorId).filter(Boolean))
  );

  let userReactionsMap = new Map<string, ReactionType>();
  let userSavedSet = new Set<string>();
  let favoritedAuthorsSet = new Set<string>();
  let hiddenPostIdsSet = new Set<string>();

  if (supabase && currentUserId && postIds.length > 0) {
    try {
      const [reactionsRes, savedRes, favoritesRes, hiddenRes] = await Promise.all([
        supabase
          .from('post_reactions')
          .select('post_id, reaction_type')
          .eq('user_id', currentUserId)
          .in('post_id', postIds),
        supabase
          .from('saved_posts')
          .select('post_id')
          .eq('profile_id', currentUserId)
          .in('post_id', postIds),
        authorIds.length > 0
          ? supabase
              .from('user_favorites')
              .select('target_id')
              .eq('user_id', currentUserId)
              .in('target_id', authorIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from('hidden_posts')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds),
      ]);

      if (reactionsRes.data) {
        for (const r of reactionsRes.data) {
          if (r.post_id && r.reaction_type) {
            userReactionsMap.set(r.post_id, r.reaction_type as ReactionType);
          }
        }
      }

      if (savedRes.data) {
        for (const s of savedRes.data) {
          if (s.post_id) {
            userSavedSet.add(s.post_id);
          }
        }
      }

      if (favoritesRes.data) {
        for (const f of favoritesRes.data) {
          if (f.target_id) {
            favoritedAuthorsSet.add(f.target_id);
          }
        }
      }

      if (hiddenRes.data) {
        for (const h of hiddenRes.data) {
          if (h.post_id) {
            hiddenPostIdsSet.add(h.post_id);
          }
        }
      }
    } catch (err) {
      console.error('[hydratePostsEngagement] Error fetching engagement details:', err);
    }
  }

  // Filter out hidden posts unless caller explicitly asked to include them
  const eligiblePosts = !includeHidden && hiddenPostIdsSet.size > 0
    ? rawPosts.filter((p) => !hiddenPostIdsSet.has(p.id))
    : rawPosts;

  return eligiblePosts.map((p) => {
    const rawProfile = p.profiles;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    const authorId = p.author_id || p.authorId || profile?.id;
    const isPostOfficial =
      profile?.username?.toLowerCase() === 'tukubi' ||
      profile?.is_official ||
      profile?.is_verified ||
      p.is_official ||
      false;

    const userReaction = userReactionsMap.get(p.id) || null;
    const isUserLiked = userReaction !== null || Boolean(p.isUserLiked);
    const isSaved = userSavedSet.has(p.id) || Boolean(p.isSaved);
    const isAuthorFavorited = authorId ? favoritedAuthorsSet.has(authorId) : false;

    return {
      id: p.id,
      authorId,
      author: profile?.display_name || p.author || 'Caribbean Member',
      handle: profile?.username || p.handle || 'member',
      avatarUrl:
        profile?.avatar_url ||
        p.avatarUrl ||
        (isPostOfficial ? '/brand/tukubi-emblem.png' : null),
      verified: profile?.is_verified ?? p.verified ?? false,
      isOfficial: isPostOfficial,
      isPinned: p.is_pinned ?? p.isPinned ?? false,
      officialContentType: p.official_content_type ?? p.officialContentType,
      location: p.location_tag || p.location || defaultLocation,
      time: p.time || formatRelativeTime(p.created_at),
      content: p.content || '',
      mediaUrls: Array.isArray(p.media_urls)
        ? p.media_urls
        : Array.isArray(p.mediaUrls)
        ? p.mediaUrls
        : [],
      culturalTags: Array.isArray(p.cultural_tags)
        ? p.cultural_tags
        : Array.isArray(p.culturalTags)
        ? p.culturalTags
        : [],
      likes: Number(p.likes_count ?? p.likes ?? 0),
      reposts: Number(p.shares_count ?? p.reposts ?? 0),
      comments: Number(p.comments_count ?? p.comments ?? 0),
      isUserLiked,
      userReaction,
      isSaved,
      isAuthorFavorited,
      category: p.category || 'caribbean',
      communityId: p.community_id || p.communityId,
      countryId: p.country_id || p.countryId,
      taggedProduct: p.taggedProduct || p.tagged_product,
      poll: p.poll,
      isSponsored: p.isSponsored ?? false,
      adId: p.adId,
      headline: p.headline,
      destinationUrl: p.destinationUrl,
      ctaText: p.ctaText,
      bidCpmMinor: p.bidCpmMinor,
    };
  });
}
