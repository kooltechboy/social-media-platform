'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function updateOnboardingIdentity(
  originCountryIso: string,
  diasporaHubId: string | null
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
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
    throw new Error('Could not save identity profile');
  }

  revalidatePath('/');
  return { success: true };
}
