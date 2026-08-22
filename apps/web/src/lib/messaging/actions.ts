'use server';

import { revalidatePath } from 'next/navigation';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface MessageActionState {
  error: string | null;
}

export async function sendMessageAction(
  _prev: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to send messages.' };

  const conversationId = String(formData.get('conversationId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!conversationId) return { error: 'Conversation is required.' };
  if (!body) return { error: 'Message cannot be empty.' };
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

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
    message_kind: 'text',
  });
  if (error) return { error: error.message };

  await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);

  revalidatePath('/messages');
  return { error: null };
}
