import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type PlatformRole =
  | 'super_admin'
  | 'superadmin'
  | 'management'
  | 'admin'
  | 'moderator'
  | 'support'
  | 'content_manager'
  | 'analyst'
  | 'creator'
  | 'business'
  | 'user'
  | 'guest';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
  permissions?: string[];
  language_preference?: string;
  isOfficial?: boolean;
  isVerified?: boolean;
}

export interface AuthCheckResult {
  user: SessionUser | null;
  isLoggedIn: boolean;
  isAuthorized: boolean;
  role: PlatformRole;
}

import { ensureUserProfile } from '../auth/user-sync';

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (process.env.PLAYWRIGHT_TEST === '1') {
    try {
      const cookieStore = await cookies();
      const testCookie = cookieStore.get('tukubi_user_session')?.value;
      if (testCookie) {
        const parsed = JSON.parse(decodeURIComponent(testCookie));
        if (parsed?.id) {
          return {
            id: parsed.id,
            email: parsed.email || 'testuser@tukubi.com',
            username: parsed.username || 'tukubi_member',
            displayName: parsed.displayName || 'Tukubi Member',
            avatarUrl: parsed.avatarUrl || '/brand/tukubi-emblem.png',
            role: parsed.role || 'user',
            isOfficial: false,
            isVerified: true,
          };
        }
      }
    } catch {}
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  // Resiliently resolve or create user profile to prevent foreign key errors
  const profile = await ensureUserProfile(supabase, data.user);

  const username = profile?.username ?? data.user.user_metadata?.username ?? data.user.email?.split('@')[0] ?? 'member';
  const displayName = profile?.display_name ?? data.user.user_metadata?.display_name ?? (username ? `@${username}` : 'Member');
  const avatarUrl = profile?.avatar_url ?? data.user.user_metadata?.avatar_url ?? (username.toLowerCase() === 'tukubi' ? '/brand/tukubi-emblem.png' : undefined);
  const isOfficial = username.toLowerCase() === 'tukubi' || (profile as any)?.is_official || false;

  return {
    id: data.user.id,
    email: data.user.email ?? '',
    username,
    displayName,
    avatarUrl,
    language_preference: profile?.language_preference ?? undefined,
    isOfficial,
    isVerified: profile?.is_verified ?? false,
  };
}

export async function getAuthorizedUser(
  allowedRoles: PlatformRole[]
): Promise<AuthCheckResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      isLoggedIn: false,
      isAuthorized: false,
      role: 'guest',
    };
  }

  const serviceClient = await createServiceSupabaseClient();
  let role: PlatformRole = (user.role as PlatformRole) || 'user';
  let status = 'active';
  let permissions: string[] = [];

  if (serviceClient) {
    const { data: account } = await serviceClient
      .from('accounts')
      .select('role, status, permissions')
      .or(`profile_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (account) {
      if (account.role) {
        role = account.role as PlatformRole;
      }
      if (account.status) {
        status = account.status;
      }
      if (Array.isArray(account.permissions)) {
        permissions = account.permissions;
      }
    }
  }

  // Suspended or deactivated accounts cannot access staff privileges
  if (status !== 'active') {
    return {
      user: { ...user, role, status, permissions },
      isLoggedIn: true,
      isAuthorized: false,
      role,
    };
  }

  // Super Admin / Management inherit all role permissions
  const isSuperAdmin = role === 'super_admin' || role === 'superadmin' || role === 'management';
  const isAuthorized = isSuperAdmin || allowedRoles.includes(role);

  return {
    user: { ...user, role, status, permissions },
    isLoggedIn: true,
    isAuthorized,
    role,
  };
}

export async function getSuperAdminUser(): Promise<SessionUser | null> {
  const auth = await getAuthorizedUser(['super_admin', 'superadmin', 'management']);
  if (!auth.isLoggedIn || !auth.isAuthorized || !auth.user) {
    return null;
  }
  return auth.user;
}

export async function getStaffUser(
  requiredRole: 'admin' | 'moderator' | 'support' | 'content_manager' | 'analyst' = 'admin'
): Promise<SessionUser | null> {
  const roleMap: Record<string, PlatformRole[]> = {
    admin: ['admin', 'management', 'superadmin', 'super_admin'],
    moderator: ['moderator', 'admin', 'management', 'superadmin', 'super_admin'],
    support: ['support', 'admin', 'management', 'superadmin', 'super_admin'],
    content_manager: ['content_manager', 'admin', 'management', 'superadmin', 'super_admin'],
    analyst: ['analyst', 'admin', 'management', 'superadmin', 'super_admin'],
  };

  const allowedRoles = roleMap[requiredRole] || ['admin', 'super_admin', 'superadmin', 'management'];
  const auth = await getAuthorizedUser(allowedRoles);
  if (!auth.isLoggedIn || !auth.isAuthorized || !auth.user) {
    return null;
  }

  return auth.user;
}

export async function checkIsOfficialOperator(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const serviceClient = await createServiceSupabaseClient();
  if (!serviceClient) return false;

  // 1. Check platform super_admin / admin / management roles in accounts table
  const { data: account } = await serviceClient
    .from('accounts')
    .select('role, status')
    .or(`profile_id.eq.${userId},id.eq.${userId}`)
    .eq('status', 'active')
    .maybeSingle();

  if (account && ['super_admin', 'superadmin', 'management', 'admin', 'content_manager'].includes(account.role)) {
    return true;
  }

  // 2. Check if official account exists and user is in official_account_operators
  const { data: officialAccount } = await serviceClient
    .from('official_accounts')
    .select('id')
    .eq('status', 'active')
    .maybeSingle();

  if (!officialAccount) return false;

  const { data: operator } = await serviceClient
    .from('official_account_operators')
    .select('role')
    .eq('official_account_id', officialAccount.id)
    .eq('operator_profile_id', userId)
    .maybeSingle();

  if (!operator) return false;

  const allowedRoles = ['owner', 'administrator', 'editor', 'publisher'];
  return allowedRoles.includes(operator.role);
}



