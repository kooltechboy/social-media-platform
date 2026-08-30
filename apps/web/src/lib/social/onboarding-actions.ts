'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import { isLocale, DEFAULT_LOCALE } from '@caribbean/localization';

export async function updateOnboardingIdentity(
  originCountryIso: string,
  diasporaHubId: string | null,
  languagePreference?: string
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

  // Save language preference if provided
  if (languagePreference && isLocale(languagePreference)) {
    await supabase
      .from('profiles')
      .update({
        language_preference: languagePreference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    try {
      const cookieStore = await cookies();
      cookieStore.set('tukubi_locale', languagePreference, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      });
    } catch {
      // Non-blocking
    }
  }

  revalidatePath('/');
  return { success: true };
}
