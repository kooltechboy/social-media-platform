'use server';
/**
 * TUKUBI Live Streaming Server Actions
 * All Cloudflare Stream API calls are server-side only.
 * CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN must be set in server environment.
 */
import { createCloudflareStreamClient } from '@caribbean/live';
import { getCurrentUser, createSupabaseServerClient } from '../supabase/server';

export interface GoLiveResult {
  streamId: string | null;
  rtmpsUrl: string | null;
  rtmpsKey: string | null;
  playbackHlsUrl: string | null;
  webRtcUrl: string | null;
  error?: string;
}

export async function createLiveStreamAction(input: {
  title: string;
  description?: string;
  accessLevel?: 'public' | 'followers' | 'subscribers';
}): Promise<GoLiveResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { streamId: null, rtmpsUrl: null, rtmpsKey: null, playbackHlsUrl: null, webRtcUrl: null, error: 'Not authenticated' };
  }

  const cfClient = createCloudflareStreamClient();
  if (!cfClient) {
    // Not an error — just not configured. Caller shows a helpful banner.
    return {
      streamId: null, rtmpsUrl: null, rtmpsKey: null, playbackHlsUrl: null, webRtcUrl: null,
      error: 'LIVE_CDN_NOT_CONFIGURED',
    };
  }

  try {
    const liveInput = await cfClient.createLiveInput({
      name: input.title,
      creatorId: user.id,
    });

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error('Database client unavailable');
    const { data, error } = await supabase
      .from('livestreams')
      .insert({
        creator_id: user.id,
        title: input.title,
        access_level: input.accessLevel ?? 'public',
        state: 'scheduled',
        cloudflare_uid: liveInput.uid,
        rtmps_url: liveInput.rtmpsUrl,
        rtmps_key: liveInput.rtmpsKey,
        playback_hls_url: liveInput.playbackHlsUrl,
        playback_dash_url: liveInput.playbackDashUrl,
        webrtc_url: liveInput.webRtcUrl,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return {
      streamId: data.id,
      rtmpsUrl: liveInput.rtmpsUrl,
      rtmpsKey: liveInput.rtmpsKey,
      playbackHlsUrl: liveInput.playbackHlsUrl,
      webRtcUrl: liveInput.webRtcUrl,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error creating stream';
    return { streamId: null, rtmpsUrl: null, rtmpsKey: null, playbackHlsUrl: null, webRtcUrl: null, error: msg };
  }
}

export async function endLiveStreamAction(streamId: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database client unavailable' };
  const { data: stream } = await supabase
    .from('livestreams')
    .select('cloudflare_uid')
    .eq('id', streamId)
    .eq('creator_id', user.id)
    .single();

  if (stream?.cloudflare_uid) {
    const cfClient = createCloudflareStreamClient();
    if (cfClient) {
      await cfClient.deleteLiveInput(stream.cloudflare_uid).catch(() => {
        // Best-effort — stream may have already ended
      });
    }
  }

  await supabase
    .from('livestreams')
    .update({ state: 'ended', ended_at: new Date().toISOString() })
    .eq('id', streamId)
    .eq('creator_id', user.id);

  return {};
}

export async function getLiveStreamStatusAction(streamId: string): Promise<{
  isLive: boolean;
  viewerCount: number;
  cloudflareUid?: string;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { isLive: false, viewerCount: 0, error: 'Database client unavailable' };
  const { data: stream } = await supabase
    .from('livestreams')
    .select('state, cloudflare_uid, viewer_count')
    .eq('id', streamId)
    .single();

  if (!stream) return { isLive: false, viewerCount: 0, error: 'Stream not found' };

  // Optionally refresh from Cloudflare
  if (stream.cloudflare_uid) {
    const cfClient = createCloudflareStreamClient();
    if (cfClient) {
      const status = await cfClient.getLiveInputStatus(stream.cloudflare_uid).catch(() => null);
      if (status) {
        await supabase
          .from('livestreams')
          .update({ viewer_count: status.viewerCount })
          .eq('id', streamId);
        return { isLive: status.isConnected, viewerCount: status.viewerCount, cloudflareUid: stream.cloudflare_uid };
      }
    }
  }

  return {
    isLive: stream.state === 'live',
    viewerCount: stream.viewer_count ?? 0,
    cloudflareUid: stream.cloudflare_uid ?? undefined,
  };
}

export async function inviteCoHostAction(
  streamId: string,
  inviteeUserId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable' };

  const { data: stream, error: fetchErr } = await supabase
    .from('livestreams')
    .select('id, creator_id, state, co_host_status')
    .eq('id', streamId)
    .single();

  if (fetchErr || !stream) return { success: false, error: 'Livestream not found' };
  if (stream.creator_id !== user.id) return { success: false, error: 'Only the host can invite a co-host' };
  if (stream.state !== 'scheduled' && stream.state !== 'live') {
    return { success: false, error: 'Cannot invite co-host to an inactive stream' };
  }
  if (inviteeUserId === user.id) {
    return { success: false, error: 'Cannot invite yourself as co-host' };
  }

  const { error: updateErr } = await supabase
    .from('livestreams')
    .update({
      co_host_id: inviteeUserId,
      co_host_status: 'invited',
    })
    .eq('id', streamId);

  if (updateErr) return { success: false, error: updateErr.message };
  return { success: true };
}

export async function respondCoHostInviteAction(
  streamId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable' };

  const { data: stream, error: fetchErr } = await supabase
    .from('livestreams')
    .select('id, co_host_id, co_host_status, state')
    .eq('id', streamId)
    .single();

  if (fetchErr || !stream) return { success: false, error: 'Livestream not found' };
  if (stream.co_host_id !== user.id || stream.co_host_status !== 'invited') {
    return { success: false, error: 'No pending co-host invitation found for this user' };
  }

  const { error: updateErr } = await supabase
    .from('livestreams')
    .update({
      co_host_status: accept ? 'active' : 'declined',
      co_host_id: accept ? user.id : null,
    })
    .eq('id', streamId);

  if (updateErr) return { success: false, error: updateErr.message };
  return { success: true };
}

export async function removeCoHostAction(
  streamId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database unavailable' };

  const { data: stream, error: fetchErr } = await supabase
    .from('livestreams')
    .select('id, creator_id, co_host_id')
    .eq('id', streamId)
    .single();

  if (fetchErr || !stream) return { success: false, error: 'Livestream not found' };
  if (stream.creator_id !== user.id && stream.co_host_id !== user.id) {
    return { success: false, error: 'Unauthorized to remove co-host' };
  }

  const { error: updateErr } = await supabase
    .from('livestreams')
    .update({
      co_host_id: null,
      co_host_status: 'none',
    })
    .eq('id', streamId);

  if (updateErr) return { success: false, error: updateErr.message };
  return { success: true };
}

