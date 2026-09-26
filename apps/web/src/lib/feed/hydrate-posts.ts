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

  // Collect page IDs, community IDs, and shared post IDs needed for hydration
  const missingPageIds = Array.from(
    new Set(rawPosts.filter((p) => p.page_id && !p.businesses).map((p) => p.page_id))
  );
  const communityIds = Array.from(
    new Set(rawPosts.filter((p) => p.community_id && !p.communities).map((p) => p.community_id))
  );
  const sharedPostIds = Array.from(
    new Set(rawPosts.filter((p) => p.shared_post_id).map((p) => p.shared_post_id))
  );

  let businessesMap = new Map<string, any>();
  let communitiesMap = new Map<string, any>();
  let sharedPostsMap = new Map<string, FeedPostData>();

  if (supabase) {
    try {
      const promises: PromiseLike<any>[] = [];

      if (currentUserId && postIds.length > 0) {
        promises.push(
          supabase
            .from('post_reactions')
            .select('post_id, reaction_type')
            .eq('user_id', currentUserId)
            .in('post_id', postIds)
        );
        promises.push(
          supabase
            .from('saved_posts')
            .select('post_id')
            .eq('profile_id', currentUserId)
            .in('post_id', postIds)
        );
        promises.push(
          authorIds.length > 0
            ? supabase
                .from('user_favorites')
                .select('target_id')
                .eq('user_id', currentUserId)
                .in('target_id', authorIds)
            : Promise.resolve({ data: [] })
        );
        promises.push(
          supabase
            .from('hidden_posts')
            .select('post_id')
            .eq('user_id', currentUserId)
            .in('post_id', postIds)
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
        promises.push(Promise.resolve({ data: [] }));
        promises.push(Promise.resolve({ data: [] }));
        promises.push(Promise.resolve({ data: [] }));
      }

      // Batch query missing page profiles
      if (missingPageIds.length > 0) {
        promises.push(
          supabase
            .from('businesses')
            .select('id, name, slug, avatar_url, is_verified')
            .in('id', missingPageIds)
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Batch query community details
      if (communityIds.length > 0) {
        promises.push(
          supabase
            .from('communities')
            .select('id, name, slug')
            .in('id', communityIds)
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Batch query original shared posts
      if (sharedPostIds.length > 0) {
        promises.push(
          supabase
            .from('posts')
            .select(`
              id, author_id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, 
              page_id, publisher_type, publisher_entity_id, is_official, official_content_type,
              profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified, is_official),
              businesses:businesses!posts_page_id_fkey(id, name, slug, avatar_url, is_verified)
            `)
            .in('id', sharedPostIds)
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      const [
        reactionsRes,
        savedRes,
        favoritesRes,
        hiddenRes,
        bizRes,
        commRes,
        sharedPostsRes,
      ] = await Promise.all(promises);

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

      if (bizRes.data) {
        for (const b of bizRes.data) {
          businessesMap.set(b.id, b);
        }
      }

      if (commRes.data) {
        for (const c of commRes.data) {
          communitiesMap.set(c.id, c);
        }
      }

      // Hydrate referenced original posts (single-depth to prevent recursion)
      if (sharedPostsRes.data && sharedPostsRes.data.length > 0) {
        for (const sp of sharedPostsRes.data) {
          const spRawProfile = sp.profiles;
          const spProfile = Array.isArray(spRawProfile) ? spRawProfile[0] : spRawProfile;
          const spRawBiz = sp.businesses;
          const spBiz = Array.isArray(spRawBiz) ? spRawBiz[0] : spRawBiz;
          const isSpOfficial = spProfile?.username?.toLowerCase() === 'tukubi' || spProfile?.is_official || sp.is_official || false;

          let spAuthor = spProfile?.display_name || 'Caribbean Member';
          let spHandle = spProfile?.username || 'member';
          let spAvatar = spProfile?.avatar_url || null;
          let spVerified = spProfile?.is_verified ?? false;

          if (sp.publisher_type === 'page' && spBiz) {
            spAuthor = spBiz.name;
            spHandle = spBiz.slug;
            spAvatar = spBiz.avatar_url || null;
            spVerified = spBiz.is_verified ?? true;
          } else if (sp.publisher_type === 'official' || isSpOfficial) {
            spAuthor = 'TUKUBI';
            spHandle = 'tukubi';
            spAvatar = spProfile?.avatar_url || '/brand/tukubi-emblem.png';
            spVerified = true;
          }

          sharedPostsMap.set(sp.id, {
            id: sp.id,
            authorId: sp.author_id,
            author: spAuthor,
            handle: spHandle,
            avatarUrl: spAvatar,
            verified: spVerified,
            isOfficial: isSpOfficial,
            isPinned: sp.is_pinned ?? false,
            officialContentType: sp.official_content_type,
            location: defaultLocation,
            time: formatRelativeTime(sp.created_at),
            content: sp.content || '',
            mediaUrls: Array.isArray(sp.media_urls) ? sp.media_urls : [],
            culturalTags: Array.isArray(sp.cultural_tags) ? sp.cultural_tags : [],
            likes: Number(sp.likes_count ?? 0),
            reposts: Number(sp.shares_count ?? 0),
            comments: Number(sp.comments_count ?? 0),
            publisherType: sp.publisher_type || (sp.page_id ? 'page' : isSpOfficial ? 'official' : 'personal'),
            publisherId: sp.publisher_entity_id || sp.author_id,
            pageId: sp.page_id,
            pageSlug: spBiz?.slug,
            pageName: spBiz?.name,
          });
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
      Boolean(profile?.is_official) ||
      Boolean(p.is_official) ||
      p.publisher_type === 'official' ||
      false;

    const rawBiz = p.businesses;
    const joinedBiz = Array.isArray(rawBiz) ? rawBiz[0] : rawBiz;
    const business = joinedBiz || businessesMap.get(p.page_id);

    const rawComm = p.communities;
    const joinedComm = Array.isArray(rawComm) ? rawComm[0] : rawComm;
    const community = joinedComm || communitiesMap.get(p.community_id);

    const publisherType: 'personal' | 'official' | 'page' | 'community' | 'creator' =
      p.publisher_type || (p.page_id ? 'page' : isPostOfficial ? 'official' : 'personal');

    let displayAuthor = profile?.display_name || p.author || 'Caribbean Member';
    let displayHandle = profile?.username || p.handle || 'member';
    let displayAvatar = profile?.avatar_url || p.avatarUrl || null;
    let isVerified = profile?.is_verified ?? p.verified ?? false;

    if (publisherType === 'page' && business) {
      displayAuthor = business.name;
      displayHandle = business.slug;
      displayAvatar = business.avatar_url || null;
      isVerified = business.is_verified ?? true;
    } else if (publisherType === 'official' || isPostOfficial) {
      displayAuthor = 'TUKUBI';
      displayHandle = 'tukubi';
      displayAvatar = profile?.avatar_url || '/brand/tukubi-emblem.png';
      isVerified = true;
    }

    const userReaction = userReactionsMap.get(p.id) || null;
    const isUserLiked = userReaction !== null || Boolean(p.isUserLiked);
    const isSaved = userSavedSet.has(p.id) || Boolean(p.isSaved);
    const isAuthorFavorited = authorId ? favoritedAuthorsSet.has(authorId) : false;

    return {
      id: p.id,
      authorId,
      author: displayAuthor,
      handle: displayHandle,
      avatarUrl: displayAvatar,
      verified: isVerified,
      isOfficial: isPostOfficial,
      isPinned: p.is_pinned ?? p.isPinned ?? false,
      officialContentType: p.official_content_type ?? p.officialContentType,
      publisherType,
      publisherId: p.publisher_entity_id || authorId,
      pageId: p.page_id || business?.id,
      pageSlug: business?.slug,
      pageName: business?.name,
      createdByUserId: p.created_by_user_id || authorId,
      communityId: p.community_id || p.communityId,
      communityName: community?.name,
      communitySlug: community?.slug,
      countryId: p.country_id || p.countryId,
      sharedPostId: p.shared_post_id,
      sharedPost: p.shared_post_id ? sharedPostsMap.get(p.shared_post_id) || null : null,
      shareCommentary: p.share_commentary,
      location: p.location_tag || p.location || defaultLocation,
      time: p.time || formatRelativeTime(p.created_at),
      content: p.content || '',
      mediaUrls: Array.isArray(p.media_urls)
        ? p.media_urls
        : Array.isArray(p.mediaUrls)
        ? p.mediaUrls
        : [],
      mediaItems: p.media_items || p.mediaItems,
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
      taggedProduct: p.taggedProduct || p.tagged_product,
      poll: p.poll,
      linkPreview: p.link_preview || p.linkPreview || null,
      linkPreviews: Array.isArray(p.link_previews) ? p.link_previews : (p.link_preview ? [p.link_preview] : []),
      isSponsored: p.isSponsored ?? false,
      adId: p.adId,
      headline: p.headline,
      destinationUrl: p.destinationUrl,
      ctaText: p.ctaText,
      bidCpmMinor: p.bidCpmMinor,
    };
  });
}
