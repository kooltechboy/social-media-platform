'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { CommunityPolicy } from '@caribbean/communities';

export interface CommunityActionState {
  error: string | null;
  success: string | null;
}

export async function joinCommunityAction(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const communityId = String(formData.get('communityId') ?? '').trim();
  if (!communityId) return { error: 'Missing community ID.', success: null };

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to join communities.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { data: community, error: fetchErr } = await supabase
    .from('communities')
    .select('id, join_policy, member_count')
    .eq('id', communityId)
    .maybeSingle();

  if (fetchErr || !community) return { error: 'Community not found.', success: null };

  const { data: existing } = await supabase
    .from('community_members')
    .select('membership_status')
    .eq('community_id', communityId)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (existing) {
    if (existing.membership_status === 'active')
      return { error: 'You are already a member.', success: null };
    if (existing.membership_status === 'banned')
      return { error: 'You are not permitted to join this community.', success: null };
  }

  const policy = new CommunityPolicy();
  const decision = policy.canJoin(
    community.join_policy as 'public' | 'private' | 'invite_only',
    { hasInvite: false },
  );
  if (!decision.allowed) {
    return { error: decision.reason ?? 'This community requires an invitation to join.', success: null };
  }

  const membershipStatus =
    community.join_policy === 'public' ? 'active' : 'pending';

  const { error: insertErr } = await supabase.from('community_members').upsert(
    {
      community_id: communityId,
      profile_id: user.id,
      membership_status: membershipStatus,
    },
    { onConflict: 'community_id,profile_id' },
  );

  if (insertErr) return { error: insertErr.message, success: null };

  if (membershipStatus === 'active') {
    await supabase
      .from('communities')
      .update({ member_count: community.member_count + 1 })
      .eq('id', communityId);
  }

  revalidatePath('/communities');
  return {
    error: null,
    success:
      membershipStatus === 'active'
        ? 'You have joined this community.'
        : 'Your request to join has been submitted.',
  };
}

export async function leaveCommunityAction(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const communityId = String(formData.get('communityId') ?? '').trim();
  if (!communityId) return { error: 'Missing community ID.', success: null };

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { data: community } = await supabase
    .from('communities')
    .select('id, member_count, created_by')
    .eq('id', communityId)
    .maybeSingle();

  if (!community) return { error: 'Community not found.', success: null };
  if (community.created_by === user.id)
    return { error: 'Community owners cannot leave. Transfer ownership first.', success: null };

  const { error: delErr } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('profile_id', user.id);

  if (delErr) return { error: delErr.message, success: null };

  const newCount = Math.max(0, (community.member_count ?? 1) - 1);
  await supabase
    .from('communities')
    .update({ member_count: newCount })
    .eq('id', communityId);

  revalidatePath('/communities');
  return { error: null, success: 'You have left this community.' };
}

export async function createCommunityAction(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const joinPolicy = String(formData.get('joinPolicy') ?? 'public') as
    | 'public'
    | 'private'
    | 'invite_only';
  const countryIso = String(formData.get('countryIso') ?? '').trim() || null;

  if (!name || name.length < 3) return { error: 'Name must be at least 3 characters.', success: null };

  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in to create a community.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const policy = new CommunityPolicy();
  const slug = policy.slugify(name);

  const { error: insertErr } = await supabase.from('communities').insert({
    name,
    slug: `${slug}-${Date.now().toString(36)}`,
    description: description || null,
    join_policy: joinPolicy,
    country_iso: countryIso,
    created_by: user.id,
    member_count: 1,
  });

  if (insertErr) return { error: insertErr.message, success: null };

  revalidatePath('/communities');
  return { error: null, success: 'Community created.' };
}

export async function fetchCommunityAction(slug: string): Promise<{ community: any | null; isMember: boolean; userRole: string | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { community: null, isMember: false, userRole: null, error: 'Service unavailable.' };

  const user = await getCurrentUser();

  const { data: community, error } = await supabase
    .from('communities')
    .select('id, name, slug, description, rules, join_policy, country_iso, avatar_url, cover_storage_path, member_count, is_archived, created_by, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !community) {
    return { community: null, isMember: false, userRole: null, error: 'Community not found.' };
  }

  let isMember = false;
  let userRole: string | null = null;

  if (user) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('membership_status, role')
      .eq('community_id', community.id)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (membership && membership.membership_status === 'active') {
      isMember = true;
      userRole = membership.role || 'member';
    }
  }

  return { community, isMember, userRole, error: null };
}

export async function updateCommunityAction(
  communityId: string,
  formData: FormData
): Promise<{ error: string | null; success?: string; slug?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.' };

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, created_by')
    .eq('id', communityId)
    .maybeSingle();

  if (!community) return { error: 'Community not found.' };

  // Authorization: check creator or admin
  let isAuthorized = community.created_by === user.id;
  if (!isAuthorized) {
    const { data: adminMem } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('profile_id', user.id)
      .eq('membership_status', 'active')
      .in('role', ['admin', 'moderator'])
      .maybeSingle();
    isAuthorized = Boolean(adminMem);
  }

  if (!isAuthorized) {
    return { error: 'You are not authorized to update this community hub.' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const rules = String(formData.get('rules') ?? '').trim();
  const joinPolicy = String(formData.get('joinPolicy') ?? 'public') as 'public' | 'private' | 'invite_only';
  const avatarUrl = String(formData.get('avatarUrl') ?? '').trim() || null;

  if (!name || name.length < 3) {
    return { error: 'Community name must be at least 3 characters.' };
  }

  const { error: updateErr } = await supabase
    .from('communities')
    .update({
      name,
      description: description || null,
      rules: rules || null,
      join_policy: joinPolicy,
      avatar_url: avatarUrl,
    })
    .eq('id', communityId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath('/communities');
  revalidatePath(`/communities/${community.slug}`);
  revalidatePath(`/communities/${community.slug}/manage`);
  return { error: null, success: 'Community settings updated.', slug: community.slug };
}

export async function archiveCommunityAction(
  communityId: string
): Promise<{ error: string | null; isArchived?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.' };

  const { data: community } = await supabase
    .from('communities')
    .select('id, slug, is_archived, created_by')
    .eq('id', communityId)
    .maybeSingle();

  if (!community || community.created_by !== user.id) {
    return { error: 'Only the community creator can archive this hub.' };
  }

  const nextArchived = !community.is_archived;
  const { error: updateErr } = await supabase
    .from('communities')
    .update({
      is_archived: nextArchived,
      archived_at: nextArchived ? new Date().toISOString() : null,
    })
    .eq('id', communityId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath('/communities');
  revalidatePath(`/communities/${community.slug}`);
  revalidatePath(`/communities/${community.slug}/manage`);
  return { error: null, isArchived: nextArchived };
}

export async function deleteCommunityAction(
  communityId: string,
  confirmationName: string
): Promise<{ error: string | null; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.' };

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, created_by')
    .eq('id', communityId)
    .maybeSingle();

  if (!community || community.created_by !== user.id) {
    return { error: 'Only the community creator can permanently delete this hub.' };
  }

  if (confirmationName.trim().toLowerCase() !== community.name.trim().toLowerCase()) {
    return { error: `Confirmation name does not match "${community.name}". Deletion cancelled for safety.` };
  }

  // If currently operating as this community identity, reset active identity
  try {
    await supabase
      .from('user_active_identity')
      .delete()
      .eq('user_id', user.id)
      .eq('identity_id', communityId);
  } catch {
    // non-blocking
  }

  const { error: delErr } = await supabase
    .from('communities')
    .delete()
    .eq('id', communityId)
    .eq('created_by', user.id);

  if (delErr) return { error: delErr.message };

  revalidatePath('/communities');
  revalidatePath('/');
  return { error: null, success: true };
}

