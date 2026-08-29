'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import {
  findGift,
  validateGiftPurchase,
  validateStreamCreation,
  type StreamAccess,
} from '@caribbean/live';
import { Money } from '@caribbean/payments';

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
  const idempotencyKey = `gift_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const gift = findGift(giftKey);
  if (!gift) {
    return { error: `Invalid gift selection: ${giftKey}` };
  }

  const validation = validateGiftPurchase({
    giftKey,
    senderId: user.id,
    livestreamId,
    idempotencyKey,
  });

  if (!validation.valid) {
    return { error: validation.errors.join(', ') };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: 'Database service is currently unavailable.' };
  }

  // Look up stream creator
  const { data: stream, error: streamErr } = await supabase
    .from('livestreams')
    .select('id, creator_id, state')
    .eq('id', livestreamId)
    .maybeSingle();

  if (streamErr || !stream) {
    return { error: 'Livestream not found.' };
  }

  if (stream.state !== 'live') {
    return { error: 'Gifts can only be sent during live streams.' };
  }

  // Record gift in live_gifts
  const { error: giftErr } = await supabase.from('live_gifts').insert({
    livestream_id: livestreamId,
    sender_id: user.id,
    gift_key: giftKey,
    price_minor: gift.priceMinor,
    currency: gift.currency,
    idempotency_key: idempotencyKey,
  });

  // Insert broadcast message into live_messages
  const { error: msgErr } = await supabase.from('live_messages').insert({
    livestream_id: livestreamId,
    sender_id: user.id,
    body: `Sent a ${gift.label} (${new Money(gift.priceMinor, 'USD').format('en-US')}) ${gift.emoji || '🎁'}`,
  });

  if (msgErr && giftErr) {
    return { error: 'Failed to broadcast gift message.' };
  }

  revalidatePath('/live');
  return { error: null, success: true, giftName: gift.label };
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

  const { data, error } = await supabase
    .from('livestreams')
    .insert({
      creator_id: user.id,
      title: params.title.trim(),
      access_level: params.accessLevel || 'public',
      state: 'live',
      started_at: new Date().toISOString(),
      peak_viewers: 1,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { error: error?.message || 'Failed to create broadcast session.' };
  }

  revalidatePath('/live');
  return { streamId: data.id };
}

export async function endLivestreamAction(
  livestreamId: string,
  peakViewers: number = 1,
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
      peak_viewers: Math.max(1, peakViewers),
    })
    .eq('id', livestreamId)
    .eq('creator_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/live');
  return { success: true };
}
