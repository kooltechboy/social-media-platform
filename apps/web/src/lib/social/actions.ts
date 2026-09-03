'use server';

import { revalidatePath } from 'next/cache';
import { CaribAIEngine } from '@caribbean/ai';
import { validateComposer } from '@caribbean/social';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { ensureUserProfile } from '../auth/user-sync';

export interface PostActionState {
  error: string | null;
  postId?: string;
  post?: {
    id: string;
    author: string;
    handle: string;
    verified?: boolean;
    location?: string;
    time: string;
    content: string;
    mediaUrls?: string[];
    culturalTags?: string[];
    likes: number;
    reposts: number;
    comments: number;
    isOfficial?: boolean;
    isPinned?: boolean;
    officialContentType?: string;
    category?: 'caribbean' | 'foryou' | 'diaspora' | 'creator';
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
  const mediaUrlsRaw = formData.get('media_urls');
  const culturalTagsRaw = formData.get('cultural_tags');
  const visibility = (formData.get('visibility') as 'public' | 'followers' | 'friends' | 'private') || 'public';

  let mediaUrls: string[] = [];
  if (typeof mediaUrlsRaw === 'string' && mediaUrlsRaw.trim()) {
    try {
      mediaUrls = JSON.parse(mediaUrlsRaw);
    } catch {
      mediaUrls = mediaUrlsRaw.split(',').map((u) => u.trim()).filter(Boolean);
    }
  }

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

  // AI Content Safety Guard
  if (content) {
    try {
      const caribAI = new CaribAIEngine();
      const risk = await caribAI.classifyContentRisk(content);
      if (risk.score >= 0.85) {
        return { error: 'CaribAI flagged this content for safety review before publishing. Please revise it.' };
      }
    } catch {
      // Allow fallback if AI service is temporarily offline
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

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content: content || null,
      visibility,
      media_urls: mediaUrls,
      cultural_tags: culturalTags,
    })
    .select('id, content, created_at, media_urls, cultural_tags, likes_count, comments_count, shares_count, visibility, profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified)')
    .single();

  if (error) {
    console.error('[createPostAction] Database error creating post:', error);
    if (error.code === '23503') {
      return { error: "We couldn't link your profile to publish this post. Please refresh and try again." };
    }
    return { error: "We couldn't publish your post right now. Please try again." };
  }

  const rawProfile = data?.profiles;
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
  const isPostOfficial = profile?.username?.toLowerCase() === 'tukubi' || profile?.is_verified || false;

  const normalizedPost = {
    id: data.id,
    author: profile?.display_name || user.displayName || 'Caribbean Member',
    handle: profile?.username || user.username || 'member',
    verified: profile?.is_verified ?? true,
    isOfficial: isPostOfficial,
    isPinned: isPostOfficial,
    officialContentType: isPostOfficial ? 'welcome' : undefined,
    location: 'Caribbean 🌴',
    time: 'just now',
    content: data.content || '',
    mediaUrls: data.media_urls || [],
    culturalTags: data.cultural_tags || [],
    likes: data.likes_count || 0,
    reposts: data.shares_count || 0,
    comments: data.comments_count || 0,
    category: 'caribbean' as const,
  };

  revalidatePath('/');
  revalidatePath('/create');
  return { error: null, postId: data.id, post: normalizedPost };
}

/**
 * Creates a 24-hour ephemeral Moment / Story in public.stories.
 */
export async function createStoryAction(formData: FormData): Promise<{ success: boolean; story?: StoryData; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Please sign in to share a Moment.' };

  const mediaUrl = String(formData.get('media_url') ?? '').trim();
  const mediaKind = (formData.get('media_kind') as 'image' | 'video') || 'image';
  const caption = String(formData.get('caption') ?? '').trim() || null;
  const audience = (formData.get('audience') as 'public' | 'followers' | 'close_friends') || 'public';

  if (!mediaUrl) {
    return { success: false, error: 'Please select a photo or video for your Moment.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service is temporarily unavailable.' };

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
      media_path: mediaUrl,
      media_kind: mediaKind,
      caption,
      audience,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, author_id, media_path, media_kind, caption, audience, created_at, expires_at, profiles:profiles!stories_author_id_fkey(display_name, username, avatar_url)')
    .single();

  if (error) {
    console.error('[createStoryAction] Error inserting story:', error);
    if (error.code === '23503') {
      return { success: false, error: "We couldn't link your profile to publish this Moment. Please try again." };
    }
    return { success: false, error: "We couldn't publish your Moment right now. Please try again." };
  }

  const storyItem: StoryData = {
    id: data.id,
    authorId: data.author_id,
    authorName: (data.profiles as any)?.display_name || user.displayName,
    authorHandle: (data.profiles as any)?.username || user.username,
    authorAvatar: (data.profiles as any)?.avatar_url || user.avatarUrl,
    mediaUrl: data.media_path,
    mediaKind: data.media_kind,
    caption: data.caption || undefined,
    audience: data.audience,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    viewCount: 0,
    hasViewed: false,
  };

  revalidatePath('/');
  return { success: true, story: storyItem, error: null };
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
  const user = await getCurrentUser();
  if (!user) return { liked: false, likesCount: 0, error: 'Sign in to like posts.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { liked: false, likesCount: 0, error: 'Database is not configured.' };

  await ensureUserProfile(supabase, {
    id: user.id,
    email: user.email,
    user_metadata: { username: user.username, display_name: user.displayName, avatar_url: user.avatarUrl },
  });

  // Check if already liked
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    // Remove reaction
    await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', user.id);

    // Fetch updated count
    const { count } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    revalidatePath('/');
    return { liked: false, likesCount: count ?? 0, error: null };
  } else {
    // Add reaction
    await supabase.from('post_reactions').insert({
      post_id: postId,
      user_id: user.id,
      reaction_type: 'like',
    });

    const { count } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    revalidatePath('/');
    return { liked: true, likesCount: count ?? 1, error: null };
  }
}

export async function createCommentAction(
  postId: string,
  content: string,
  parentId?: string
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

  const insertPayload: any = {
    post_id: postId,
    author_id: user.id,
    content: cleanContent,
  };
  if (parentId) {
    insertPayload.parent_id = parentId;
  }

  const { data, error } = await supabase
    .from('comments')
    .insert(insertPayload)
    .select('id, post_id, author_id, parent_id, content, created_at, profiles(display_name, username, avatar_url)')
    .single();

  if (error) {
    console.error('[createCommentAction] Database error creating comment:', error);
    return { success: false, error: "Couldn't publish comment right now. Please try again." };
  }

  // Increment comments_count on posts
  const { data: currentPost } = await supabase
    .from('posts')
    .select('comments_count')
    .eq('id', postId)
    .maybeSingle();

  if (currentPost) {
    await supabase
      .from('posts')
      .update({ comments_count: (currentPost.comments_count || 0) + 1 })
      .eq('id', postId);
  }

  revalidatePath('/');
  return { success: true, comment: data, error: null };
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

  // Decrement comments_count on post if postId is available
  if (postId) {
    const { data: currentPost } = await supabase
      .from('posts')
      .select('comments_count')
      .eq('id', postId)
      .maybeSingle();

    if (currentPost && currentPost.comments_count > 0) {
      await supabase
        .from('posts')
        .update({ comments_count: Math.max(0, currentPost.comments_count - 1) })
        .eq('id', postId);
    }
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

  // If user is authenticated, record in post_shares table
  if (user) {
    await supabase.from('post_shares').insert({
      post_id: postId,
      user_id: user.id,
      share_type: shareType,
    });
  }

  // Fetch and increment current shares count
  const { data: post } = await supabase
    .from('posts')
    .select('shares_count')
    .eq('id', postId)
    .maybeSingle();

  const newCount = (post?.shares_count ?? 0) + 1;

  const { error } = await supabase
    .from('posts')
    .update({ shares_count: newCount })
    .eq('id', postId);

  if (error) {
    return { success: false, sharesCount: post?.shares_count ?? 0, error: error.message };
  }

  revalidatePath('/');
  return { success: true, sharesCount: newCount, error: null };
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
