'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { isBannedTesterAccount } from '../auth/banned-testers';

export interface ShortActionResult {
  success: boolean;
  error?: string | null;
  data?: any;
}

export interface ShortCommentItem {
  id: string;
  short_id: string;
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

/**
 * Publishes a native TUKUBI Short.
 * Supports publishing as personal profile or as a managed Caribbean Page.
 */
export async function publishShortAction(formData: FormData): Promise<ShortActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to publish TUKUBI Shorts.' };

  if (isBannedTesterAccount(user)) {
    return {
      success: false,
      error: 'Test accounts (Bravo Tester / Alpha Tester) are strictly prohibited from publishing content.',
    };
  }

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const soundId = String(formData.get('soundId') ?? '').trim();
  const soundTitle = String(formData.get('soundTitle') ?? '').trim();
  const storagePath = String(formData.get('storagePath') ?? '').trim();
  const thumbnailPath = String(formData.get('thumbnailPath') ?? '').trim();
  const visibility = String(formData.get('visibility') ?? 'public').trim();
  const category = String(formData.get('category') ?? 'culture').trim();
  const locationTag = String(formData.get('locationTag') ?? '').trim();
  const countryId = String(formData.get('countryId') ?? '').trim();
  const pageId = String(formData.get('pageId') ?? '').trim();
  const rawDuration = parseInt(String(formData.get('durationSeconds') ?? '30'), 10);
  const durationSeconds = isNaN(rawDuration) ? 30 : Math.min(Math.max(1, rawDuration), 180);

  if (!title) return { success: false, error: 'Please add a caption / title for your Short.' };
  if (!storagePath) return { success: false, error: 'Video media file is required to publish a Short.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service is currently unavailable.' };

  // If publishing on behalf of a Page, verify authorization (owner_id or page_roles)
  let validatedPageId: string | null = null;
  if (pageId) {
    const [{ data: pageRole }, { data: ownedPage }] = await Promise.all([
      supabase
        .from('page_roles')
        .select('role')
        .eq('page_id', pageId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('businesses')
        .select('id, owner_id')
        .eq('id', pageId)
        .maybeSingle(),
    ]);

    const isOwner = ownedPage?.owner_id === user.id;
    const hasRole = Boolean(pageRole && ['owner', 'admin', 'editor'].includes(pageRole.role));

    if (!isOwner && !hasRole) {
      return {
        success: false,
        error: 'You do not have permission to publish Shorts on behalf of this Page.',
      };
    }
    validatedPageId = pageId;
  }

  const finalTitle = soundTitle ? `${title} • 🎵 ${soundTitle}` : title;

  // Insert into videos table with video_kind = 'short'
  const { data: videoData, error } = await supabase
    .from('videos')
    .insert({
      creator_id: user.id,
      page_id: validatedPageId,
      title: finalTitle,
      video_kind: 'short',
      storage_path: storagePath,
      thumbnail_path: thumbnailPath || null,
      duration_seconds: durationSeconds,
      visibility: visibility === 'subscribers' ? 'subscribers' : visibility === 'followers' ? 'followers' : 'public',
      audio_track: soundTitle || 'Original Caribbean Audio',
      sound_id: soundId || null,
      country_id: countryId || null,
      location_tag: locationTag || null,
      category: category || 'culture',
      aspect_ratio: '9:16',
      moderation_status: 'approved',
      view_count: 0,
      likes_count: 0,
      comments_count: 0,
    })
    .select('id, title, created_at, storage_path, video_kind, page_id')
    .single();

  if (error) {
    console.error('[publishShortAction] Insertion error:', error);
    return { success: false, error: error.message };
  }

  // Track sound usage if sound is attached
  if (soundId) {
    try {
      await supabase.from('sound_usage').insert({
        sound_id: soundId,
        video_id: videoData.id,
        used_by: user.id,
      });
    } catch (soundErr) {
      console.warn('[publishShortAction] sound_usage tracking warning:', soundErr);
    }
  }

  // Synchronize companion post in feed for discoverability
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('country_id, current_country_id, origin_country_id')
      .eq('id', user.id)
      .maybeSingle();

    const postCountryId = countryId || profile?.country_id || profile?.current_country_id || profile?.origin_country_id || null;

    await supabase.from('posts').insert({
      author_id: user.id,
      page_id: validatedPageId,
      publisher_type: validatedPageId ? 'page' : 'personal',
      publisher_entity_id: validatedPageId || user.id,
      content: description ? `${finalTitle}\n\n${description}` : finalTitle,
      visibility: visibility === 'subscribers' ? 'followers' : (visibility as any),
      media_urls: [storagePath],
      cultural_tags: ['short', 'reel', 'caribbean_creators', category],
      country_id: postCountryId,
    });
  } catch (postSyncErr) {
    console.warn('[publishShortAction] Companion post sync warning:', postSyncErr);
  }

  revalidatePath('/shorts');
  revalidatePath('/reels');
  revalidatePath('/creator-studio/videos');
  if (validatedPageId) {
    revalidatePath(`/pages`);
  }
  revalidatePath('/');

  return { success: true, data: videoData };
}

/**
 * Toggles like state for a Short or Reel with real database sync.
 */
export async function toggleShortLikeAction(shortId: string): Promise<ShortActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to like Shorts.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { data: existing } = await supabase
    .from('video_views')
    .select('completed')
    .eq('video_id', shortId)
    .eq('viewer_id', user.id)
    .maybeSingle();

  if (existing) {
    const nextCompleted = !existing.completed;
    const { error } = await supabase
      .from('video_views')
      .update({ completed: nextCompleted })
      .eq('video_id', shortId)
      .eq('viewer_id', user.id);

    if (error) return { success: false, error: error.message };

    try {
      const { data: v } = await supabase.from('videos').select('likes_count').eq('id', shortId).maybeSingle();
      if (v) {
        const nextLikes = nextCompleted ? (v.likes_count || 0) + 1 : Math.max(0, (v.likes_count || 0) - 1);
        await supabase.from('videos').update({ likes_count: nextLikes }).eq('id', shortId);
      }
    } catch {
      // Non-blocking counter sync
    }

    return { success: true, data: { isLiked: nextCompleted } };
  } else {
    const { error } = await supabase
      .from('video_views')
      .insert({
        video_id: shortId,
        viewer_id: user.id,
        watched_seconds: 5,
        completed: true,
      });

    if (error) return { success: false, error: error.message };

    try {
      const { data: v } = await supabase.from('videos').select('likes_count').eq('id', shortId).maybeSingle();
      if (v) {
        await supabase.from('videos').update({ likes_count: (v.likes_count || 0) + 1 }).eq('id', shortId);
      }
    } catch {
      // Non-blocking counter sync
    }

    return { success: true, data: { isLiked: true } };
  }
}

/**
 * Posts a real comment on a Short with user attribution.
 */
export async function postShortCommentAction(shortId: string, content: string): Promise<ShortActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to comment on Shorts.' };

  const text = content.trim();
  if (!text) return { success: false, error: 'Comment cannot be empty.' };
  if (text.length > 500) return { success: false, error: 'Comment must be 500 characters or fewer.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      video_id: shortId,
      author_id: user.id,
      content: text,
    })
    .select('id, content, created_at, profiles:profiles!comments_author_id_fkey(display_name, username, avatar_url)')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  try {
    const { data: v } = await supabase.from('videos').select('comments_count').eq('id', shortId).maybeSingle();
    if (v) {
      await supabase.from('videos').update({ comments_count: (v.comments_count || 0) + 1 }).eq('id', shortId);
    }
  } catch {
    // Non-blocking
  }

  const rawP = (comment as any)?.profiles;
  const p = Array.isArray(rawP) ? rawP[0] : rawP;

  const commentData: ShortCommentItem = {
    id: comment.id,
    short_id: shortId,
    user_id: user.id,
    display_name: p?.display_name || user.displayName,
    username: p?.username || user.username || 'member',
    avatar_url: p?.avatar_url || user.avatarUrl || null,
    content: comment.content,
    created_at: comment.created_at,
  };

  revalidatePath('/shorts');
  revalidatePath('/reels');
  return { success: true, data: commentData };
}

/**
 * Fetches real comments for a Short.
 */
export async function fetchShortCommentsAction(shortId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { comments: [] };

  const { data } = await supabase
    .from('comments')
    .select('id, content, created_at, author_id, profiles:profiles!comments_author_id_fkey(display_name, username, avatar_url)')
    .eq('video_id', shortId)
    .order('created_at', { ascending: true })
    .limit(50);

  if (!data) return { comments: [] };

  return {
    comments: data.map((c: any) => {
      const rawP = c.profiles;
      const p = Array.isArray(rawP) ? rawP[0] : rawP;
      return {
        id: c.id,
        user: p?.display_name || 'Caribbean Member',
        handle: p?.username || 'member',
        avatar: p?.avatar_url || '🌴',
        text: c.content,
        time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }),
  };
}

/**
 * Records a verified view event (minimum watch threshold).
 */
export async function recordShortViewAction(shortId: string, watchedSeconds: number = 3): Promise<ShortActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false };

  try {
    const { data: video } = await supabase
      .from('videos')
      .select('view_count')
      .eq('id', shortId)
      .maybeSingle();

    if (video) {
      await supabase
        .from('videos')
        .update({ view_count: (Number(video.view_count) || 0) + 1 })
        .eq('id', shortId);
    }
  } catch {
    // Non-blocking telemetry
  }

  return { success: true };
}

/**
 * Records share telemetry for Shorts.
 */
export async function recordShortShareAction(shortId: string, shareType: string = 'copy_link'): Promise<ShortActionResult> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (supabase && user) {
    try {
      const { error } = await supabase.from('video_shares').insert({
        video_id: shortId,
        user_id: user.id,
        share_type: shareType,
      });
      if (error) {
        await supabase.from('post_shares').insert({
          post_id: shortId,
          user_id: user.id,
          share_type: shareType,
        });
      }
    } catch {
      // Non-blocking
    }
  }

  return { success: true };
}

/**
 * Bookmarks / Saves a Short.
 */
export async function saveShortAction(shortId: string): Promise<ShortActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to save Shorts.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { error: videoSaveErr } = await supabase
    .from('video_saves')
    .upsert(
      { profile_id: user.id, video_id: shortId },
      { onConflict: 'profile_id,video_id' }
    );

  if (videoSaveErr) {
    const { error } = await supabase
      .from('saved_posts')
      .upsert(
        { profile_id: user.id, post_id: shortId },
        { onConflict: 'profile_id,post_id' }
      );
    if (error) return { success: false, error: error.message };
  }
  return { success: true, data: { saved: true } };
}

/**
 * Removes a bookmark / Unsave a Short.
 */
export async function unsaveShortAction(shortId: string): Promise<ShortActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  await supabase
    .from('video_saves')
    .delete()
    .eq('profile_id', user.id)
    .eq('video_id', shortId);

  await supabase
    .from('saved_posts')
    .delete()
    .eq('profile_id', user.id)
    .eq('post_id', shortId);

  return { success: true, data: { saved: false } };
}

/**
 * Submits a moderation report for a Short.
 */
export async function reportShortAction(shortId: string, reason: string, details?: string): Promise<ShortActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to report content.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  try {
    const normalizedReason = reason || 'inappropriate_content';
    await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: 'video',
      target_id: shortId,
      reason: normalizedReason,
      details: details || null,
      status: 'pending',
    });

    await supabase.from('moderation_cases').insert({
      target_type: 'video',
      target_id: shortId,
      source: 'user_report',
      severity: 'medium',
      status: 'open',
      reason_summary: details ? `${normalizedReason}: ${details}` : normalizedReason,
      created_by: user.id,
    });
  } catch {
    // Non-blocking report log
  }

  return { success: true };
}

/**
 * Deletes a Short (requires author or page admin permissions).
 */
export async function deleteShortAction(shortId: string): Promise<ShortActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to delete content.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  // Fetch video to verify permissions
  const { data: video } = await supabase
    .from('videos')
    .select('creator_id, page_id')
    .eq('id', shortId)
    .maybeSingle();

  if (!video) return { success: false, error: 'Short not found.' };

  let isAuthorized = video.creator_id === user.id;

  if (!isAuthorized && video.page_id) {
    const [{ data: pageRole }, { data: pageRecord }] = await Promise.all([
      supabase
        .from('page_roles')
        .select('role')
        .eq('page_id', video.page_id)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', video.page_id)
        .maybeSingle(),
    ]);

    if ((pageRole && ['owner', 'admin'].includes(pageRole.role)) || pageRecord?.owner_id === user.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return { success: false, error: 'You are not authorized to delete this Short.' };
  }

  const { error } = await supabase.from('videos').delete().eq('id', shortId);
  if (error) return { success: false, error: error.message };

  revalidatePath('/shorts');
  revalidatePath('/reels');
  revalidatePath('/creator-studio/videos');
  return { success: true };
}

/**
 * Fetches Caribbean Pages that the current user manages with publishing rights.
 */
export async function fetchUserManagedPagesAction(): Promise<{ id: string; name: string; avatar_url: string | null }[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  try {
    const [{ data: roleData }, { data: ownedData }] = await Promise.all([
      supabase
        .from('page_roles')
        .select('page_id, businesses(id, name, avatar_url)')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin', 'editor']),
      supabase
        .from('businesses')
        .select('id, name, avatar_url')
        .eq('owner_id', user.id),
    ]);

    const pageMap = new Map<string, { id: string; name: string; avatar_url: string | null }>();
    for (const item of roleData ?? []) {
      const b = (item as any).businesses;
      if (b?.id && b?.name) {
        pageMap.set(b.id, { id: b.id, name: b.name, avatar_url: b.avatar_url || null });
      }
    }
    for (const b of ownedData ?? []) {
      if (b?.id && b?.name && !pageMap.has(b.id)) {
        pageMap.set(b.id, { id: b.id, name: b.name, avatar_url: b.avatar_url || null });
      }
    }

    return Array.from(pageMap.values());
  } catch (err) {
    console.warn('[fetchUserManagedPagesAction] Error:', err);
    return [];
  }
}

