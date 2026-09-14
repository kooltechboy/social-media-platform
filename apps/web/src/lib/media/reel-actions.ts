'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface ReelActionResult {
  success: boolean;
  error?: string | null;
  data?: any;
}

export async function toggleReelLikeAction(reelId: string): Promise<ReelActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to like reels.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  // Check if already viewed/liked or record in video_views
  const { data: existing } = await supabase
    .from('video_views')
    .select('completed')
    .eq('video_id', reelId)
    .eq('viewer_id', user.id)
    .maybeSingle();

  if (existing) {
    const nextCompleted = !existing.completed;
    const { error } = await supabase
      .from('video_views')
      .update({ completed: nextCompleted })
      .eq('video_id', reelId)
      .eq('viewer_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true, data: { isLiked: nextCompleted } };
  } else {
    const { error } = await supabase
      .from('video_views')
      .insert({
        video_id: reelId,
        viewer_id: user.id,
        watched_seconds: 5,
        completed: true,
      });

    if (error) return { success: false, error: error.message };
    return { success: true, data: { isLiked: true } };
  }
}

export async function postReelCommentAction(reelId: string, content: string): Promise<ReelActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to comment on reels.' };

  const text = content.trim();
  if (!text) return { success: false, error: 'Comment cannot be empty.' };
  if (text.length > 500) return { success: false, error: 'Comment must be 500 characters or fewer.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      video_id: reelId,
      author_id: user.id,
      content: text,
    })
    .select('id, content, created_at, profiles:profiles!comments_author_id_fkey(display_name, username, avatar_url)')
    .single();

  if (error) {
    console.error('[postReelCommentAction] DB error:', error);
    return { success: false, error: error.message };
  }

  const rawP = (comment as any)?.profiles;
  const p = Array.isArray(rawP) ? rawP[0] : rawP;

  const commentData = {
    id: comment.id,
    reel_id: reelId,
    user_id: user.id,
    display_name: p?.display_name || user.displayName,
    username: p?.username || user.username,
    avatar_url: p?.avatar_url || user.avatarUrl,
    content: comment.content,
    created_at: comment.created_at,
  };

  revalidatePath('/reels');
  return { success: true, data: commentData };
}

export async function fetchReelCommentsAction(reelId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { comments: [] };

  const { data } = await supabase
    .from('comments')
    .select('id, content, created_at, author_id, profiles:profiles!comments_author_id_fkey(display_name, username, avatar_url)')
    .eq('video_id', reelId)
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

export async function recordReelShareAction(reelId: string, shareType: string = 'copy_link'): Promise<ReelActionResult> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (supabase && user) {
    try {
      await supabase.from('post_shares').insert({
        post_id: reelId,
        user_id: user.id,
        share_type: shareType,
      });
    } catch {
      // Non-blocking
    }
  }

  return { success: true };
}

export async function recordReelViewAction(reelId: string, watchedSeconds: number = 3): Promise<ReelActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false };

  try {
    const { data: video } = await supabase
      .from('videos')
      .select('view_count')
      .eq('id', reelId)
      .maybeSingle();

    if (video) {
      await supabase
        .from('videos')
        .update({ view_count: (Number(video.view_count) || 0) + 1 })
        .eq('id', reelId);
    }
  } catch {
    // Non-blocking view telemetry
  }

  return { success: true };
}

export async function publishReelAction(formData: FormData): Promise<ReelActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to publish reels.' };

  const title = String(formData.get('title') ?? '').trim();
  const soundId = String(formData.get('soundId') ?? '').trim();
  const soundTitle = String(formData.get('soundTitle') ?? '').trim();
  const storagePath = String(formData.get('storagePath') ?? '').trim();
  const visibility = String(formData.get('visibility') ?? 'public').trim();
  const durationSeconds = parseInt(String(formData.get('durationSeconds') ?? '30'), 10);

  if (!title) return { success: false, error: 'Please add a caption for your reel.' };
  if (!storagePath) return { success: false, error: 'Video media file is required to publish a reel.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const finalTitle = soundTitle ? `${title} • 🎵 ${soundTitle}` : title;

  const { data: videoData, error } = await supabase
    .from('videos')
    .insert({
      creator_id: user.id,
      title: finalTitle,
      video_kind: 'reel',
      storage_path: storagePath,
      duration_seconds: isNaN(durationSeconds) ? 30 : durationSeconds,
      visibility: visibility === 'subscribers' ? 'subscribers' : visibility === 'followers' ? 'followers' : 'public',
      audio_track: soundTitle || 'Original Caribbean Audio',
      view_count: 0,
    })
    .select('id, title, created_at, storage_path')
    .single();

  if (error) return { success: false, error: error.message };

  // Resolve author profile country for post synchronization
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('country_id, current_country_id, origin_country_id')
      .eq('id', user.id)
      .maybeSingle();

    const countryId = profile?.country_id || profile?.current_country_id || profile?.origin_country_id || null;

    await supabase.from('posts').insert({
      author_id: user.id,
      content: finalTitle,
      visibility: visibility === 'subscribers' ? 'followers' : (visibility as any),
      media_urls: [storagePath],
      cultural_tags: ['reel', 'caribbean_creators'],
      country_id: countryId,
    });
  } catch (postSyncErr) {
    console.warn('[publishReelAction] Companion post creation warning:', postSyncErr);
  }

  revalidatePath('/reels');
  revalidatePath('/creator-studio/videos');
  revalidatePath('/');
  return { success: true, data: videoData };
}

// ===== REEL SAVE / BOOKMARK =====

export async function saveReelAction(reelId: string): Promise<ReelActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to save reels.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  // Reels are stored in `videos` table; bookmarked via saved_posts using their UUID
  const { error } = await supabase
    .from('saved_posts')
    .upsert(
      { profile_id: user.id, post_id: reelId },
      { onConflict: 'profile_id,post_id' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true, data: { saved: true } };
}

export async function unsaveReelAction(reelId: string): Promise<ReelActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('profile_id', user.id)
    .eq('post_id', reelId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: { saved: false } };
}

