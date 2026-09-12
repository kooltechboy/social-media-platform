'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { calculateAge, resolveAgeTier, getSafetySettingsForTier } from './age-service';

export interface AgeVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  ageTier?: string;
}

/**
 * Updates the user's verified date of birth and calculates regulatory age tier.
 */
export async function updateAgeVerificationAction(
  dateOfBirth: string
): Promise<AgeVerificationResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Authentication required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const parsedDob = new Date(dateOfBirth);
  if (isNaN(parsedDob.getTime())) {
    return { success: false, error: 'Please enter a valid date of birth.' };
  }

  const age = calculateAge(parsedDob);
  if (age < 0 || age > 130) {
    return { success: false, error: 'Please enter a realistic date of birth.' };
  }

  const tier = resolveAgeTier(age);
  const safetySettings = getSafetySettingsForTier(tier);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      date_of_birth: dateOfBirth,
      age_tier: tier,
      age_verification_status: tier === 'under_13' ? 'pending' : 'verified_self',
      minor_safety_settings: safetySettings,
    })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message || 'Failed to update age verification.' };
  }

  revalidatePath('/settings');
  revalidatePath('/');

  return {
    success: true,
    message: 'Age verification updated successfully.',
    ageTier: tier,
  };
}

/**
 * Links an under-18 minor account to a parent or legal guardian's TUKUBI profile.
 */
export async function linkParentGuardianAction(
  parentUsername: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Authentication required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Service unavailable.' };

  const cleanUsername = parentUsername.replace(/^@/, '').trim().toLowerCase();

  const { data: parentProfile, error: parentErr } = await supabase
    .from('profiles')
    .select('id, age_tier')
    .ilike('username', cleanUsername)
    .maybeSingle();

  if (parentErr || !parentProfile) {
    return { success: false, error: `Parent account @${cleanUsername} was not found.` };
  }

  if (parentProfile.id === user.id) {
    return { success: false, error: 'You cannot link your own account as a parent.' };
  }

  const { error: linkErr } = await supabase
    .from('profiles')
    .update({
      parent_profile_id: parentProfile.id,
      age_verification_status: 'pending',
    })
    .eq('id', user.id);

  if (linkErr) {
    return { success: false, error: linkErr.message || 'Failed to link parent account.' };
  }

  revalidatePath('/settings');
  return {
    success: true,
    message: `Parent consent request sent to @${cleanUsername}.`,
  };
}
