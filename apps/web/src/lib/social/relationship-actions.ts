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

  revalidatePath('/people');
  revalidatePath('/friends');
  revalidatePath('/members');
  revalidatePath(`/profile/${targetUserId}`);
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

  revalidatePath('/people');
  revalidatePath('/friends');
  revalidatePath('/members');
  revalidatePath(`/profile/${targetUserId}`);
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

  // Check if target is an official platform account (official accounts cannot be friended)
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, username, is_official, relationship_visibility')
    .eq('id', targetUserId)
    .maybeSingle();

  if (!targetProfile) {
    return { success: false, error: 'User not found.' };
  }

  if (targetProfile.is_official || targetProfile.username?.toLowerCase() === 'tukubi') {
    return { success: false, error: 'Official platform accounts cannot be added as friends. You can follow them instead.' };
  }

  // Check if either user has blocked the other
  const { data: blockExists } = await supabase
    .from('blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`)
    .maybeSingle();

  if (blockExists) {
    return { success: false, error: 'Unable to send friend request to this user.' };
  }

  // Check if relationship already exists in either direction
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
      // Reciprocal request auto-accepts
      const { error: acceptErr } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (acceptErr) return { success: false, error: acceptErr.message };

      revalidatePath('/people');
      revalidatePath('/friends');
      revalidatePath('/members');
      revalidatePath(`/profile/${targetUserId}`);
      return { success: true, error: null, data: { status: 'accepted' } };
    }
    if (existing.requester_id === user.id && existing.status === 'pending') {
      return { success: true, error: null, data: { status: 'pending' } };
    }

    // If declined or cancelled, update to pending with current user as requester
    const { error: updateErr } = await supabase
      .from('friendships')
      .update({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateErr) return { success: false, error: updateErr.message };

    revalidatePath('/people');
    revalidatePath('/friends');
    revalidatePath('/members');
    revalidatePath(`/profile/${targetUserId}`);
    return { success: true, error: null, data: { status: 'pending' } };
  }

  const { error } = await supabase
    .from('friendships')
    .insert({
      requester_id: user.id,
      addressee_id: targetUserId,
      status: 'pending',
      updated_at: new Date().toISOString(),
    });

  if (error) return { success: false, error: error.message };

  revalidatePath('/people');
  revalidatePath('/friends');
  revalidatePath('/members');
  revalidatePath(`/profile/${targetUserId}`);
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

  revalidatePath('/people');
  revalidatePath('/friends');
  revalidatePath('/members');
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

  revalidatePath('/people');
  revalidatePath('/friends');
  revalidatePath('/members');
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

  revalidatePath('/people');
  revalidatePath('/friends');
  revalidatePath('/members');
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

  revalidatePath('/people');
  revalidatePath('/friends');
  revalidatePath('/members');
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

  revalidatePath('/people');
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

  revalidatePath('/people');
  revalidatePath('/friends');
  revalidatePath('/members');
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

export interface BatchRelationshipItem {
  state: RelationshipState;
  isFollowing: boolean;
  isFollower: boolean;
  friendshipStatus: string;
  isBlocked: boolean;
}

/**
 * Batch resolve relationship states for a list of target user IDs
 */
export async function getRelationshipBatchAction(
  targetUserIds: string[]
): Promise<Record<string, BatchRelationshipItem>> {
  const user = await getCurrentUser();
  const map: Record<string, BatchRelationshipItem> = {};

  if (!user || targetUserIds.length === 0) {
    targetUserIds.forEach((id) => {
      map[id] = { state: 'none', isFollowing: false, isFollower: false, friendshipStatus: 'none', isBlocked: false };
    });
    return map;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return map;

  const [followsRes, followersRes, friendsRes, blocksRes] = await Promise.all([
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', targetUserIds),
    supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', user.id)
      .in('follower_id', targetUserIds),
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
  const followerSet = new Set((followersRes.data || []).map((f) => f.follower_id));
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
    const isFollower = followerSet.has(id);
    const isBlocked = blockedSet.has(id);
    const fStatus = friendshipMap[id] || 'none';

    const state = resolvePrimaryRelationshipState({
      isBlocked,
      isFollowing,
      isFollower,
      friendshipStatus: fStatus,
    });

    map[id] = { state, isFollowing, isFollower, friendshipStatus: fStatus, isBlocked };
  });

  return map;
}

export interface ProfileFriendItem {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  countryIso?: string | null;
  isVerified: boolean;
  friendsSince?: string;
  mutualCount: number;
}

/**
 * Loads friends for a target user profile respecting privacy permissions
 */
export async function fetchProfileFriendsAction(
  targetUserId: string,
  page: number = 1,
  limit: number = 24
): Promise<{
  friends: ProfileFriendItem[];
  isRestricted: boolean;
  totalCount: number;
}> {
  const [currentUser, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  if (!supabase) return { friends: [], isRestricted: false, totalCount: 0 };

  const offset = (page - 1) * limit;

  // Try RPC get_profile_friends first
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_profile_friends', {
      target_user_id: targetUserId,
      viewer_id: currentUser?.id || null,
      limit_count: limit,
      offset_count: offset,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      const friends: ProfileFriendItem[] = rpcData.map((row: any) => ({
        id: row.friend_id,
        displayName: row.display_name || row.username || 'Caribbean Member',
        username: row.username,
        avatarUrl: row.avatar_url,
        bio: row.bio,
        countryIso: row.country_iso,
        isVerified: !!row.is_verified,
        friendsSince: row.friends_since,
        mutualCount: row.mutual_friends_count || 0,
      }));

      return {
        friends,
        isRestricted: false,
        totalCount: friends.length,
      };
    }
  } catch {
    // Fallback below
  }

  // Fallback: Direct query on accepted friendships
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('relationship_visibility')
    .eq('id', targetUserId)
    .maybeSingle();

  const visibility = targetProfile?.relationship_visibility || 'public';
  const isSelf = currentUser?.id === targetUserId;

  if (!isSelf && visibility === 'private') {
    return { friends: [], isRestricted: true, totalCount: 0 };
  }

  const { data: frRows } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, created_at, updated_at')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!frRows || frRows.length === 0) {
    return { friends: [], isRestricted: false, totalCount: 0 };
  }

  const friendIds = frRows.map((f) => (f.requester_id === targetUserId ? f.addressee_id : f.requester_id));

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, bio, origin_country_iso, is_verified')
    .in('id', friendIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const friends: ProfileFriendItem[] = friendIds.map((id) => {
    const p = profileMap.get(id);
    return {
      id,
      displayName: p?.display_name || p?.username || 'Caribbean Member',
      username: p?.username || id.slice(0, 8),
      avatarUrl: p?.avatar_url,
      bio: p?.bio,
      countryIso: p?.origin_country_iso,
      isVerified: !!p?.is_verified,
      mutualCount: 0,
    };
  });

  return {
    friends,
    isRestricted: false,
    totalCount: friends.length,
  };
}
