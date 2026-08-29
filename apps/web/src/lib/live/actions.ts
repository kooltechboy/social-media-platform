'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { validateStreamCreation, type StreamAccess } from '@caribbean/live';

export interface SendGiftState {
  error: string | null;
  success?: boolean;
  giftName?: string;
}

export async function sendGiftAction(
  prevState: SendGiftState,
  formData: FormData,
): Promise<SendGiftState> {
  return { error: 'Virtual gifts are unavailable until a verified payment provider is configured.' };
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
