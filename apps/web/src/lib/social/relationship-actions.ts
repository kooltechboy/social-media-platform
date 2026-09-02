'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { type RelationshipState, resolvePrimaryRelationshipState } from '@caribbean/social';

export interface ActionResult<T = unknown> {
  success: boolean;
  error: string | null;
  data?: T;
}

/**
 * Follow a user
 */
export async function followUserAction(targetUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };
  if (user.id === targetUserId) return { success: false, error: 'You cannot follow yourself.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('follows')
    .upsert({ follower_id: user.id, following_id: targetUserId }, { onConflict: 'follower_id,following_id' });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath('/friends');
  revalidatePath('/members');
  return { success: true, error: null };
}

/**
 * Unfollow a user
 */
export async function unfollowUserAction(targetUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath('/friends');
  revalidatePath('/members');
  return { success: true, error: null };
}

/**
 * Send a friend request
 */
export async function sendFriendRequestAction(targetUserId: string): Promise<ActionResult<{ status: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };
  if (user.id === targetUserId) return { success: false, error: 'You cannot add yourself as friend.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  // Check if reciprocal request already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') {
      return { success: true, error: null, data: { status: 'accepted' } };
    }
    if (existing.requester_id === targetUserId && existing.status === 'pending') {
      // Auto-accept if they already sent a request to current user
      const { error: acceptErr } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (acceptErr) return { success: false, error: acceptErr.message };
      return { success: true, error: null, data: { status: 'accepted' } };
    }
  }

  const { error } = await supabase
    .from('friendships')
    .upsert({
      requester_id: user.id,
      addressee_id: targetUserId,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'requester_id,addressee_id' });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath('/friends');
  revalidatePath('/members');
  return { success: true, error: null, data: { status: 'pending' } };
}

/**
 * Accept an incoming friend request
 */
export async function acceptFriendRequestAction(targetUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .match({ requester_id: targetUserId, addressee_id: user.id });

  if (error) return { success: false, error: error.message };

  revalidatePath('/friends');
  revalidatePath(`/profile/${targetUserId}`);
  return { success: true, error: null };
}

/**
 * Decline an incoming friend request
 */
export async function declineFriendRequestAction(targetUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('friendships')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .match({ requester_id: targetUserId, addressee_id: user.id });

  if (error) return { success: false, error: error.message };

  revalidatePath('/friends');
  return { success: true, error: null };
}

/**
 * Cancel an outgoing friend request
 */
export async function cancelFriendRequestAction(targetUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('friendships')
    .delete()
    .match({ requester_id: user.id, addressee_id: targetUserId, status: 'pending' });

  if (error) return { success: false, error: error.message };

  revalidatePath('/friends');
  revalidatePath(`/profile/${targetUserId}`);
  return { success: true, error: null };
}

/**
 * Unfriend / Remove friendship
 */
export async function unfriendAction(targetUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`);

  if (error) return { success: false, error: error.message };

  revalidatePath('/friends');
  revalidatePath(`/profile/${targetUserId}`);
  return { success: true, error: null };
}

/**
 * Block a user
 */
export async function blockUserAction(targetUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  // Remove existing follows & friendships first
  await Promise.all([
    supabase.from('follows').delete().or(`and(follower_id.eq.${user.id},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${user.id})`),
    supabase.from('friendships').delete().or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`),
  ]);

  const { error } = await supabase
    .from('blocks')
    .upsert({ blocker_id: user.id, blocked_id: targetUserId });

  if (error) return { success: false, error: error.message };

  revalidatePath('/friends');
  revalidatePath('/members');
  return { success: true, error: null };
}

/**
 * Unblock a user
 */
export async function unblockUserAction(targetUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/friends');
  return { success: true, error: null };
}

/**
 * Dismiss a recommendation
 */
export async function dismissRecommendationAction(
  entityType: string,
  entityId: string,
  action: 'dismiss' | 'not_interested' | 'hide' = 'dismiss',
  reason?: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const { error } = await supabase
    .from('recommendation_feedback')
    .upsert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      action,
      reason: reason || null,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,entity_type,entity_id' });

  if (error) return { success: false, error: error.message };

  revalidatePath('/friends');
  revalidatePath('/members');
  revalidatePath('/search');
  return { success: true, error: null };
}

/**
 * Batch resolve relationship states for a list of target user IDs
 */
export async function getRelationshipBatchAction(
  targetUserIds: string[]
): Promise<Record<string, { state: RelationshipState; isFollowing: boolean; friendshipStatus: string }>> {
  const user = await getCurrentUser();
  const map: Record<string, { state: RelationshipState; isFollowing: boolean; friendshipStatus: string }> = {};

  if (!user || targetUserIds.length === 0) {
    targetUserIds.forEach((id) => {
      map[id] = { state: 'none', isFollowing: false, friendshipStatus: 'none' };
    });
    return map;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return map;

  const [followsRes, friendsRes, blocksRes] = await Promise.all([
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', targetUserIds),
    supabase
      .from('friendships')
      .select('requester_id, addressee_id, status')
      .or(`and(requester_id.eq.${user.id},addressee_id.in.(${targetUserIds.join(',')})),and(addressee_id.eq.${user.id},requester_id.in.(${targetUserIds.join(',')}))`),
    supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id)
      .in('blocked_id', targetUserIds),
  ]);

  const followingSet = new Set((followsRes.data || []).map((f) => f.following_id));
  const blockedSet = new Set((blocksRes.data || []).map((b) => b.blocked_id));

  const friendshipMap: Record<string, 'pending_sent' | 'pending_received' | 'accepted' | 'declined'> = {};
  (friendsRes.data || []).forEach((fr) => {
    if (fr.status === 'accepted') {
      const otherId = fr.requester_id === user.id ? fr.addressee_id : fr.requester_id;
      friendshipMap[otherId] = 'accepted';
    } else if (fr.status === 'pending') {
      if (fr.requester_id === user.id) {
        friendshipMap[fr.addressee_id] = 'pending_sent';
      } else {
        friendshipMap[fr.requester_id] = 'pending_received';
      }
    } else if (fr.status === 'declined') {
      const otherId = fr.requester_id === user.id ? fr.addressee_id : fr.requester_id;
      friendshipMap[otherId] = 'declined';
    }
  });

  targetUserIds.forEach((id) => {
    const isFollowing = followingSet.has(id);
    const isBlocked = blockedSet.has(id);
    const fStatus = friendshipMap[id] || 'none';

    const state = resolvePrimaryRelationshipState({
      isBlocked,
      isFollowing,
      friendshipStatus: fStatus,
    });

    map[id] = { state, isFollowing, friendshipStatus: fStatus };
  });

  return map;
}
