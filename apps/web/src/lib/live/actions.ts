'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { findGift, validateGiftPurchase } from '@caribbean/live';
import { Money } from '@caribbean/spotpay';

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

  // Insert broadcast message into live_messages
  const { error: msgErr } = await supabase.from('live_messages').insert({
    livestream_id: livestreamId,
    sender_id: user.id,
    body: `Sent a ${gift.label} (${new Money(gift.priceMinor, 'USD').format('en-US')}) 🎁`,
  });

  if (msgErr) {
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
