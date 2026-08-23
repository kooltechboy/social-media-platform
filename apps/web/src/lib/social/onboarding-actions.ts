'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export async function updateOnboardingIdentity(
  originCountryIso: string,
  diasporaHubId: string | null
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: 'Database service unavailable' };
  }

  // Update or insert profile_identity
  const { error } = await supabase.from('profile_identity').upsert({
    profile_id: user.id,
    origin_country_iso: originCountryIso,
    diaspora_hub_id: diasporaHubId || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to update onboarding identity', error);
    return { error: 'Could not save identity profile' };
  }

  revalidatePath('/');
  return { success: true };
}
