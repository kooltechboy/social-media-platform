import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export async function createModerationSupabaseClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createAnonSupabaseClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
}

export interface ModeratorUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export async function getModeratorSession(): Promise<ModeratorUser | null> {
  const anonClient = await createAnonSupabaseClient();
  if (!anonClient) return null;
  const { data, error } = await anonClient.auth.getUser();
  if (error || !data.user) return null;

  // Verify moderator or admin role via service client
  const modClient = await createModerationSupabaseClient();
  if (!modClient) {
    return null; // Without service role client, deny moderation access
  }

  const { data: account } = await modClient
    .from('accounts')
    .select('role, status')
    .or(`profile_id.eq.${data.user.id},id.eq.${data.user.id}`)
    .maybeSingle();

  if (!account) {
    return null; // No account record — user has no moderator privileges
  }

  if (account.status && account.status !== 'active') {
    return null; // Account suspended or deactivated
  }

  if (!['moderator', 'admin', 'management', 'superadmin', 'super_admin'].includes(account.role)) {
    return null; // Not authorized as moderator
  }

  const role = account.role;

  const profileResult = await anonClient
    .from('profiles')
    .select('display_name')
    .eq('id', data.user.id)
    .maybeSingle();
  const profile = profileResult.data as { display_name: string } | null;

  return {
    id: data.user.id,
    email: data.user.email ?? '',
    displayName: profile?.display_name ?? data.user.email ?? 'Moderator',
    role,
  };
}
