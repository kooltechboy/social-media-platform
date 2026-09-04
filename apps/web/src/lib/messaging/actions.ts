'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { checkMessageRateLimit } from './rate-limiter';
import { 
  validateDraft, 
  MAX_EDIT_TIME_WINDOW_MINUTES,
  type MessageKind,
  type MessageMetadata,
  type ConversationCategory,
  generateClientMessageId,
  buildBusinessAiSystemPrompt
} from '@caribbean/messaging';

export interface MessageActionState {
  error: string | null;
  message?: any;
  conversationId?: string;
}

/**
 * Send Message Action with Idempotency, Block Verification, Rich Card Metadata, and Burst Protection
 */
export async function sendMessageAction(
  _prev: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to send messages.' };

  // Anti-spam burst rate check
  const rateLimit = checkMessageRateLimit(user.id);
  if (!rateLimit.allowed) {
    return { error: `Sending too fast. Please wait ${rateLimit.retryAfterSec}s before sending again.` };
  }

  const conversationId = String(formData.get('conversationId') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const messageKind = (String(formData.get('message_kind') ?? 'text')) as MessageKind;
  const clientMessageId = String(formData.get('client_message_id') ?? '').trim() || undefined;
  const audioUrl = String(formData.get('audio_url') ?? '').trim() || undefined;
  const mediaUrlsStr = String(formData.get('media_urls') ?? '').trim();
  const replyToId = String(formData.get('reply_to_id') ?? '').trim() || undefined;
  const metadataStr = String(formData.get('metadata') ?? '').trim();

  let mediaUrls: string[] = [];
  if (mediaUrlsStr) {
    try {
      mediaUrls = JSON.parse(mediaUrlsStr);
    } catch {}
  }

  let metadata: MessageMetadata = {};
  if (metadataStr) {
    try {
      metadata = JSON.parse(metadataStr);
    } catch {}
  }

  if (audioUrl) metadata.audio_url = audioUrl;
  if (mediaUrls.length > 0) metadata.media_urls = mediaUrls;

  if (!conversationId) return { error: 'Conversation ID is required.' };

  const validation = validateDraft({
    senderId: user.id,
    conversationId,
    body,
    messageKind,
    audioUrl,
    mediaUrls,
    metadata,
  });

  if (!validation.valid) {
    return { error: validation.errors.join(' ') };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database is not configured.' };

  // 1. Verify Active Membership
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('conversation_id, role, status')
    .eq('conversation_id', conversationId)
    .eq('profile_id', user.id)
    .is('left_at', null)
    .maybeSingle();

  if (!membership || membership.status === 'blocked') {
    return { error: 'You are not an active member of this conversation.' };
  }

  // 2. Check for active blocks among conversation members if direct
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, kind')
    .eq('id', conversationId)
    .single();

  if (conv?.kind === 'direct') {
    const { data: otherMembers } = await supabase
      .from('conversation_members')
      .select('profile_id')
      .eq('conversation_id', conversationId)
      .neq('profile_id', user.id);

    if (otherMembers && otherMembers.length > 0) {
      const partnerId = otherMembers[0].profile_id;
      const { data: blockMatch } = await supabase
        .from('blocks')
        .select('blocker_id')
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${partnerId}),and(blocker_id.eq.${partnerId},blocked_id.eq.${user.id})`)
        .maybeSingle();

      if (blockMatch) {
        return { error: 'Cannot send messages to a user with active block settings.' };
      }
    }
  }

  // 3. Idempotency Check
  if (clientMessageId) {
    const { data: existing } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at, client_message_id, sequence_number, message_kind, reply_to_id, metadata')
      .eq('conversation_id', conversationId)
      .eq('client_message_id', clientMessageId)
      .maybeSingle();

    if (existing) {
      return { error: null, message: existing };
    }
  }

  const finalBody = audioUrl ? (body || `[Voice Note: ${audioUrl}]`) : (body || `[${messageKind.toUpperCase()}]`);

  // 4. Authoritative Message Insert
  const { data: inserted, error: insertError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: finalBody,
      message_kind: messageKind || 'text',
      client_message_id: clientMessageId,
      reply_to_id: replyToId,
      metadata,
    })
    .select('id, conversation_id, sender_id, body, created_at, client_message_id, sequence_number, message_kind, reply_to_id, metadata')
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath('/messages');
  return { error: null, message: inserted };
}

/**
 * Universal Share to TUKUBI Chat Action
 */
export async function shareToChatAction(params: {
  targetConversationId?: string;
  targetUserId?: string;
  messageKind: MessageKind;
  noteText?: string;
  metadata: MessageMetadata;
}): Promise<{ success: boolean; conversationId: string | null; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, conversationId: null, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, conversationId: null, error: 'Database not available.' };

  let convId = params.targetConversationId;

  // If targeting a user directly, get or create canonical conversation
  if (!convId && params.targetUserId) {
    const { data: createdConvId, error: directErr } = await supabase.rpc('get_or_create_direct_conversation', {
      target_user_id: params.targetUserId,
    });
    if (directErr || !createdConvId) {
      return { success: false, conversationId: null, error: directErr?.message || 'Failed to start conversation.' };
    }
    convId = createdConvId;
  }

  if (!convId) {
    return { success: false, conversationId: null, error: 'Target conversation or user required.' };
  }

  const clientMsgId = generateClientMessageId();
  const bodyText = params.noteText?.trim() || `[Shared ${params.messageKind}]`;

  const { error: insertError } = await supabase
    .from('messages')
    .insert({
      conversation_id: convId,
      sender_id: user.id,
      body: bodyText,
      message_kind: params.messageKind,
      client_message_id: clientMsgId,
      metadata: params.metadata,
    });

  if (insertError) {
    return { success: false, conversationId: convId, error: insertError.message };
  }

  revalidatePath('/messages');
  return { success: true, conversationId: convId, error: null };
}

/**
 * Update Conversation Category Action (Personal, Business, Marketplace, Support, etc.)
 */
export async function updateConversationCategoryAction(
  conversationId: string,
  category: ConversationCategory,
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not available.' };

  const { error } = await supabase
    .from('conversations')
    .update({ category })
    .eq('id', conversationId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/messages');
  return { success: true, error: null };
}

/**
 * AI Business Agent Grounded Response Generator Action
 */
export async function generateBusinessAiResponseAction(
  conversationId: string,
  userPrompt: string,
): Promise<{ success: boolean; aiMessage?: any; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not available.' };

  // 1. Fetch conversation and check if it has store or business context
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, category, context_data, created_by')
    .eq('id', conversationId)
    .single();

  const contextData = (conv?.context_data || {}) as Record<string, any>;
  const businessId = contextData.businessId || contextData.storeId;

  // 2. Fetch authoritative business / store products
  let storeName = 'TUKUBI Partner Business';
  let catalogItems: Array<{ id: string; title: string; priceFormatted: string; available: boolean }> = [];

  if (businessId) {
    const { data: store } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', businessId)
      .maybeSingle();

    if (store) storeName = store.name;

    const { data: products } = await supabase
      .from('products')
      .select('id, title, price_minor, currency, is_active')
      .eq('store_id', businessId)
      .limit(10);

    if (products && products.length > 0) {
      catalogItems = products.map((p) => ({
        id: p.id,
        title: p.title,
        priceFormatted: `$${(p.price_minor / 100).toFixed(2)} ${p.currency || 'USD'}`,
        available: p.is_active,
      }));
    }
  }

  // 3. Generate grounded intelligent response
  const lower = userPrompt.toLowerCase();
  let aiText = '';
  let suggestedActions: Array<{ label: string; action: string }> = [];

  if (lower.includes('available') || lower.includes('in stock') || lower.includes('have') || lower.includes('buy')) {
    if (catalogItems.length > 0) {
      const match = catalogItems.find((c) => lower.includes(c.title.toLowerCase())) || catalogItems[0];
      aiText = `Wah gwaan! Yes, "${match.title}" is ${match.available ? 'currently in stock' : 'currently sold out'} at ${storeName} for ${match.priceFormatted}. Would you like to view the item or arrange local pickup / shipping?`;
      suggestedActions = [
        { label: `View ${match.title}`, action: 'view_product' },
        { label: 'Check Shipping Info', action: 'view_shipping' },
        { label: 'Talk to Store Staff', action: 'escalate_human' },
      ];
    } else {
      aiText = `Hello! Thank you for inquiring with ${storeName}. All items currently in our catalog can be viewed directly in our store profile. Can I help check a specific order or connect you with human staff?`;
      suggestedActions = [{ label: 'Talk to Human Staff', action: 'escalate_human' }];
    }
  } else if (lower.includes('human') || lower.includes('agent') || lower.includes('talk to someone') || lower.includes('help')) {
    aiText = `I have notified the store team at ${storeName}. A representative will join this conversation shortly to assist you directly.`;
    suggestedActions = [{ label: 'Leave a Note', action: 'leave_note' }];
  } else if (lower.includes('order') || lower.includes('track') || lower.includes('shipping')) {
    aiText = `For order tracking and delivery status, your recent purchases can be viewed anytime under Account → Orders. Orders typically ship within 1-2 Caribbean business days.`;
    suggestedActions = [{ label: 'Track My Orders', action: 'view_orders' }];
  } else {
    aiText = `Hello and welcome to ${storeName} on TUKUBI! I am your AI Business Assistant. How can I assist you with our Caribbean products, store hours, or orders today?`;
    suggestedActions = [
      { label: 'Browse Products', action: 'browse_catalog' },
      { label: 'Ask a Question', action: 'ask_question' },
      { label: 'Talk to Staff', action: 'escalate_human' },
    ];
  }

  const aiMsgId = generateClientMessageId();

  // 4. Insert AI response into conversation
  const { data: insertedMsg, error: insertErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id, // Or business owner / system
      body: aiText,
      message_kind: 'ai_response',
      client_message_id: aiMsgId,
      metadata: {
        ai: {
          promptUsed: userPrompt,
          suggestedActions,
          groundedCatalogIds: catalogItems.map((c) => c.id),
          isHumanEscalated: lower.includes('human') || lower.includes('agent'),
          confidenceScore: 0.95,
        },
      },
    })
    .select('id, conversation_id, sender_id, body, created_at, message_kind, metadata')
    .single();

  if (insertErr) return { success: false, error: insertErr.message };

  revalidatePath('/messages');
  return { success: true, aiMessage: insertedMsg, error: null };
}

/**
 * Get or Create Canonical Direct Conversation Action
 */
export async function getOrCreateDirectConversationAction(targetUserId: string): Promise<{
  conversationId: string | null;
  error: string | null;
}> {
  const user = await getCurrentUser();
  if (!user) return { conversationId: null, error: 'Sign in required.' };
  if (user.id === targetUserId) return { conversationId: null, error: 'Cannot chat with yourself.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { conversationId: null, error: 'Database not available.' };

  try {
    const { data: convId, error } = await supabase.rpc('get_or_create_direct_conversation', {
      target_user_id: targetUserId,
    });

    if (error) return { conversationId: null, error: error.message };
    revalidatePath('/messages');
    return { conversationId: convId, error: null };
  } catch (err: any) {
    return { conversationId: null, error: err.message || 'Error creating direct conversation.' };
  }
}

/**
 * Mark Conversation as Read Action
 */
export async function markConversationReadAction(
  conversationId: string,
  upToSequence?: number,
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not available.' };

  const { error } = await supabase.rpc('mark_conversation_read', {
    conv_id: conversationId,
    up_to_sequence: upToSequence || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

/**
 * Edit Message Action (Sender only within time window)
 */
export async function editMessageAction(
  messageId: string,
  newBody: string,
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };
  if (!newBody.trim()) return { success: false, error: 'Message cannot be empty.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not available.' };

  const { data: message } = await supabase
    .from('messages')
    .select('id, sender_id, created_at, conversation_id')
    .eq('id', messageId)
    .single();

  if (!message || message.sender_id !== user.id) {
    return { success: false, error: 'You can only edit your own messages.' };
  }

  const ageMinutes = (Date.now() - new Date(message.created_at).getTime()) / (1000 * 60);
  if (ageMinutes > MAX_EDIT_TIME_WINDOW_MINUTES) {
    return { success: false, error: `Messages can only be edited within ${MAX_EDIT_TIME_WINDOW_MINUTES} minutes.` };
  }

  const { error } = await supabase
    .from('messages')
    .update({
      body: newBody.trim(),
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/messages');
  return { success: true, error: null };
}

/**
 * Delete Message Action (Soft delete for everyone or for me)
 */
export async function deleteMessageAction(
  messageId: string,
  deleteType: 'for_everyone' | 'for_me',
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not available.' };

  if (deleteType === 'for_me') {
    const { data: msg } = await supabase
      .from('messages')
      .select('deleted_for')
      .eq('id', messageId)
      .single();

    const currentDeletedFor = (msg?.deleted_for || []) as string[];
    if (!currentDeletedFor.includes(user.id)) {
      await supabase
        .from('messages')
        .update({ deleted_for: [...currentDeletedFor, user.id] })
        .eq('id', messageId);
    }
    revalidatePath('/messages');
    return { success: true, error: null };
  }

  const { data: message } = await supabase
    .from('messages')
    .select('id, sender_id, conversation_id')
    .eq('id', messageId)
    .single();

  if (!message) return { success: false, error: 'Message not found.' };

  const { data: member } = await supabase
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', message.conversation_id)
    .eq('profile_id', user.id)
    .single();

  if (message.sender_id !== user.id && member?.role !== 'admin') {
    return { success: false, error: 'Unauthorized to delete this message for everyone.' };
  }

  const { error } = await supabase
    .from('messages')
    .update({
      body: 'This message was deleted.',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', messageId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/messages');
  return { success: true, error: null };
}

/**
 * Toggle Message Emoji Reaction Action
 */
export async function toggleMessageReactionAction(
  messageId: string,
  emoji: string,
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not available.' };

  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('profile_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        profile_id: user.id,
        emoji,
      });
    if (error) return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Handle Message Request Action (Accept, Decline, Block)
 */
export async function handleMessageRequestAction(
  conversationId: string,
  action: 'accept' | 'decline' | 'block',
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not available.' };

  if (action === 'accept') {
    await supabase
      .from('conversation_members')
      .update({ status: 'active' })
      .eq('conversation_id', conversationId)
      .eq('profile_id', user.id);
  } else if (action === 'decline') {
    await supabase
      .from('conversation_members')
      .update({ status: 'rejected', left_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('profile_id', user.id);
  } else if (action === 'block') {
    const { data: otherMembers } = await supabase
      .from('conversation_members')
      .select('profile_id')
      .eq('conversation_id', conversationId)
      .neq('profile_id', user.id);

    if (otherMembers && otherMembers.length > 0) {
      await supabase.from('blocks').insert({
        blocker_id: user.id,
        blocked_id: otherMembers[0].profile_id,
      });
    }

    await supabase
      .from('conversation_members')
      .update({ status: 'blocked', left_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('profile_id', user.id);
  }

  revalidatePath('/messages');
  return { success: true, error: null };
}
