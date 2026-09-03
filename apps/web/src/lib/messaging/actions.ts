'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface MessageActionState {
  error: string | null;
  message?: any;
}

export async function sendMessageAction(
  _prev: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to send messages.' };

  const conversationId = String(formData.get('conversationId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  const messageKind = (String(formData.get('message_kind') ?? 'text')) as 'text' | 'voice' | 'media' | 'system';
  const audioUrl = String(formData.get('audio_url') ?? '');

  if (!conversationId) return { error: 'Conversation is required.' };
  if (!body && !audioUrl) return { error: 'Message cannot be empty.' };
  if (body.length > 4000) return { error: 'Messages are limited to 4000 characters.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is not configured.' };

  const membership = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', user.id)
    .is('left_at', null)
    .maybeSingle();
  if (!membership.data) return { error: 'You are not a member of this conversation.' };

  const finalBody = audioUrl ? (body || `[Voice Note: ${audioUrl}]`) : body;

  const { data: inserted, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: finalBody,
      message_kind: messageKind || 'text',
    })
    .select('id, sender_id, body, created_at, message_kind')
    .single();

  if (error) return { error: error.message };

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  revalidatePath('/messages');
  return { error: null, message: inserted };
}
