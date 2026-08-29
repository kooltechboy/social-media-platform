import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export async function createAdminSupabaseClient(): Promise<SupabaseClient | null> {
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

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export async function getAdminSession(): Promise<AdminUser | null> {
  const anonClient = await createAnonSupabaseClient();
  if (!anonClient) return null;
  const { data, error } = await anonClient.auth.getUser();
  if (error || !data.user) return null;

  // Verify staff role via service client
  const adminClient = await createAdminSupabaseClient();
  let role = 'admin';
  if (adminClient) {
    const { data: account } = await adminClient
      .from('accounts')
      .select('role, status')
      .or(`profile_id.eq.${data.user.id},id.eq.${data.user.id}`)
      .maybeSingle();

    if (account) {
      if (account.status && account.status !== 'active') {
        return null; // Account suspended or deactivated
      }
      if (!['admin', 'management', 'superadmin', 'super_admin'].includes(account.role)) {
        return null; // Not authorized as admin
      }
      role = account.role;
    } else {
      return null; // No account record — user has no admin privileges
    }
  }

  return { id: data.user.id, email: data.user.email ?? '', role };
}
