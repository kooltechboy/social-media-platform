'use server';

import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { resolveUserForMessaging, type CanonicalMessagingUser } from './identity';

export interface DirectConversationResult {
  conversationId: string | null;
  targetProfile?: CanonicalMessagingUser | null;
  error: string | null;
}

/**
 * Authoritative Direct Conversation Resolver for TUKUBI
 *
 * 1. Resolves target identifier (username or UUID) to canonical profile identity.
 * 2. Validates authentication and self-message guards.
 * 3. Checks bidirectional blocks between current user and target user.
 * 4. Invokes database RPC `get_or_create_direct_conversation`.
 * 5. If RPC fails or is unavailable, atomically falls back to direct
 *    conversations and conversation_members operations with canonical_pair.
 */
export async function getOrCreateDirectConversation(
  targetIdentifier: string,
  providedUserId?: string,
  client?: any
): Promise<DirectConversationResult> {
  const currentUserId = providedUserId || (await getCurrentUser())?.id;
  if (!currentUserId) {
    return { conversationId: null, targetProfile: null, error: 'Sign in to start messaging.' };
  }

  // 1. Early self-message guard
  if (currentUserId === targetIdentifier) {
    return { conversationId: null, targetProfile: null, error: 'Cannot start conversation with yourself.' };
  }

  // 2. Resolve canonical target user
  const { user: targetProfile, error: resolveErr } = await resolveUserForMessaging(targetIdentifier, client);
  if (resolveErr || !targetProfile) {
    return { conversationId: null, targetProfile: null, error: resolveErr || 'User not found.' };
  }

  const targetUserId = targetProfile.id;

  // 3. Self-message guard after resolution
  if (currentUserId === targetUserId) {
    return { conversationId: null, targetProfile, error: 'Cannot start conversation with yourself.' };
  }

  const supabase = client || (await createSupabaseServerClient());
  if (!supabase) {
    return { conversationId: null, targetProfile, error: 'Database service is unavailable.' };
  }

  // 3. Bidirectional Block Check
  try {
    const { data: blockMatch } = await supabase
      .from('blocks')
      .select('blocker_id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUserId})`)
      .maybeSingle();

    if (blockMatch) {
      return { conversationId: null, targetProfile, error: 'This user is not available for messaging.' };
    }
  } catch (blockErr) {
    console.warn('[DirectConversation] Block check warning:', blockErr);
  }

  // 4. Try Database RPC First
  try {
    const { data: convId, error: rpcError } = await supabase.rpc('get_or_create_direct_conversation', {
      target_user_id: targetUserId,
    });

    if (!rpcError && convId) {
      return { conversationId: convId, targetProfile, error: null };
    }

    if (rpcError) {
      const msg = rpcError.message?.toLowerCase() || '';
      if (msg.includes('friends_only')) {
        return { conversationId: null, targetProfile, error: 'This member only receives messages from friends.' };
      }
      if (msg.includes('messaging_disabled')) {
        return { conversationId: null, targetProfile, error: "This member isn't accepting new messages right now." };
      }
      if (msg.includes('block') || msg.includes('user_blocked')) {
        return { conversationId: null, targetProfile, error: 'This user is not available for messaging.' };
      }
      if (msg.includes('cannot_message_self')) {
        return { conversationId: null, targetProfile, error: 'Cannot start conversation with yourself.' };
      }
      if (msg.includes('target_user_not_found')) {
        return { conversationId: null, targetProfile, error: 'Target user could not be located.' };
      }
      if (msg.includes('authentication_required')) {
        return { conversationId: null, targetProfile, error: 'Sign in to start messaging.' };
      }
      console.warn('[DirectConversation] RPC error, falling back to direct operations:', rpcError.message);
    }
  } catch (rpcEx: any) {
    console.warn('[DirectConversation] RPC exception, falling back to direct operations:', rpcEx?.message);
  }

  // 5. Fallback: Table lookup & creation with symmetric canonical_pair
  try {
    const pairKey = currentUserId < targetUserId
      ? `${currentUserId}:${targetUserId}`
      : `${targetUserId}:${currentUserId}`;

    // A. Query existing conversation by canonical_pair
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('canonical_pair', pairKey)
      .maybeSingle();

    if (existingConv) {
      // Ensure current user & target memberships are active
      await supabase
        .from('conversation_members')
        .update({ left_at: null, status: 'active' })
        .eq('conversation_id', existingConv.id)
        .in('profile_id', [currentUserId, targetUserId]);

      return { conversationId: existingConv.id, targetProfile, error: null };
    }

    // B. No existing direct conversation found — create new one
    const { data: newConv, error: createConvErr } = await supabase
      .from('conversations')
      .insert({
        kind: 'direct',
        created_by: currentUserId,
        canonical_pair: pairKey,
        last_sequence_number: 0,
        title: null,
      })
      .select('id')
      .single();

    if (createConvErr || !newConv) {
      // If unique violation occurred due to race condition, re-fetch
      const { data: racedConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('canonical_pair', pairKey)
        .maybeSingle();

      if (racedConv) {
        return { conversationId: racedConv.id, targetProfile, error: null };
      }

      console.error('[DirectConversation] Failed to create conversation record:', createConvErr);
      return { conversationId: null, targetProfile, error: 'Could not create direct conversation.' };
    }

    // C. Add both members
    const membersToInsert = [
      { conversation_id: newConv.id, profile_id: currentUserId, role: 'member', status: 'active' },
      { conversation_id: newConv.id, profile_id: targetUserId, role: 'member', status: 'active' },
    ];

    const { error: addMembersErr } = await supabase
      .from('conversation_members')
      .upsert(membersToInsert, { onConflict: 'conversation_id,profile_id' });

    if (addMembersErr) {
      console.error('[DirectConversation] Failed to insert conversation members:', addMembersErr);
      return { conversationId: null, targetProfile, error: 'Could not add members to direct conversation.' };
    }

    return { conversationId: newConv.id, targetProfile, error: null };
  } catch (err: any) {
    console.error('[DirectConversation] Fatal error resolving direct conversation:', err);
    return { conversationId: null, targetProfile, error: 'Failed to start conversation. Please try again.' };
  }
}
