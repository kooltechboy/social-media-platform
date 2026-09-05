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

  const isScheduled = Boolean(params.scheduledFor && new Date(params.scheduledFor).getTime() > Date.now());

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
      stream_url: params.streamUrl?.trim() || null,
      playback_path: params.streamUrl?.trim() || null,
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
    .from('livestreams')
    .update({
      state: 'ended',
      ended_at: new Date().toISOString(),
      peak_viewers: Math.max(0, peakViewers),
    })
    .eq('id', livestreamId)
    .eq('creator_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/live');
  revalidatePath('/creator-studio');
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
