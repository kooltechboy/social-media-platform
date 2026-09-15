'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import {
  validateEpisode,
  validateChapters,
  slugifyPodcast,
  type Chapter,
} from '@caribbean/podcasts';

export interface PodcastActionState {
  error: string | null;
  success: string | null;
  podcastSlug?: string;
}

export async function createPodcastAction(
  _prev: PodcastActionState,
  formData: FormData,
): Promise<PodcastActionState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const languageIso = String(formData.get('languageIso') ?? '').trim() || null;
  const isPaid = formData.get('isPaid') === 'true';
  const coverPath = String(formData.get('coverPath') ?? '').trim() || null;

  if (!title || title.length < 2) {
    return { error: 'Podcast title must be at least 2 characters.', success: null };
  }

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to create a podcast.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const baseSlug = slugifyPodcast(title);
  const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

  const { error } = await supabase.from('podcasts').insert({
    creator_id: user.id,
    title,
    slug,
    description: description || null,
    cover_path: coverPath,
    language: languageIso,
    is_paid: isPaid,
    follower_count: 0,
  });

  if (error) return { error: error.message, success: null };

  revalidatePath('/podcasts');
  revalidatePath('/creator-studio');
  return { error: null, success: 'Podcast show successfully created!', podcastSlug: slug };
}

export interface PublishEpisodeParams {
  podcastId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  durationSeconds: number;
  audioPath: string;
  showNotes?: string;
  transcript?: string;
  chapters?: Chapter[];
  isSubscriberOnly?: boolean;
  isDraft?: boolean;
  scheduledFor?: string | null;
}

export async function publishEpisodeAction(
  params: PublishEpisodeParams,
): Promise<{ success: boolean; error?: string; episodeId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to publish episodes.' };

  const validation = validateEpisode({
    podcastId: params.podcastId,
    seasonNumber: params.seasonNumber,
    episodeNumber: params.episodeNumber,
    title: params.title,
    durationSeconds: params.durationSeconds,
    audioPath: params.audioPath,
    isSubscriberOnly: Boolean(params.isSubscriberOnly),
  });

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') };
  }

  if (params.chapters && params.chapters.length > 0) {
    const chapVal = validateChapters(params.chapters, params.durationSeconds);
    if (!chapVal.valid) {
      return { success: false, error: chapVal.errors.join(', ') };
    }
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const isDraft = Boolean(params.isDraft);
  const isScheduled = Boolean(params.scheduledFor && new Date(params.scheduledFor).getTime() > Date.now());

  const publishedAt = isDraft || isScheduled ? null : new Date().toISOString();
  const scheduledFor = isScheduled && params.scheduledFor ? new Date(params.scheduledFor).toISOString() : null;

  const { data, error } = await supabase
    .from('podcast_episodes')
    .insert({
      podcast_id: params.podcastId,
      season_number: params.seasonNumber,
      episode_number: params.episodeNumber,
      title: params.title.trim(),
      audio_path: params.audioPath,
      duration_seconds: params.durationSeconds,
      show_notes: params.showNotes || null,
      transcript: params.transcript || null,
      chapters: params.chapters || [],
      is_subscriber_only: Boolean(params.isSubscriberOnly),
      published_at: publishedAt,
      scheduled_for: scheduledFor,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/podcasts');
  revalidatePath('/creator-studio');
  return { success: true, episodeId: data?.id };
}

export async function deletePodcastAction(
  podcastId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('podcasts')
    .delete()
    .eq('id', podcastId)
    .eq('creator_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/podcasts');
  revalidatePath('/creator-studio');
  return { success: true };
}

export async function deletePodcastEpisodeAction(
  episodeId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  // Delete will be allowed by the updated RLS policy if creator owns the parent podcast
  const { error } = await supabase
    .from('podcast_episodes')
    .delete()
    .eq('id', episodeId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/podcasts');
  revalidatePath('/creator-studio');
  return { success: true };
}

export async function publishDraftEpisodeAction(
  episodeId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('podcast_episodes')
    .update({
      published_at: new Date().toISOString(),
      scheduled_for: null,
    })
    .eq('id', episodeId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/podcasts');
  revalidatePath('/creator-studio');
  return { success: true };
}

export async function followPodcastAction(podcastId: string): Promise<PodcastActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to follow podcasts.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { error } = await supabase
    .from('podcast_followers')
    .upsert({ podcast_id: podcastId, profile_id: user.id }, { onConflict: 'podcast_id,profile_id' });

  if (error) return { error: error.message, success: null };

  // Trigger trg_podcast_follower_count handles the counter, with RPC fallback
  try {
    await supabase.rpc('increment_podcast_followers', { p_podcast_id: podcastId });
  } catch {
    // Ignore RPC failure if trigger already executed
  }

  revalidatePath('/podcasts');
  return { error: null, success: 'Following.' };
}

export async function unfollowPodcastAction(podcastId: string): Promise<PodcastActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to manage podcast subscriptions.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { error } = await supabase
    .from('podcast_followers')
    .delete()
    .eq('podcast_id', podcastId)
    .eq('profile_id', user.id);

  if (error) return { error: error.message, success: null };

  try {
    await supabase.rpc('decrement_podcast_followers', { p_podcast_id: podcastId });
  } catch {
    // Ignore RPC failure if trigger already executed
  }

  revalidatePath('/podcasts');
  return { error: null, success: 'Unfollowed.' };
}

export async function savePodcastProgressAction(
  episodeId: string,
  positionSeconds: number,
  completed: boolean = false,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to save listening progress.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  try {
    const { error } = await supabase.from('podcast_progress').upsert({
      user_id: user.id,
      episode_id: episodeId,
      current_position_seconds: Math.max(0, Math.floor(positionSeconds)),
      completed,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,episode_id',
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save progress.' };
  }
}

export async function getPodcastProgressAction(
  episodeId: string,
): Promise<{ positionSeconds: number; completed: boolean } | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('podcast_progress')
      .select('current_position_seconds, completed')
      .eq('user_id', user.id)
      .eq('episode_id', episodeId)
      .maybeSingle();

    if (data) {
      return {
        positionSeconds: data.current_position_seconds || 0,
        completed: Boolean(data.completed),
      };
    }
  } catch {
    // Return null on failure
  }

  return null;
}

export async function recordPodcastPlayAction(
  episodeId: string,
  listenedSeconds: number,
  completed: boolean = false,
  countryIso?: string,
  deviceType?: string,
): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false };

  try {
    // Increment play_count on podcast_episodes
    const { data: ep } = await supabase
      .from('podcast_episodes')
      .select('play_count')
      .eq('id', episodeId)
      .maybeSingle();

    if (ep) {
      await supabase
        .from('podcast_episodes')
        .update({ play_count: (ep.play_count || 0) + 1 })
        .eq('id', episodeId);
    }

    // Insert analytics record
    await supabase.from('podcast_analytics').insert({
      episode_id: episodeId,
      listener_id: user?.id || null,
      listened_seconds: Math.max(1, Math.floor(listenedSeconds)),
      completed,
      country_iso: countryIso || null,
      device_type: deviceType || 'web',
    });
  } catch (err) {
    console.warn('[recordPodcastPlayAction] Non-blocking analytics error:', err);
  }

  return { success: true };
}

export async function getPodcastAnalyticsAction(
  podcastId: string,
): Promise<{
  totalPlays: number;
  uniqueListeners: number;
  completionRate: number;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { totalPlays: 0, uniqueListeners: 0, completionRate: 0, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { totalPlays: 0, uniqueListeners: 0, completionRate: 0, error: 'Database unavailable.' };

  try {
    const { data: episodes } = await supabase
      .from('podcast_episodes')
      .select('id, play_count')
      .eq('podcast_id', podcastId);

    if (!episodes || episodes.length === 0) {
      return { totalPlays: 0, uniqueListeners: 0, completionRate: 0 };
    }

    const totalPlays = episodes.reduce((acc, curr) => acc + (curr.play_count || 0), 0);
    const episodeIds = episodes.map((e) => e.id);

    const { data: analytics } = await supabase
      .from('podcast_analytics')
      .select('listener_id, completed')
      .in('episode_id', episodeIds);

    const uniqueListeners = new Set(
      analytics?.map((a) => a.listener_id).filter(Boolean)
    ).size;

    const completedCount = analytics?.filter((a) => a.completed).length || 0;
    const completionRate = analytics && analytics.length > 0
      ? Math.round((completedCount / analytics.length) * 100)
      : 0;

    return { totalPlays, uniqueListeners, completionRate };
  } catch (err: any) {
    return { totalPlays: 0, uniqueListeners: 0, completionRate: 0, error: err?.message };
  }
}

