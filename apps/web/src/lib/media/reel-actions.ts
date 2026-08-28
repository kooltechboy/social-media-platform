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

  const commentData = {
    id: `rc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    reel_id: reelId,
    user_id: user.id,
    display_name: user.displayName,
    username: user.username,
    avatar_url: user.avatarUrl,
    content: text,
    created_at: new Date().toISOString(),
  };

  revalidatePath('/reels');
  return { success: true, data: commentData };
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

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const finalTitle = soundTitle ? `${title} • 🎵 ${soundTitle}` : title;

  const { data, error } = await supabase
    .from('videos')
    .insert({
      creator_id: user.id,
      title: finalTitle,
      video_kind: 'reel',
      storage_path: storagePath || 'https://assets.mixkit.co/videos/preview/mixkit-caribbean-tropical-beach-with-turquoise-water-41221-large.mp4',
      duration_seconds: isNaN(durationSeconds) ? 30 : durationSeconds,
      visibility: visibility === 'subscribers' ? 'subscribers' : visibility === 'followers' ? 'followers' : 'public',
      view_count: 0,
    })
    .select('id, title, created_at')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/reels');
  revalidatePath('/creator-studio/videos');
  return { success: true, data };
}
