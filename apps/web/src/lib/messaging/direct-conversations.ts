'use server';

import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface DirectConversationResult {
  conversationId: string | null;
  error: string | null;
}

/**
 * Resilient Direct Conversation Resolver
 *
 * 1. Validates authentication and self-message guards.
 * 2. Checks blocks between current user and target user.
 * 3. Attempts database RPC `get_or_create_direct_conversation`.
 * 4. If RPC is not found (PGRST202) or fails, atomically falls back to direct
 *    conversations and conversation_members table operations.
 */
export async function getOrCreateDirectConversation(
  targetUserId: string,
  providedUserId?: string
): Promise<DirectConversationResult> {
  const currentUserId = providedUserId || (await getCurrentUser())?.id;
  if (!currentUserId) {
    return { conversationId: null, error: 'Sign in to start messaging.' };
  }

  if (currentUserId === targetUserId) {
    return { conversationId: null, error: 'Cannot start conversation with yourself.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { conversationId: null, error: 'Database service is unavailable.' };
  }

  // 1. Block Check
  try {
    const { data: blockMatch } = await supabase
      .from('blocks')
      .select('blocker_id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUserId})`)
      .maybeSingle();

    if (blockMatch) {
      return { conversationId: null, error: 'This user is not available for messaging.' };
    }
  } catch (blockErr) {
    console.warn('[DirectConversation] Block check warning:', blockErr);
  }

  // 2. Try RPC first
  try {
    const { data: convId, error: rpcError } = await supabase.rpc('get_or_create_direct_conversation', {
      target_user_id: targetUserId,
    });

    if (!rpcError && convId) {
      return { conversationId: convId, error: null };
    }

    if (rpcError) {
      if (rpcError.message?.toLowerCase().includes('block')) {
        return { conversationId: null, error: 'This user is not available for messaging.' };
      }
      console.warn('[DirectConversation] RPC unavailable or error, falling back to direct table operations:', rpcError.message);
    }
  } catch (rpcEx: any) {
    console.warn('[DirectConversation] RPC exception, falling back to direct table operations:', rpcEx?.message);
  }

  // 3. Fallback: Direct Table Lookup & Creation
  try {
    // A. Query existing direct conversations for current user
    const { data: myMemberships, error: memErr } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations!inner(id, kind)')
      .eq('profile_id', currentUserId)
      .eq('conversations.kind', 'direct');

    if (memErr) {
      console.error('[DirectConversation] Membership query error:', memErr);
    }

    const convIds = (myMemberships || []).map((m: any) => m.conversation_id).filter(Boolean);

    if (convIds.length > 0) {
      // Check if target user belongs to any of these conversations
      const { data: sharedMembership, error: sharedErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('profile_id', targetUserId)
        .maybeSingle();

      if (!sharedErr && sharedMembership?.conversation_id) {
        const existingConvId = sharedMembership.conversation_id;

        // Ensure current user membership is active (left_at = null)
        await supabase
          .from('conversation_members')
          .update({ left_at: null })
          .eq('conversation_id', existingConvId)
          .eq('profile_id', currentUserId);

        return { conversationId: existingConvId, error: null };
      }
    }

    // B. No existing direct conversation found — create new one
    const { data: newConv, error: createConvErr } = await supabase
      .from('conversations')
      .insert({
        kind: 'direct',
        created_by: currentUserId,
        title: null,
      })
      .select('id')
      .single();

    if (createConvErr || !newConv) {
      console.error('[DirectConversation] Failed to create conversation record:', createConvErr);
      return { conversationId: null, error: 'Could not create direct conversation.' };
    }

    // C. Add both members
    const membersToInsert = [
      { conversation_id: newConv.id, profile_id: currentUserId, role: 'member' },
      { conversation_id: newConv.id, profile_id: targetUserId, role: 'member' },
    ];

    const { error: addMembersErr } = await supabase
      .from('conversation_members')
      .insert(membersToInsert);

    if (addMembersErr) {
      console.error('[DirectConversation] Failed to insert conversation members:', addMembersErr);
      return { conversationId: null, error: 'Could not add members to direct conversation.' };
    }

    return { conversationId: newConv.id, error: null };
  } catch (err: any) {
    console.error('[DirectConversation] Fatal error resolving direct conversation:', err);
    return { conversationId: null, error: 'Failed to start conversation. Please try again.' };
  }
}
