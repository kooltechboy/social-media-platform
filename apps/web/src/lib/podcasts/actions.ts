'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { validateEpisode, buildRssFeed } from '@caribbean/podcasts';

export interface PodcastActionState {
  error: string | null;
  success: string | null;
}

export async function createPodcastAction(
  _prev: PodcastActionState,
  formData: FormData,
): Promise<PodcastActionState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const languageIso = String(formData.get('languageIso') ?? '').trim() || null;

  if (!title || title.length < 2) return { error: 'Podcast title must be at least 2 characters.', success: null };

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to create a podcast.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const baseSlug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 80);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { error } = await supabase.from('podcasts').insert({
    creator_id: user.id,
    title,
    slug,
    description: description || null,
    language: languageIso,
  });

  if (error) return { error: error.message, success: null };

  revalidatePath('/podcasts');
  return { error: null, success: 'Podcast created.' };
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

  await supabase.rpc('increment_podcast_followers', { p_podcast_id: podcastId }).maybeSingle().catch(() => null);

  revalidatePath('/podcasts');
  return { error: null, success: 'Following.' };
}

export { buildRssFeed };
export { validateEpisode };
