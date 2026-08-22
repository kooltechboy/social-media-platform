'use server';

import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export interface LiveActionState {
  error: string | null;
  success: string | null;
}

export async function sendLiveMessageAction(
  _prev: LiveActionState,
  formData: FormData,
): Promise<LiveActionState> {
  const livestreamId = String(formData.get('livestreamId') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!livestreamId || !body) return { error: 'Message cannot be empty.', success: null };
  if (body.length > 500) return { error: 'Message too long.', success: null };

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to chat.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { data: stream } = await supabase
    .from('livestreams')
    .select('state')
    .eq('id', livestreamId)
    .maybeSingle();

  if (!stream || stream.state !== 'live')
    return { error: 'Stream is not currently live.', success: null };

  const { error } = await supabase
    .from('live_messages')
    .insert({ livestream_id: livestreamId, sender_id: user.id, body });

  if (error) return { error: error.message, success: null };
  return { error: null, success: 'sent' };
}

export async function createLivestreamAction(
  _prev: LiveActionState,
  formData: FormData,
): Promise<LiveActionState> {
  const title = String(formData.get('title') ?? '').trim();
  const accessLevel = (String(formData.get('accessLevel') ?? 'public')) as
    | 'public'
    | 'followers'
    | 'subscribers'
    | 'community';
  const scheduledFor = String(formData.get('scheduledFor') ?? '').trim() || null;

  if (!title || title.length < 3) return { error: 'Title must be at least 3 characters.', success: null };

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to create a stream.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { data, error } = await supabase
    .from('livestreams')
    .insert({
      creator_id: user.id,
      title,
      access_level: accessLevel,
      state: scheduledFor ? 'scheduled' : 'live',
      scheduled_for: scheduledFor,
      started_at: scheduledFor ? null : new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) return { error: error.message, success: null };

  revalidatePath('/live');
  return { error: null, success: data.id };
}
