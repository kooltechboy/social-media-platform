'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface FeatureFlagUpdateState {
  error: string | null;
  success: string | null;
}

export async function toggleFeatureFlagAction(
  _prev: FeatureFlagUpdateState,
  formData: FormData,
): Promise<FeatureFlagUpdateState> {
  const flagKey = String(formData.get('flagKey') ?? '').trim();
  const enabled = formData.get('enabled') === 'true';

  if (!flagKey) return { error: 'Missing flag key.', success: null };

  const user = await getCurrentUser();
  if (!user) return { error: 'Authentication required.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled })
    .eq('key', flagKey);

  if (error) return { error: error.message, success: null };

  revalidatePath('/admin');
  return { error: null, success: `Flag '${flagKey}' set to ${enabled ? 'ON' : 'OFF'}.` };
}
