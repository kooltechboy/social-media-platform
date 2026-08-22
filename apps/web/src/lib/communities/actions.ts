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

  const policy = new CommunityPolicy({
    id: community.id,
    join_policy: community.join_policy as 'public' | 'private' | 'invite_only',
    member_count: community.member_count,
  });

  const memberStatus = existing?.membership_status as 'active' | 'banned' | 'pending' | undefined;
  const canJoin = policy.canJoin(memberStatus);
  if (!canJoin) {
    return { error: 'This community requires an invitation to join.', success: null };
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

  const slug = CommunityPolicy.slugify(name);

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
