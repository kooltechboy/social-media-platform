'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { validateStreamCreation, type StreamAccess, findGift } from '@caribbean/live';

export interface SendGiftState {
  error: string | null;
  success?: boolean;
  giftName?: string;
}

export async function sendGiftAction(
  prevState: SendGiftState,
  formData: FormData,
): Promise<SendGiftState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to send virtual gifts.' };
  }

  const giftKey = formData.get('giftKey')?.toString() ?? '';
  const livestreamId = formData.get('livestreamId')?.toString() ?? '';

  if (!giftKey || !livestreamId) {
    return { error: 'Missing required gift or broadcast information.' };
  }

  const gift = findGift(giftKey);
  if (!gift) {
    return { error: 'Invalid virtual gift selected.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: 'Database service unavailable.' };
  }

  const idempotencyKey = `gift_${user.id}_${livestreamId}_${gift.key}_${Date.now()}`;

  const { error: giftError } = await supabase.from('live_gifts').insert({
    livestream_id: livestreamId,
    sender_id: user.id,
    gift_key: gift.key,
    price_minor: gift.priceMinor,
    currency: gift.currency,
    idempotency_key: idempotencyKey,
  });

  if (giftError) {
    return { error: giftError.message };
  }

  // Broadcast celebratory announcement in live stream chat
  await supabase.from('live_messages').insert({
    livestream_id: livestreamId,
    sender_id: user.id,
    body: `Sent a virtual gift: ${gift.emoji} ${gift.label}!`,
  });

  return { success: true, error: null, giftName: gift.label };
}

export interface LiveActionState {
  error: string | null;
  success?: boolean | null;
}

export async function sendLiveMessageAction(
  prevState: LiveActionState,
  formData: FormData,
): Promise<LiveActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to chat.' };
  }

  const livestreamId = formData.get('livestreamId')?.toString() ?? '';
  const body = formData.get('body')?.toString() ?? '';

  if (!livestreamId || !body.trim()) {
    return { error: 'Message cannot be empty.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: 'Database service unavailable.' };
  }

  const { error } = await supabase.from('live_messages').insert({
    livestream_id: livestreamId,
    sender_id: user.id,
    body: body.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null, success: true };
}

export async function deleteLiveMessageAction(
  messageId: string,
  livestreamId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Database unavailable.' };
  }

  const { error } = await supabase
    .from('live_messages')
    .update({ removed_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('livestream_id', livestreamId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export interface CreateStreamParams {
  title: string;
  accessLevel?: StreamAccess;
  scheduledFor?: string | null;
  streamUrl?: string | null;
  category?: string;
  countryId?: string | null;
  countryIso?: string | null;
  locationTag?: string | null;
  description?: string | null;
  allowChat?: boolean;
  chatSlowModeSeconds?: number;
  isRecording?: boolean;
}

export async function createLivestreamAction(
  params: CreateStreamParams,
): Promise<{ streamId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to broadcast.' };
  }

  const validation = validateStreamCreation({
    creatorId: user.id,
    title: params.title,
    accessLevel: params.accessLevel || 'public',
  });

  if (!validation.valid) {
    return { error: validation.errors.join(', ') };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: 'Database service unavailable.' };
  }

  let cloudflareUid: string | null = null;
  let rtmpsUrl: string | null = null;
  let rtmpsKey: string | null = null;
  let playbackHlsUrl: string | null = null;
  let webRtcUrl: string | null = null;

  try {
    const { createCloudflareStreamClient } = await import('@caribbean/live');
    const cfClient = createCloudflareStreamClient();
    if (cfClient) {
      const liveInput = await cfClient.createLiveInput({
        name: params.title.trim(),
        creatorId: user.id,
      });
      cloudflareUid = liveInput.uid;
      rtmpsUrl = liveInput.rtmpsUrl;
      rtmpsKey = liveInput.rtmpsKey;
      playbackHlsUrl = liveInput.playbackHlsUrl;
      webRtcUrl = liveInput.webRtcUrl;
    }
  } catch (cfErr) {
    // Graceful fallback if Cloudflare Stream credentials are unconfigured in environment
  }

  const effectiveStreamUrl = playbackHlsUrl || params.streamUrl?.trim() || null;
  const isScheduled = Boolean(params.scheduledFor && new Date(params.scheduledFor) > new Date());

  const { data, error } = await supabase
    .from('livestreams')
    .insert({
      creator_id: user.id,
      title: params.title.trim(),
      access_level: params.accessLevel || 'public',
      state: isScheduled ? 'scheduled' : 'live',
      scheduled_for: isScheduled && params.scheduledFor ? new Date(params.scheduledFor).toISOString() : null,
      started_at: isScheduled ? null : new Date().toISOString(),
      peak_viewers: 0,
      cloudflare_uid: cloudflareUid,
      rtmps_url: rtmpsUrl,
      rtmps_key: rtmpsKey,
      playback_hls_url: playbackHlsUrl,
      webrtc_url: webRtcUrl,
      stream_url: effectiveStreamUrl,
      playback_path: effectiveStreamUrl,
      category: params.category || 'Culture & Talk',
      country_id: params.countryId || null,
      country_iso: params.countryIso || null,
      location_tag: params.locationTag || null,
      description: params.description || null,
      allow_chat: params.allowChat !== false,
      chat_slow_mode_seconds: params.chatSlowModeSeconds || 0,
      is_recording: params.isRecording !== false,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { error: error?.message || 'Failed to create broadcast session.' };
  }

  revalidatePath('/live');
  revalidatePath('/creator-studio');
  return { streamId: data.id };
}

export async function startScheduledLivestreamAction(
  livestreamId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('livestreams')
    .update({
      state: 'live',
      started_at: new Date().toISOString(),
    })
    .eq('id', livestreamId)
    .eq('creator_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/live');
  revalidatePath('/creator-studio');
  return { success: true };
}

export async function endLivestreamAction(
  livestreamId: string,
  peakViewers: number = 0,
  replayStoragePath?: string,
): Promise<{ success: boolean; error?: string; replayId?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: 'Database unavailable.' };
  }

  const { error } = await supabase
    .from('livestreams')
    .update({
      state: 'ended',
      ended_at: new Date().toISOString(),
      peak_viewers: Math.max(0, peakViewers),
      replay_url: replayStoragePath || null,
    })
    .eq('id', livestreamId)
    .eq('creator_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  let replayId: string | undefined;
  if (replayStoragePath) {
    try {
      const { data: streamRow } = await supabase
        .from('livestreams')
        .select('title, description')
        .eq('id', livestreamId)
        .single();

      const { data: replayRow } = await supabase
        .from('live_replays')
        .insert({
          livestream_id: livestreamId,
          creator_id: user.id,
          title: streamRow?.title ? `Replay: ${streamRow.title}` : 'Live Replay',
          description: streamRow?.description || null,
          replay_storage_path: replayStoragePath,
          is_published: false,
        })
        .select('id')
        .single();

      if (replayRow) {
        replayId = replayRow.id;
      }
    } catch (err) {
      console.warn('[endLivestreamAction] Non-blocking replay record error:', err);
    }
  }

  revalidatePath('/live');
  revalidatePath('/creator-studio');
  return { success: true, replayId };
}

export async function saveLiveReplayToReelAction(
  replayId: string,
  customTitle?: string,
): Promise<{ success: boolean; reelId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { data: replay, error: replayError } = await supabase
    .from('live_replays')
    .select('*')
    .eq('id', replayId)
    .eq('creator_id', user.id)
    .single();

  if (replayError || !replay) {
    return { success: false, error: 'Replay not found.' };
  }

  // Insert into videos as a Reel / Short
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .insert({
      creator_id: user.id,
      title: customTitle || replay.title,
      description: replay.description,
      video_kind: 'reel',
      visibility: 'public',
      aspect_ratio: '9:16',
      storage_path: replay.replay_storage_path,
      thumbnail_url: replay.thumbnail_url || null,
      audio_track: 'Live Broadcast Audio',
      likes_count: 0,
      comments_count: 0,
      view_count: 0,
    })
    .select('id')
    .single();

  if (videoError || !video) {
    return { success: false, error: videoError?.message || 'Failed to clip replay to Reel.' };
  }

  await supabase
    .from('live_replays')
    .update({ is_published: true })
    .eq('id', replayId);

  revalidatePath('/reels');
  return { success: true, reelId: video.id };
}

export async function recordLiveViewerHeartbeatAction(
  livestreamId: string,
): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false };

  try {
    await supabase.from('live_viewers').upsert({
      livestream_id: livestreamId,
      viewer_id: user.id,
      last_heartbeat_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking telemetry
  }

  return { success: true };
}

export async function deleteLivestreamAction(
  livestreamId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable.' };

  const { error } = await supabase
    .from('livestreams')
    .delete()
    .eq('id', livestreamId)
    .eq('creator_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/live');
  revalidatePath('/creator-studio');
  return { success: true };
}
