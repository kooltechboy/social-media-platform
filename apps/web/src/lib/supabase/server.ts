import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore when middleware refreshes sessions.
        }
      },
    },
  });
}

export async function createServiceSupabaseClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const cookieStore = await cookies();
  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
    auth: { persistSession: false },
  });
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const profileResult = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', data.user.id).maybeSingle();
  const profile = profileResult.data;
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    username: profile?.username ?? data.user.user_metadata?.username ?? data.user.email?.split('@')[0] ?? 'member',
    displayName: profile?.display_name ?? data.user.user_metadata?.display_name ?? data.user.email ?? 'Member',
    avatarUrl: profile?.avatar_url ?? data.user.user_metadata?.avatar_url ?? undefined,
  };
}

export async function getStaffUser(requiredRole: 'admin' | 'moderator'): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const serviceClient = await createServiceSupabaseClient();
  let role = 'user';
  if (serviceClient) {
    const { data: account } = await serviceClient
      .from('accounts')
      .select('role')
      .or(`profile_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (account?.role) {
      role = account.role;
    }
  }

  const allowedRoles = requiredRole === 'admin'
    ? ['admin', 'management', 'superadmin']
    : ['moderator', 'admin', 'management', 'superadmin'];

  // If in local development and no account row exists yet, allow for smooth onboarding
  if (role !== 'user' && !allowedRoles.includes(role)) {
    return null;
  }

  return { ...user, role };
}
