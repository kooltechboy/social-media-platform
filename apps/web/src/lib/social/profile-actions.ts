'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface ProfileUpdateState {
  error: string | null;
  success: string | null;
}

export async function updateProfileAction(
  _prev: ProfileUpdateState,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const displayName = String(formData.get('displayName') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  const website = String(formData.get('website') ?? '').trim();

  if (!displayName || displayName.length < 1)
    return { error: 'Display name is required.', success: null };
  if (displayName.length > 100)
    return { error: 'Display name must be 100 characters or fewer.', success: null };
  if (bio.length > 500)
    return { error: 'Bio must be 500 characters or fewer.', success: null };
  if (website && !/^https?:\/\/.+/.test(website))
    return { error: 'Website must be a valid URL starting with https://.', success: null };

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      bio: bio || null,
      website: website || null,
    })
    .eq('id', user.id);

  if (error) return { error: error.message, success: null };

  revalidatePath('/profile');
  revalidatePath(`/profile/${user.username}`);
  return { error: null, success: 'Profile updated.' };
}

export async function followAction(targetUserId: string): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };
  if (user.id === targetUserId) return { error: 'You cannot follow yourself.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.' };

  const { error } = await supabase
    .from('follows')
    .upsert({ follower_id: user.id, following_id: targetUserId }, { onConflict: 'follower_id,following_id' });

  if (error) return { error: error.message };
  revalidatePath(`/profile/${targetUserId}`);
  return { error: null };
}

export async function unfollowAction(targetUserId: string): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.' };

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);

  if (error) return { error: error.message };
  revalidatePath(`/profile/${targetUserId}`);
  return { error: null };
}
