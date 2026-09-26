'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import {
  validateEpisode,
  validateChapters,
  validateTimedLinks,
  slugifyPodcast,
  type Chapter,
  type TimedLink,
  type TranscriptSegment,
} from '@caribbean/podcasts';
import { CaribAIEngine } from '@caribbean/ai';

export interface PodcastActionState {
  error: string | null;
  success: string | null;
  podcastSlug?: string;
  podcastId?: string;
}

export async function createPodcastAction(
  _prev: PodcastActionState,
  formData: FormData,
): Promise<PodcastActionState> {
  const title = String(formData.get('title') ?? '').trim();
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const longDescription = String(formData.get('longDescription') ?? '').trim() || null;
  const languageIso = String(formData.get('languageIso') ?? '').trim() || 'en';
  const category = String(formData.get('category') ?? '').trim() || 'Culture & History';
  const subcategory = String(formData.get('subcategory') ?? '').trim() || null;
  const country = String(formData.get('country') ?? '').trim() || null;
  const islandTerritory = String(formData.get('islandTerritory') ?? '').trim() || null;
  const authorName = String(formData.get('authorName') ?? '').trim() || null;
  const copyright = String(formData.get('copyright') ?? '').trim() || null;
  const publisher = String(formData.get('publisher') ?? '').trim() || null;
  const showType = (String(formData.get('showType') ?? 'episodic') as 'episodic' | 'serial') || 'episodic';
  const isPaid = formData.get('isPaid') === 'true';
  const coverPath = String(formData.get('coverPath') ?? '').trim() || null;
  const pageId = String(formData.get('pageId') ?? '').trim() || null;

  if (!title || title.length < 2) {
    return { error: 'Podcast title must be at least 2 characters.', success: null };
  }

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to create a podcast.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const baseSlug = slugifyPodcast(title);
  const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

  const { data: created, error } = await supabase
    .from('podcasts')
    .insert({
      creator_id: user.id,
      title,
      subtitle,
      slug,
      description,
      long_description: longDescription,
      cover_path: coverPath,
      language: languageIso,
      category,
      subcategory,
      country,
      island_territory: islandTerritory,
      author_name: authorName,
      copyright,
      publisher,
      show_type: showType,
      is_paid: isPaid,
      page_id: pageId,
      follower_count: 0,
      publication_status: 'published',
      visibility: 'public',
    })
    .select('id, slug')
    .single();

  if (error) return { error: error.message, success: null };

  // Seed default distribution destinations for the newly created show
  const defaultPlatforms = ['apple_podcasts', 'spotify', 'youtube_music', 'amazon_music', 'pocket_casts', 'podcast_index'];
  const distRows = defaultPlatforms.map((plat) => ({
    podcast_id: created.id,
    platform: plat,
    submission_status: 'unsubmitted',
  }));
  await supabase.from('podcast_distribution_destinations').upsert(distRows, { onConflict: 'podcast_id,platform' });

  revalidatePath('/podcasts');
  revalidatePath('/creator-studio');
  return {
    error: null,
    success: 'Podcast show successfully created!',
    podcastSlug: created.slug,
    podcastId: created.id,
  };
}

export interface PublishEpisodeParams {
  podcastId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  subtitle?: string;
  durationSeconds: number;
  audioPath: string;
  videoPath?: string | null;
  hlsManifestUrl?: string | null;
  captionsUrl?: string | null;
  showNotes?: string;
  showNotesHtml?: string;
  transcript?: string;
  transcriptSegments?: TranscriptSegment[];
  chapters?: Chapter[];
  timedLinks?: TimedLink[];
  episodeType?: 'full' | 'trailer' | 'bonus';
  isSubscriberOnly?: boolean;
  isPremium?: boolean;
  isExplicit?: boolean;
  authorName?: string;
  artworkUrl?: string;
  contentWarnings?: string[];
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
    videoPath: params.videoPath,
    isSubscriberOnly: Boolean(params.isSubscriberOnly),
    isPremium: Boolean(params.isPremium),
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

  if (params.timedLinks && params.timedLinks.length > 0) {
    const linkVal = validateTimedLinks(params.timedLinks, params.durationSeconds);
    if (!linkVal.valid) {
      return { success: false, error: linkVal.errors.join(', ') };
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
      subtitle: params.subtitle?.trim() || null,
      audio_path: params.audioPath,
      video_path: params.videoPath || null,
      hls_manifest_url: params.hlsManifestUrl || null,
      captions_url: params.captionsUrl || null,
      duration_seconds: params.durationSeconds,
      show_notes: params.showNotes || null,
      show_notes_html: params.showNotesHtml || null,
      transcript: params.transcript || null,
      chapters: params.chapters || [],
      episode_type: params.episodeType || 'full',
      is_subscriber_only: Boolean(params.isSubscriberOnly),
      is_premium: Boolean(params.isPremium),
      is_explicit: Boolean(params.isExplicit),
      author_name: params.authorName || null,
      artwork_url: params.artworkUrl || null,
      content_warnings: params.contentWarnings || [],
      published_at: publishedAt,
      scheduled_for: scheduledFor,
      distribution_status: 'ready',
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  const episodeId = data?.id;

  // Insert timed links if present
  if (params.timedLinks && params.timedLinks.length > 0 && episodeId) {
    const linkRows = params.timedLinks.map((l) => ({
      episode_id: episodeId,
      timestamp_seconds: l.timestampSeconds,
      title: l.title,
      url: l.url,
      description: l.description || null,
      link_kind: l.linkKind || 'external',
      target_id: l.targetId || null,
    }));
    await supabase.from('podcast_timed_links').insert(linkRows);
  }

  // Insert structured transcript segments if present
  if (params.transcriptSegments && params.transcriptSegments.length > 0 && episodeId) {
    await supabase.from('podcast_transcripts').insert({
      episode_id: episodeId,
      language: 'en',
      format: 'json',
      segments: params.transcriptSegments,
      is_primary: true,
      ai_generated: false,
    });
  }

  // Update show last published timestamp
  if (publishedAt) {
    await supabase
      .from('podcasts')
      .update({ last_published_at: publishedAt })
      .eq('id', params.podcastId);
  }

  revalidatePath('/podcasts');
  revalidatePath('/creator-studio');
  return { success: true, episodeId };
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

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('podcast_episodes')
    .update({
      published_at: now,
      scheduled_for: null,
      distribution_status: 'ready',
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

  try {
    await supabase.rpc('increment_podcast_followers', { p_podcast_id: podcastId });
  } catch {
    // Ignore RPC failure if trigger already handled
  }

  revalidatePath('/podcasts');
  return { error: null, success: 'Following show.' };
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
    // Ignore RPC failure
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

export async function fetchEpisodeTimedLinksAction(episodeId: string): Promise<TimedLink[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('podcast_timed_links')
    .select('timestamp_seconds, title, url, description, link_kind, target_id')
    .eq('episode_id', episodeId)
    .order('timestamp_seconds', { ascending: true });

  return (data || []).map((d) => ({
    timestampSeconds: d.timestamp_seconds,
    title: d.title,
    url: d.url,
    description: d.description || undefined,
    linkKind: d.link_kind as any,
    targetId: d.target_id || undefined,
  }));
}

export async function fetchEpisodeTranscriptsAction(episodeId: string): Promise<TranscriptSegment[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('podcast_transcripts')
    .select('segments')
    .eq('episode_id', episodeId)
    .eq('is_primary', true)
    .maybeSingle();

  if (data && Array.isArray(data.segments)) {
    return data.segments as TranscriptSegment[];
  }
  return [];
}

export async function addPodcastCommentAction(
  episodeId: string,
  body: string,
  timestampSeconds?: number,
  parentCommentId?: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in to comment.' };

  if (!body.trim()) return { success: false, error: 'Comment cannot be empty.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase.from('podcast_comments').insert({
    episode_id: episodeId,
    profile_id: user.id,
    parent_comment_id: parentCommentId || null,
    timestamp_seconds: timestampSeconds !== undefined ? Math.floor(timestampSeconds) : null,
    body: body.trim(),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fetchPodcastCommentsAction(episodeId: string): Promise<any[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('podcast_comments')
    .select(`
      id, timestamp_seconds, body, likes_count, is_pinned, created_at,
      profile:profiles!podcast_comments_profile_id_fkey(id, display_name, username, avatar_url, is_verified)
    `)
    .eq('episode_id', episodeId)
    .order('created_at', { ascending: false })
    .limit(100);

  return data || [];
}

export async function fetchPodcastDistributionDestinationsAction(podcastId: string): Promise<any[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('podcast_distribution_destinations')
    .select('*')
    .eq('podcast_id', podcastId);

  return data || [];
}

export async function updatePodcastDistributionDestinationAction(
  podcastId: string,
  platform: string,
  status: string,
  externalUrl?: string,
  feedUrl?: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('podcast_distribution_destinations')
    .upsert({
      podcast_id: podcastId,
      platform,
      submission_status: status,
      external_show_url: externalUrl || null,
      destination_feed_url: feedUrl || null,
      last_sync_at: new Date().toISOString(),
    }, {
      onConflict: 'podcast_id,platform',
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function generateFeedTokenAction(podcastId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const randomPart = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const tokenHash = `tkb_pod_${randomPart}`;

  const { error } = await supabase.from('podcast_feed_tokens').upsert({
    podcast_id: podcastId,
    profile_id: user.id,
    token_hash: tokenHash,
    is_revoked: false,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }, {
    onConflict: 'podcast_id,profile_id',
  });

  if (error) return { success: false, error: error.message };
  return { success: true, token: tokenHash };
}

export async function generateCaribAiPodcastMetadataAction(
  title: string,
  rawNotes: string,
): Promise<{
  seoTitle: string;
  summary: string;
  chapters: Chapter[];
  socialPost: string;
  keywords: string[];
}> {
  try {
    const ai = new CaribAIEngine();
    const prompt = `You are CaribAI Podcast Studio Assistant. Analyze this podcast episode information:
Title: "${title}"
Notes: "${rawNotes}"

Generate a structured JSON object with:
1. "seoTitle": High-engagement SEO title for Caribbean audiences.
2. "summary": Compelling 2-paragraph episode summary.
3. "chapters": Array of 3 to 5 realistic chapter markers with startSeconds (integer) and title (string).
4. "socialPost": Engaging social media promotional post with relevant hashtags.
5. "keywords": Array of 5-8 search tags.

Output only valid JSON:`;

    const res = await ai.complete(prompt);
    const parsed = JSON.parse(res);
    return {
      seoTitle: parsed.seoTitle || title,
      summary: parsed.summary || rawNotes,
      chapters: parsed.chapters || [{ startSeconds: 0, title: 'Introduction' }],
      socialPost: parsed.socialPost || '',
      keywords: parsed.keywords || [],
    };
  } catch (err) {
    return {
      seoTitle: title,
      summary: rawNotes,
      chapters: [
        { startSeconds: 0, title: 'Introduction & Greetings' },
        { startSeconds: 300, title: 'Caribbean Cultural Context' },
        { startSeconds: 900, title: 'Community Discussion & Wrap' },
      ],
      socialPost: `Check out our new episode "${title}" on TUKUBI Podcasting Network! 🎙️🌴`,
      keywords: ['Caribbean', 'Podcasts', 'Tukubi', 'Culture'],
    };
  }
}
