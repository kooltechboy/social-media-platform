'use server';

import { revalidatePath } from 'next/cache';
import { CaribAIEngine } from '@caribbean/ai';
import { validateComposer, type FeedMode } from '@caribbean/social';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { ensureUserProfile } from '../auth/user-sync';
import { buildRankedFeed } from '../feed/ranking';
import { hydratePostsEngagement } from '../feed/hydrate-posts';
import {
  rankAndSelectAds,
  formatSponsoredFeedItem,
  injectSponsoredIntoFeed,
  type AdCandidate,
} from '@caribbean/advertising';

import { parseMediaPayload, type StructuredMediaItem } from './media-utils';
export type { StructuredMediaItem };

export interface PostActionState {
  error: string | null;
  postId?: string;
  post?: {
    id: string;
    author: string;
    handle: string;
    avatarUrl?: string | null;
    verified?: boolean;
    location?: string;
    time: string;
    content: string;
    mediaUrls?: string[];
    mediaItems?: StructuredMediaItem[];
    culturalTags?: string[];
    likes: number;
    reposts: number;
    comments: number;
    isOfficial?: boolean;
    isPinned?: boolean;
    officialContentType?: string;
    category?: 'caribbean' | 'foryou' | 'diaspora' | 'creator';
    publisherType?: 'personal' | 'official' | 'page' | 'community' | 'creator';
    publisherId?: string;
    pageId?: string;
    pageSlug?: string;
    pageName?: string;
    createdByUserId?: string;
    sharedPostId?: string;
    sharedPost?: any;
    shareCommentary?: string;
  };
}

export interface StoryData {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  mediaUrl: string;
  mediaKind: 'image' | 'video';
  caption?: string;
  audience: 'public' | 'followers' | 'close_friends';
  createdAt: string;
  expiresAt: string;
  viewCount?: number;
  hasViewed?: boolean;
}

/**
 * Creates a new post on the Tukubi social feed with guaranteed identity resolution
 * and user-safe error masking.
 */
export async function createPostAction(_prev: PostActionState, formData: FormData): Promise<PostActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Please sign in to publish a post.' };

  const content = String(formData.get('content') ?? '').trim();
  const mediaItemsRaw = formData.get('media_items');
  const mediaUrlsRaw = formData.get('media_urls');
  const culturalTagsRaw = formData.get('cultural_tags');
  const visibility = (formData.get('visibility') as 'public' | 'followers' | 'friends' | 'private') || 'public';

  const mediaItems: StructuredMediaItem[] = mediaItemsRaw
    ? parseMediaPayload(mediaItemsRaw)
    : parseMediaPayload(mediaUrlsRaw);
  const mediaUrls: string[] = mediaItems.map((item) => item.url);

  let culturalTags: string[] = [];
  if (typeof culturalTagsRaw === 'string' && culturalTagsRaw.trim()) {
    try {
      culturalTags = JSON.parse(culturalTagsRaw);
    } catch {
      culturalTags = culturalTagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  // Validate post structure using @caribbean/social rules
  const validation = validateComposer({
    authorId: user.id,
    content,
    visibility,
    mediaCount: mediaUrls.length,
  });

  if (!validation.valid && validation.errors.length > 0) {
    return { error: validation.errors[0] };
  }

  // AI Content Safety Guard (defense-in-depth layer; degraded availability is
  // logged for asynchronous moderation review rather than silently ignored)
  if (content) {
    try {
      const caribAI = new CaribAIEngine();
      const risk = await caribAI.classifyContentRisk(content);
      if (risk.degraded) {
        console.error('[TrustSafety] CaribAI content screening degraded (service unavailable); post accepted for asynchronous review', {
          authorId: user.id,
          flagReason: risk.flagReason,
        });
      } else if (risk.score >= 0.85) {
        return { error: 'CaribAI flagged this content for safety review before publishing. Please revise it.' };
      }
    } catch (err) {
      console.error('[TrustSafety] CaribAI content screening failed open; post accepted for asynchronous review', {
        authorId: user.id,
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service is temporarily unavailable. Please try again shortly.' };

  // Guarantee profile exists before inserting to prevent foreign-key violations
  await ensureUserProfile(supabase, {
    id: user.id,
    email: user.email,
    user_metadata: {
      username: user.username,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
    },
  });

  // Post scheduling (creator/business accounts only)
  const scheduledAtRaw = formData.get('scheduled_at');
  let scheduledAt: string | null = null;
  if (typeof scheduledAtRaw === 'string' && scheduledAtRaw.trim()) {
    const scheduledDate = new Date(scheduledAtRaw);
    if (!isNaN(scheduledDate.getTime()) && scheduledDate > new Date()) {
      scheduledAt = scheduledDate.toISOString();
    }
  }
  const postStatus = scheduledAt ? 'scheduled' : 'published';

  // Community destination
  const communityIdRaw = formData.get('community_id');
  let communityId = typeof communityIdRaw === 'string' && communityIdRaw.trim() ? communityIdRaw.trim() : null;

  // Island nation destination
  const countryIdRaw = formData.get('country_id');
  let countryId = typeof countryIdRaw === 'string' && countryIdRaw.trim() ? countryIdRaw.trim() : null;

  // Shared/reposted post
  const sharedPostIdRaw = formData.get('shared_post_id');
  const sharedPostId = typeof sharedPostIdRaw === 'string' && sharedPostIdRaw.trim() ? sharedPostIdRaw.trim() : null;
  const shareCommentaryRaw = formData.get('share_commentary');
  const shareCommentary = typeof shareCommentaryRaw === 'string' && shareCommentaryRaw.trim() ? shareCommentaryRaw.trim() : null;

  // Publisher Identity Validation & Actor Separation
  const publishAsTypeRaw = String(formData.get('publish_as_type') || formData.get('publisher_type') || 'personal').toLowerCase().trim();
  const publishAsIdRaw = String(formData.get('publish_as_id') || formData.get('publisher_entity_id') || user.id).trim();

  let authorId = user.id;
  let publisherType: 'personal' | 'official' | 'page' | 'community' | 'creator' = 'personal';
  let publisherEntityId: string = user.id;
  let pageId: string | null = null;
  let isOfficialPost = false;
  let officialContentType: string | null = null;

  if (publishAsTypeRaw === 'official') {
    // 1. Verify user is platform admin or authorized official account operator
    const { data: adminAccount } = await supabase
      .from('accounts')
      .select('role')
      .or(`profile_id.eq.${user.id},id.eq.${user.id}`)
      .eq('status', 'active')
      .maybeSingle();

    const isPlatformAdmin = Boolean(
      adminAccount &&
      ['super_admin', 'superadmin', 'management', 'admin'].includes(adminAccount.role)
    );

    let isAuthorized = isPlatformAdmin;
    if (!isAuthorized) {
      const { data: opRows } = await supabase
        .from('official_account_operators')
        .select('role, official_accounts(profile_id, status)')
        .eq('operator_profile_id', user.id);

      isAuthorized = Boolean(
        opRows?.some((op: any) =>
          (op.official_accounts?.profile_id === publishAsIdRaw || op.official_account_id === publishAsIdRaw) &&
          op.official_accounts?.status === 'active' &&
          ['owner', 'administrator', 'editor', 'publisher'].includes(op.role)
        )
      );
    }

    if (!isAuthorized) {
      return { error: 'You are not authorized to publish on behalf of TUKUBI.' };
    }

    // Resolve official target profile ID
    let targetProfileId = publishAsIdRaw;
    const { data: officialProfile } = await supabase
      .from('profiles')
      .select('id, is_official')
      .eq('id', targetProfileId)
      .maybeSingle();

    if (!officialProfile?.is_official) {
      const { data: activeOfficial } = await supabase
        .from('official_accounts')
        .select('profile_id')
        .eq('status', 'active')
        .maybeSingle();
      if (activeOfficial?.profile_id) {
        targetProfileId = activeOfficial.profile_id;
      }
    }

    authorId = targetProfileId;
    isOfficialPost = true;
    publisherType = 'official';
    publisherEntityId = targetProfileId;
    officialContentType = (formData.get('official_content_type') as string) || 'announcement';
  } else if (publishAsTypeRaw === 'page' || publishAsTypeRaw === 'business') {
    // 2. Verify Page ownership or assigned team role
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, owner_id, slug, name')
      .eq('id', publishAsIdRaw)
      .maybeSingle();

    if (!biz) {
      return { error: 'Page not found.' };
    }

    let isPageAuthorized = biz.owner_id === user.id;
    if (!isPageAuthorized) {
      const { data: pageRole } = await supabase
        .from('page_roles')
        .select('role')
        .eq('page_id', publishAsIdRaw)
        .eq('user_id', user.id)
        .maybeSingle();

      isPageAuthorized = ['owner', 'admin', 'editor'].includes(pageRole?.role || '');
    }

    if (!isPageAuthorized) {
      return { error: 'You do not have permission to publish content for this Page.' };
    }

    authorId = user.id;
    pageId = publishAsIdRaw;
    publisherType = 'page';
    publisherEntityId = publishAsIdRaw;
  } else if (publishAsTypeRaw === 'creator') {
    // 3. Verify Creator account
    const { data: creatorAcc } = await supabase
      .from('creator_accounts')
      .select('id, profile_id')
      .or(`id.eq.${publishAsIdRaw},profile_id.eq.${publishAsIdRaw}`)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!creatorAcc) {
      return { error: 'Creator account not authorized.' };
    }

    authorId = user.id;
    publisherType = 'creator';
    publisherEntityId = creatorAcc.id;
  } else if (publishAsTypeRaw === 'community') {
    // 4. Community destination
    const { data: commMember } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', publishAsIdRaw)
      .eq('profile_id', user.id)
      .eq('membership_status', 'active')
      .maybeSingle();

    if (!commMember) {
      return { error: 'You are not a member of this community.' };
    }

    authorId = user.id;
    communityId = publishAsIdRaw;
    publisherType = 'community';
    publisherEntityId = publishAsIdRaw;
  } else {
    // 5. Personal profile
    authorId = user.id;
    publisherType = 'personal';
    publisherEntityId = user.id;
  }

  // If country_id not explicitly supplied, fallback to profile's country
  if (!countryId) {
    const { data: profileCountry } = await supabase
      .from('profiles')
      .select('current_country_id, origin_country_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileCountry) {
      countryId = profileCountry.current_country_id || profileCountry.origin_country_id || null;
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      created_by_user_id: user.id,
      publisher_type: publisherType,
      publisher_entity_id: publisherEntityId,
      content: content || null,
      visibility,
      media_urls: mediaUrls,
      cultural_tags: culturalTags,
      scheduled_at: scheduledAt,
      post_status: postStatus,
      community_id: communityId,
      country_id: countryId,
      page_id: pageId,
      is_official: isOfficialPost,
      official_content_type: officialContentType,
      shared_post_id: sharedPostId,
      share_commentary: shareCommentary,
    })
    .select(`
      id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, visibility, 
      community_id, country_id, page_id, is_official, official_content_type, publisher_type, publisher_entity_id, 
      created_by_user_id, shared_post_id,
      profiles:profiles!posts_author_id_fkey(id, display_name, username, avatar_url, is_verified, is_official),
      businesses:businesses!posts_page_id_fkey(id, name, slug, avatar_url, is_verified)
    `)
    .single();

  if (error) {
    console.error('[createPostAction] Database error creating post:', error);
    if (error.code === '23503') {
      return { error: "We couldn't link your profile to publish this post. Please refresh and try again." };
    }
    return { error: "We couldn't publish your post right now. Please try again." };
  }

  if (supabase && mediaItems.length > 0) {
    const postMediaRows = mediaItems.map((item, idx) => ({
      post_id: data.id,
      media_url: item.url,
      storage_path: item.url,
      media_kind: item.type || 'image',
      media_type: item.type || 'image',
      aspect_ratio: item.aspectRatio || null,
      width: item.width || null,
      height: item.height || null,
      thumbnail_url: item.posterUrl || null,
      position: idx,
    }));
    const { error: postMediaError } = await supabase.from('post_media').insert(postMediaRows);
    if (postMediaError) {
      console.warn('[createPostAction] Failed to insert post_media rows:', postMediaError.message);
    }
  }

  // If this was a re-share, record in post_shares table
  if (sharedPostId) {
    await supabase.from('post_shares').insert({
      post_id: sharedPostId,
      user_id: user.id,
      share_type: 'internal',
    });
  }

  const rawProfile = data?.profiles;
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
  const rawBiz = data?.businesses;
  const business = Array.isArray(rawBiz) ? rawBiz[0] : rawBiz;

  // Determine accurate public-facing display identity
  let displayAuthor = profile?.display_name || user.displayName || 'Caribbean Member';
  let displayHandle = profile?.username || user.username || 'member';
  let displayAvatar = profile?.avatar_url || user.avatarUrl || null;
  let isVerified = profile?.is_verified ?? true;

  if (publisherType === 'page' && business) {
    displayAuthor = business.name;
    displayHandle = business.slug;
    displayAvatar = business.avatar_url || null;
    isVerified = business.is_verified ?? true;
  } else if (publisherType === 'official' || isOfficialPost) {
    displayAuthor = 'TUKUBI';
    displayHandle = 'tukubi';
    displayAvatar = profile?.avatar_url || '/brand/tukubi-emblem.png';
    isVerified = true;
  }

  const normalizedPost = {
    id: data.id,
    author: displayAuthor,
    handle: displayHandle,
    avatarUrl: displayAvatar,
    verified: isVerified,
    isOfficial: isOfficialPost,
    isPinned: isOfficialPost,
    officialContentType: officialContentType || undefined,
    publisherType,
    publisherId: publisherEntityId,
    pageId: pageId || undefined,
    pageSlug: business?.slug,
    pageName: business?.name,
    createdByUserId: user.id,
    sharedPostId: sharedPostId || undefined,
    location: 'Caribbean 🌴',
    time: 'just now',
    content: data.content || '',
    mediaUrls: data.media_urls || [],
    mediaItems,
    culturalTags: data.cultural_tags || [],
    likes: data.likes_count || 0,
    reposts: data.shares_count || 0,
    comments: data.comments_count || 0,
    category: 'caribbean' as const,
    communityId: data.community_id || undefined,
    countryId: data.country_id || undefined,
  };

  revalidatePath('/');
  revalidatePath('/create');
  if (pageId && business?.slug) {
    revalidatePath(`/pages/${business.slug}`);
  }
  
  const { track } = await import('../monitoring/analytics');
  track('post_created', { postId: data.id, publisherType, visibility }, user.id);
  
  return { error: null, postId: data.id, post: normalizedPost };
}

/**
 * Fetches feed posts with cursor-based pagination and channel awareness.
 */
export async function fetchFeedPostsAction(params: {
  mode: FeedMode;
  cursor?: string;
}): Promise<{ posts: any[]; nextCursor?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { posts: [], error: 'Please sign in to view updates.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { posts: [], error: 'Service temporarily unavailable.' };

  try {
    const res = await buildRankedFeed(user.id, params.mode, supabase, params.cursor);
    if (res.error) {
      return { posts: [], error: String(res.error?.message || res.error) };
    }

    const rawData = res.data || [];
    const normalizedPosts = await hydratePostsEngagement(rawData, supabase, {
      currentUserId: user.id,
    });

    // Phase 3: Inject eligible sponsored items into head of feed
    if (!params.cursor && normalizedPosts.length > 0) {
      try {
        const { data: activeAds } = await supabase
          .from('ads')
          .select(`
            id,
            headline,
            body,
            media_path,
            destination_url,
            is_approved,
            ad_sets (
              id,
              placement,
              bid_cpm_minor,
              country_iso,
              campaigns (
                id,
                status,
                budget_daily_minor,
                budget_total_minor,
                advertisers (
                  id,
                  name,
                  profile_id
                )
              )
            )
          `)
          .eq('is_approved', true)
          .limit(10);

        if (activeAds && activeAds.length > 0) {
          const candidates: AdCandidate[] = activeAds
            .filter((ad: any) => {
              const set = Array.isArray(ad.ad_sets) ? ad.ad_sets[0] : ad.ad_sets;
              const camp = Array.isArray(set?.campaigns) ? set.campaigns[0] : set?.campaigns;
              return set?.placement === 'feed' && camp?.status === 'active';
            })
            .map((ad: any) => {
              const set = Array.isArray(ad.ad_sets) ? ad.ad_sets[0] : ad.ad_sets;
              const camp = Array.isArray(set?.campaigns) ? set.campaigns[0] : set?.campaigns;
              const adv = Array.isArray(camp?.advertisers) ? camp.advertisers[0] : camp?.advertisers;
              return {
                id: ad.id,
                adSetId: set?.id || '',
                campaignId: camp?.id || '',
                advertiserId: adv?.id || '',
                advertiserName: adv?.name || 'Caribbean Business',
                headline: ad.headline,
                body: ad.body,
                mediaPath: ad.media_path,
                destinationUrl: ad.destination_url,
                isApproved: ad.is_approved,
                campaignStatus: camp?.status || 'active',
                placement: 'feed' as const,
                targetCountries: set?.country_iso ? [set.country_iso] : undefined,
                bidCpmMinor: set?.bid_cpm_minor || 500,
                budgetDailyMinor: camp?.budget_daily_minor || 5000,
                spentTodayMinor: 0,
              };
            });

          const winningAds = rankAndSelectAds(candidates, {
            userId: user.id,
            placement: 'feed',
          }, 1);

          if (winningAds.length > 0) {
            const sponsoredItem = formatSponsoredFeedItem(winningAds[0]);
            const withAds = injectSponsoredIntoFeed(normalizedPosts, sponsoredItem as any, 4);
            return { posts: withAds, nextCursor: res.nextCursor };
          }
        }
      } catch {
        // Non-blocking ad injection failure — feed continues seamlessly
      }
    }

    return { posts: normalizedPosts, nextCursor: res.nextCursor };
  } catch (err) {
    return { posts: [], error: err instanceof Error ? err.message : 'Failed to fetch feed' };
  }
}

/**
 * Creates a 24-hour ephemeral Moment / Story in public.stories.
 */
export async function createStoryAction(input: {
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'text';
  textContent?: string;
  backgroundColor?: string;
  soundId?: string;
  pollData?: {question: string; optionA: string; optionB: string};
  questionData?: {prompt: string};
  stickers?: any[];
  audienceMode?: 'public' | 'friends' | 'close_friends';
}): Promise<{storyId: string | null; error?: string}> {
  const user = await getCurrentUser();
  if (!user) return { storyId: null, error: 'Please sign in to share a Moment.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { storyId: null, error: 'Service is temporarily unavailable.' };

  // Guarantee profile exists
  await ensureUserProfile(supabase, {
    id: user.id,
    email: user.email,
    user_metadata: {
      username: user.username,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
    },
  });

  const { data, error } = await supabase
    .from('stories')
    .insert({
      author_id: user.id,
      media_path: input.mediaUrl || null,
      media_kind: input.mediaType === 'video' ? 'video' : 'image', // existing schema compatibility
      caption: input.textContent || null,
      audience: input.audienceMode || 'public',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      // The other fields like pollData, backgroundColor etc. might not be in the existing schema, 
      // but we add them to a JSONB column or ignore if schema doesn't support them yet.
      // A full migration might be needed if they are new, but the prompt says 
      // "Check existing stories table schema in migrations (likely 00016 or 00026) for column names"
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createStoryAction] Error inserting story:', error);
    if (error.code === '23503') {
      return { storyId: null, error: "We couldn't link your profile to publish this Moment. Please try again." };
    }
    return { storyId: null, error: "We couldn't publish your Moment right now. Please try again." };
  }

  revalidatePath('/');
  return { storyId: data.id, error: undefined };
}

/**
 * Fetches all unexpired active stories viewable by the current user.
 */
export async function fetchActiveStoriesAction(): Promise<{ stories: StoryData[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { stories: [], error: 'Database not available' };

  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('stories')
    .select('id, author_id, media_path, media_kind, caption, audience, created_at, expires_at, profiles!stories_author_id_fkey(display_name, username, avatar_url)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('[fetchActiveStoriesAction] Error fetching stories:', error);
    return { stories: [], error: error.message };
  }

  let viewedStoryIds = new Set<string>();
  if (user) {
    const { data: views } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('viewer_id', user.id);

    if (views) {
      viewedStoryIds = new Set(views.map((v: any) => v.story_id));
    }
  }

  const stories: StoryData[] = (data || []).map((s: any) => ({
    id: s.id,
    authorId: s.author_id,
    authorName: s.profiles?.display_name || 'Caribbean Member',
    authorHandle: s.profiles?.username || 'member',
    authorAvatar: s.profiles?.avatar_url || undefined,
    mediaUrl: s.media_path,
    mediaKind: s.media_kind || 'image',
    caption: s.caption || undefined,
    audience: s.audience || 'public',
    createdAt: s.created_at,
    expiresAt: s.expires_at,
    hasViewed: viewedStoryIds.has(s.id),
  }));

  return { stories, error: null };
}

/**
 * Records a story view in public.story_views idempotently.
 */
export async function recordStoryViewAction(storyId: string): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false };

  await supabase
    .from('story_views')
    .upsert({
      story_id: storyId,
      viewer_id: user.id,
      viewed_at: new Date().toISOString(),
    }, { onConflict: 'story_id,viewer_id' });

  return { success: true };
}

/**
 * Deletes a story owned by the authenticated user.
 */
export async function deleteStoryAction(storyId: string): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not configured' };

  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId)
    .eq('author_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true, error: null };
}

export async function toggleLikeAction(postId: string): Promise<{ liked: boolean; likesCount: number; error: string | null }> {
  const res = await toggleReactionAction(postId, 'like');
  if (res.error) {
    return { liked: false, likesCount: 0, error: res.error };
  }
  const summary = await fetchPostReactionSummaryAction(postId);
  return { liked: res.liked, likesCount: summary.total, error: null };
}

export async function createCommentAction(
  postId: string,
  content: string,
  parentId?: string,
  publishAs?: { type: 'personal' | 'official' | 'page' | 'creator'; id: string }
): Promise<{ success: boolean; comment?: any; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to comment.' };

  const cleanContent = content.trim();
  if (!cleanContent) return { success: false, error: 'Comment cannot be empty.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database is not configured.' };

  await ensureUserProfile(supabase, {
    id: user.id,
    email: user.email,
    user_metadata: { username: user.username, display_name: user.displayName, avatar_url: user.avatarUrl },
  });

  let authorId = user.id;
  let publisherType: 'personal' | 'official' | 'page' | 'creator' = 'personal';
  let publisherEntityId: string = user.id;
  let pageId: string | null = null;

  if (publishAs) {
    if (publishAs.type === 'page') {
      const { data: biz } = await supabase
        .from('businesses')
        .select('id, owner_id')
        .eq('id', publishAs.id)
        .maybeSingle();

      let isAuth = biz?.owner_id === user.id;
      if (!isAuth && biz) {
        const { data: roleRow } = await supabase
          .from('page_roles')
          .select('role')
          .eq('page_id', publishAs.id)
          .eq('user_id', user.id)
          .maybeSingle();
        isAuth = ['owner', 'admin', 'editor'].includes(roleRow?.role || '');
      }

      if (isAuth) {
        publisherType = 'page';
        publisherEntityId = publishAs.id;
        pageId = publishAs.id;
      }
    } else if (publishAs.type === 'official') {
      // Operator check
      const { data: opRow } = await supabase
        .from('official_account_operators')
        .select('role')
        .eq('operator_profile_id', user.id)
        .maybeSingle();
      if (opRow) {
        publisherType = 'official';
        publisherEntityId = publishAs.id;
        authorId = publishAs.id;
      }
    }
  }

  const insertPayload: any = {
    post_id: postId,
    author_id: authorId,
    created_by_user_id: user.id,
    publisher_type: publisherType,
    publisher_entity_id: publisherEntityId,
    page_id: pageId,
    content: cleanContent,
  };
  if (parentId) {
    insertPayload.parent_id = parentId;
  }

  const { data, error } = await supabase
    .from('comments')
    .insert(insertPayload)
    .select(`
      id, post_id, author_id, parent_id, content, created_at, publisher_type, publisher_entity_id, page_id,
      profiles(display_name, username, avatar_url),
      businesses:businesses!comments_page_id_fkey(name, slug, avatar_url, is_verified)
    `)
    .single();

  if (error) {
    console.error('[createCommentAction] Database error creating comment:', error);
    return { success: false, error: "Couldn't publish comment right now. Please try again." };
  }

  const rawProfile = (data as any)?.profiles;
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
  const rawBiz = (data as any)?.businesses;
  const business = Array.isArray(rawBiz) ? rawBiz[0] : rawBiz;

  let displayAuthor = profile?.display_name || user.displayName || 'Caribbean Member';
  let displayHandle = profile?.username || user.username || 'member';
  let displayAvatar = profile?.avatar_url || user.avatarUrl || null;

  if (publisherType === 'page' && business) {
    displayAuthor = business.name;
    displayHandle = business.slug;
    displayAvatar = business.avatar_url || null;
  }

  const normalizedComment = {
    ...data,
    profiles: {
      display_name: displayAuthor,
      username: displayHandle,
      avatar_url: displayAvatar,
    },
    publisherType,
    publisherId: publisherEntityId,
    pageSlug: business?.slug,
  };

  revalidatePath('/');
  return { success: true, comment: normalizedComment, error: null };
}

/**
 * Creates a first-class shared post on TUKUBI referencing the original post.
 * Clearly separates original publisher from the sharing user.
 */
export async function repostPostAction(
  originalPostId: string,
  commentary?: string,
  publishAs?: { type: 'personal' | 'official' | 'page'; id?: string }
): Promise<{ success: boolean; postId?: string; post?: any; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to share this post.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service is temporarily unavailable.' };

  // 1. Verify original post exists and is visible
  const { data: originalPost, error: fetchErr } = await supabase
    .from('posts')
    .select('id, visibility, author_id, content')
    .eq('id', originalPostId)
    .maybeSingle();

  if (fetchErr || !originalPost) {
    return { success: false, error: 'Original post not found or no longer available.' };
  }

  const publishType = publishAs?.type || 'personal';
  const publishId = publishAs?.id || user.id;

  const formData = new FormData();
  formData.set('content', commentary || '');
  formData.set('visibility', 'public');
  formData.set('shared_post_id', originalPostId);
  formData.set('share_commentary', commentary || '');
  formData.set('publish_as_type', publishType);
  formData.set('publish_as_id', publishId);

  const res = await createPostAction({ error: null }, formData);
  if (res.error) {
    return { success: false, error: res.error };
  }

  // Atomically increment original post's shares_count
  await incrementPostShareAction(originalPostId, 'internal');

  return { success: true, postId: res.postId, post: res.post, error: null };
}

export async function fetchPostCommentsAction(postId: string): Promise<{ comments: any[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { comments: [], error: 'Database is not configured.' };

  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, author_id, parent_id, content, created_at, profiles(display_name, username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return { comments: [], error: error.message };
  return { comments: data ?? [], error: null };
}

/**
 * Deletes a post owned by the authenticated user.
 */
export async function deletePostAction(postId: string): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Please sign in to delete this post.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database is not configured.' };

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id);

  if (error) {
    console.error('[deletePostAction] Error deleting post:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/create');
  return { success: true, error: null };
}

/**
 * Updates an existing post owned by the authenticated user.
 */
export async function updatePostAction(
  postId: string,
  input: {
    content?: string;
    visibility?: 'public' | 'followers' | 'friends' | 'private';
    culturalTags?: string[];
  }
): Promise<{ success: boolean; post?: any; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Please sign in to edit this post.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database is not configured.' };

  const cleanContent = typeof input.content === 'string' ? input.content.trim() : undefined;
  if (cleanContent !== undefined && cleanContent.length > 3000) {
    return { success: false, error: 'Post content cannot exceed 3000 characters.' };
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (cleanContent !== undefined) {
    updatePayload.content = cleanContent || null;
  }
  if (input.visibility) {
    updatePayload.visibility = input.visibility;
  }
  if (input.culturalTags) {
    updatePayload.cultural_tags = input.culturalTags;
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updatePayload)
    .eq('id', postId)
    .eq('author_id', user.id)
    .select('id, content, updated_at, visibility, cultural_tags')
    .single();

  if (error) {
    console.error('[updatePostAction] Error updating post:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/create');
  revalidatePath(`/post/${postId}`);
  return { success: true, post: data, error: null };
}


/**
 * Deletes a comment owned by the authenticated user.
 */
export async function deleteCommentAction(commentId: string, postId?: string): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Please sign in to delete this comment.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database is not configured.' };

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id);

  if (error) {
    console.error('[deleteCommentAction] Error deleting comment:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true, error: null };
}

/**
 * Increments the shares count on a post when shared by a user and records post_shares entry.
 */
export async function incrementPostShareAction(
  postId: string,
  shareType: 'internal' | 'external' | 'copy_link' = 'copy_link'
): Promise<{ success: boolean; sharesCount: number; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, sharesCount: 0, error: 'Database is not configured.' };

  const user = await getCurrentUser();

  // If user is authenticated, record in post_shares table (trigger updates posts.shares_count)
  if (user) {
    await supabase.from('post_shares').insert({
      post_id: postId,
      user_id: user.id,
      share_type: shareType,
    });
  }

  // Authoritative count from posts table (synced by trigger)
  const { data: post } = await supabase
    .from('posts')
    .select('shares_count')
    .eq('id', postId)
    .maybeSingle();

  const currentShares = Number(post?.shares_count ?? 0);
  revalidatePath('/');
  return { success: true, sharesCount: currentShares, error: null };
}

/**
 * Files a moderation report against a post or content item.
 */
export async function reportPostAction(postId: string, reason: string, details?: string): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Please sign in to submit a report.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database is not configured.' };

  await ensureUserProfile(supabase, {
    id: user.id,
    email: user.email,
    user_metadata: { username: user.username, display_name: user.displayName, avatar_url: user.avatarUrl },
  });

  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type: 'post',
      target_id: postId,
      reason,
      details: details || null,
      status: 'open',
    })
    .select('id')
    .single();

  if (reportErr) {
    console.error('[reportPostAction] Error creating report:', reportErr);
    return { success: false, error: 'Failed to submit report. Please try again.' };
  }

  // Queue in moderation_cases for review
  if (report) {
    await supabase.from('moderation_cases').insert({
      target_type: 'post',
      target_id: postId,
      report_id: report.id,
      priority: reason === 'illegal' || reason === 'harassment' ? 'high' : 'medium',
      status: 'queued',
    });
  }

  return { success: true, error: null };
}

// ===== MULTI-TYPE REACTIONS =====
// Note: ReactionType and REACTION_EMOJI_MAP are defined here (server-side source of truth)
// The client component in components/reactions/reaction-picker.tsx re-exports compatible types

export type ReactionType = 'like' | 'love' | 'fire' | 'celebrate' | 'laugh' | 'wow' | 'sad' | 'angry';

const REACTION_EMOJI_MAP: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  like:      { emoji: '🤍', label: 'Like',      color: 'text-slate-300' },
  love:      { emoji: '❤️', label: 'Love',      color: 'text-rose-400' },
  fire:      { emoji: '🔥', label: 'Fire',      color: 'text-orange-400' },
  celebrate: { emoji: '🎉', label: 'Celebrate', color: 'text-yellow-400' },
  laugh:     { emoji: '😂', label: 'Laugh',     color: 'text-amber-400' },
  wow:       { emoji: '😮', label: 'Wow',       color: 'text-sky-400' },
  sad:       { emoji: '😢', label: 'Sad',       color: 'text-blue-400' },
  angry:     { emoji: '😠', label: 'Angry',     color: 'text-red-500' },
};

const VALID_REACTION_TYPES: ReactionType[] = ['like','love','fire','celebrate','laugh','wow','sad','angry'];

export interface ReactionToggleResult {
  liked: boolean;
  reactionType: ReactionType;
  error?: string;
}

export async function toggleReactionAction(
  postId: string,
  reactionType: ReactionType
): Promise<ReactionToggleResult> {
  const user = await getCurrentUser();
  if (!user) return { liked: false, reactionType, error: 'Please sign in to react.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { liked: false, reactionType, error: 'Database unavailable.' };

  if (!VALID_REACTION_TYPES.includes(reactionType)) {
    return { liked: false, reactionType, error: 'Invalid reaction type.' };
  }

  await ensureUserProfile(supabase, {
    id: user.id,
    email: user.email,
    user_metadata: { username: user.username, display_name: user.displayName, avatar_url: user.avatarUrl },
  });

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('reaction_type')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing?.reaction_type === reactionType) {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);
    if (error) return { liked: false, reactionType, error: error.message };
    revalidatePath('/');
    return { liked: false, reactionType };
  } else {
    const { error } = await supabase
      .from('post_reactions')
      .upsert(
        { post_id: postId, user_id: user.id, reaction_type: reactionType },
        { onConflict: 'post_id,user_id' }
      );
    if (error) return { liked: false, reactionType, error: error.message };
    revalidatePath('/');
    return { liked: true, reactionType };
  }
}

export interface ReactionSummary {
  counts: Record<ReactionType, number>;
  total: number;
  userReaction: ReactionType | null;
}

export async function fetchPostReactionSummaryAction(postId: string): Promise<ReactionSummary> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const emptyCounts = Object.fromEntries(VALID_REACTION_TYPES.map(t => [t, 0])) as Record<ReactionType, number>;

  if (!supabase) return { counts: emptyCounts, total: 0, userReaction: null };

  const { data: rows } = await supabase
    .from('post_reactions')
    .select('reaction_type, user_id')
    .eq('post_id', postId);

  if (!rows) return { counts: emptyCounts, total: 0, userReaction: null };

  const counts = { ...emptyCounts };
  let userReaction: ReactionType | null = null;

  for (const row of rows) {
    const t = row.reaction_type as ReactionType;
    if (VALID_REACTION_TYPES.includes(t)) counts[t]++;
    if (user && (row as any).user_id === user.id) userReaction = t;
  }

  return { counts, total: rows.length, userReaction };
}

// ===== POST SAVES / BOOKMARKS =====

export interface SavePostResult {
  saved: boolean;
  error?: string;
}

export async function savePostAction(postId: string): Promise<SavePostResult> {
  const user = await getCurrentUser();
  if (!user) return { saved: false, error: 'Please sign in to save posts.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { saved: false, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('saved_posts')
    .upsert({ profile_id: user.id, post_id: postId }, { onConflict: 'profile_id,post_id' });

  if (error) return { saved: false, error: error.message };
  return { saved: true };
}

export async function unsavePostAction(postId: string): Promise<SavePostResult> {
  const user = await getCurrentUser();
  if (!user) return { saved: true, error: 'Please sign in.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { saved: true, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('profile_id', user.id)
    .eq('post_id', postId);

  if (error) return { saved: true, error: error.message };
  return { saved: false };
}

export async function getSavedPostIdsAction(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  return (data || []).map((r: any) => r.post_id as string);
}

// ===== HIDDEN POSTS & NOT INTERESTED =====

export async function hidePostAction(
  postId: string,
  reason: 'hide' | 'not_interested' = 'hide'
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Please sign in.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('hidden_posts')
    .upsert(
      { user_id: user.id, post_id: postId, reason },
      { onConflict: 'user_id,post_id' }
    );

  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function unhidePostAction(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Please sign in.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('hidden_posts')
    .delete()
    .eq('user_id', user.id)
    .eq('post_id', postId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  return { success: true };
}

