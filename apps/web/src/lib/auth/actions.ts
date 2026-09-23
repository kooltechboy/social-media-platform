'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { sanitizeRedirectUrl } from './redirect-utils';

const MFA_UNSUPPORTED_ERROR =
  'Custom MFA actions are unavailable. Use Supabase Auth MFA after signing in.';

function rejectUnsupportedMfa(): never {
  throw new Error(MFA_UNSUPPORTED_ERROR);
}

export async function initiateMfaLogin(email: string) {
  void email;
  return rejectUnsupportedMfa();
}

export async function verifyMfaChallenge(userId: string, code: string) {
  void userId;
  void code;
  return rejectUnsupportedMfa();
}

export async function setupMfa(userId: string, method: 'authenticator_app' | 'sms' | 'email') {
  void userId;
  void method;
  return rejectUnsupportedMfa();
}

export async function validateMfaSession(userId: string, sessionToken: string) {
  void userId;
  void sessionToken;
  return rejectUnsupportedMfa();
}

export type AuthFormState = { error: string | null; info: string | null };

export interface CompleteRegistrationPayload {
  email: string;
  password: string;
  username: string;
  displayName: string;
  accountType?: 'personal' | 'creator' | 'business' | 'organization';
  originCountryIso?: string;
  isDiaspora?: boolean;
  diasporaCountryIso?: string;
  interests?: string[];
}

export async function completeFullRegistrationAction(payload: CompleteRegistrationPayload) {
  const { email, password, username, displayName, accountType = 'personal', originCountryIso, isDiaspora, diasporaCountryIso, interests = [] } = payload;

  if (!email || !password || !username) {
    return { error: 'Email, password, and username are required.' };
  }

  const cleanUsername = username.toLowerCase().trim().replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 30);
  if (cleanUsername.length < 3) {
    return { error: 'Username must be at least 3 characters long.' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: 'Authentication service temporarily unavailable. Please try again in a few moments.' };
  }

  // Normalize DB account_type enum ('personal' | 'creator' | 'business' | 'organization')
  const validDbAccountType = ['personal', 'creator', 'business', 'organization'].includes(accountType)
    ? accountType
    : 'personal';

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        username: cleanUsername,
        display_name: (displayName || cleanUsername).trim(),
        account_type: accountType,
        // Never assign a Caribbean origin the user did not consciously select
        origin_country_iso: originCountryIso || null,
        is_diaspora: isDiaspora || false,
        diaspora_country_iso: diasporaCountryIso || null,
        cultural_interests: interests,
      },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return { error: 'An account with this email address already exists. Please sign in or use password recovery.' };
    }
    if (msg.includes('weak password') || msg.includes('password should be')) {
      return { error: 'Please choose a stronger password with at least 8 characters including letters and numbers.' };
    }
    return { error: error.message };
  }

  // Write profile record immediately if available
  if (data.user) {
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: cleanUsername,
        display_name: (displayName || cleanUsername).trim(),
        account_type: validDbAccountType as any,
        cultural_interests: interests,
        updated_at: new Date().toISOString(),
      });

      // Only persist Caribbean origin when the user explicitly selected one
      if (originCountryIso) {
        await supabase.from('profile_identity').upsert({
          profile_id: data.user.id,
          origin_country_iso: originCountryIso,
          visibility: 'private',
          updated_at: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn('Profile identity post-signup write deferred to trigger:', dbErr);
    }
  }

  const { track } = await import('../monitoring/analytics');
  track('user_registered', { accountType: validDbAccountType }, data.user?.id);

  return { success: true, user: data.user };
}

export async function signUpAction(prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;
  const displayName = formData.get('displayName') as string;

  if (!email || !password) return { error: 'Email and password are required', info: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database connection failed', info: null };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split('@')[0],
        display_name: displayName || username || email.split('@')[0],
      },
    },
  });

  if (error) return { error: error.message, info: null };

  redirect('/');
}

export async function signInAction(prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const rawRedirect = (formData.get('redirectTo') as string) || '/';

  if (!email || !password) return { error: 'Email and password are required', info: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database connection failed', info: null };

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message, info: null };

  // Sanitize redirect URL against strict whitelist
  const safeRedirect = sanitizeRedirectUrl(rawRedirect);

  redirect(safeRedirect);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect('/login');
}

export type OperatingMode = 'personal' | 'creator' | 'business' | 'community' | 'official';

export interface UserOperatingIdentity {
  id: string;
  type: OperatingMode;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  badge: string;
  isVerified?: boolean;
}

export async function fetchUserOperatingIdentitiesAction(): Promise<UserOperatingIdentity[]> {
  const { getCurrentUser } = await import('../supabase/server');
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  // Personal profile remains strictly personal — never conflated with official brand
  const personal: UserOperatingIdentity = {
    id: user.id,
    type: 'personal',
    name: user.displayName || `@${user.username}`,
    handle: user.username,
    avatarUrl: user.avatarUrl,
    badge: 'Personal',
    isVerified: Boolean(user.isOfficial || user.isVerified || (user as any).verified),
  };

  const list: UserOperatingIdentity[] = [personal];

  try {
    // 1. Check if user is platform admin / superadmin
    const { data: adminAccount } = await supabase
      .from('accounts')
      .select('role, status')
      .or(`profile_id.eq.${user.id},id.eq.${user.id}`)
      .eq('status', 'active')
      .maybeSingle();

    const isPlatformAdmin = Boolean(
      adminAccount &&
      ['super_admin', 'superadmin', 'management', 'admin'].includes(adminAccount.role)
    );

    // 2. Parallel queries for Creator, Owned Businesses, Page Roles, Communities, and Official Accounts
    const [creatorRes, ownedBizRes, pageRolesRes, commRes, operatorRes] = await Promise.all([
      supabase.from('creator_accounts').select('id, is_verified, category').eq('profile_id', user.id).maybeSingle(),
      supabase.from('businesses').select('id, name, slug, avatar_url, is_verified').eq('owner_id', user.id).eq('is_archived', false).is('deleted_at', null).limit(10),
      supabase.from('page_roles').select('page_id, role, businesses(id, name, slug, avatar_url, is_verified)').eq('user_id', user.id).in('role', ['owner', 'admin', 'editor']).limit(10),
      supabase.from('community_members').select('community_id, communities(id, name, slug, cover_storage_path)').eq('profile_id', user.id).in('role', ['admin', 'moderator']).limit(10),
      supabase.from('official_account_operators').select('official_account_id, role, official_accounts(id, profile_id, classification, profiles(id, username, display_name, avatar_url, is_verified))').eq('operator_profile_id', user.id).limit(5),
    ]);

    // 3. Official TUKUBI identity (for operators or platform admins)
    if (isPlatformAdmin) {
      const { data: officialAccounts } = await supabase
        .from('official_accounts')
        .select('id, profile_id, classification, profiles:profiles!official_accounts_profile_id_fkey(id, username, display_name, avatar_url, is_verified)')
        .eq('status', 'active')
        .limit(5);

      if (officialAccounts) {
        for (const oa of officialAccounts) {
          const prof = Array.isArray(oa.profiles) ? oa.profiles[0] : oa.profiles;
          if (prof && !list.some((i) => i.id === prof.id && i.type === 'official')) {
            list.push({
              id: prof.id,
              type: 'official',
              name: prof.display_name || 'TUKUBI',
              handle: prof.username || 'tukubi',
              avatarUrl: prof.avatar_url || '/brand/tukubi-emblem.png',
              badge: 'Official Platform',
              isVerified: true,
            });
          }
        }
      }
    } else if (operatorRes.data && operatorRes.data.length > 0) {
      for (const op of operatorRes.data) {
        const oa: any = op.official_accounts;
        const prof = Array.isArray(oa?.profiles) ? oa?.profiles[0] : oa?.profiles;
        if (prof && !list.some((i) => i.id === prof.id && i.type === 'official')) {
          list.push({
            id: prof.id,
            type: 'official',
            name: prof.display_name || 'TUKUBI',
            handle: prof.username || 'tukubi',
            avatarUrl: prof.avatar_url || '/brand/tukubi-emblem.png',
            badge: 'Official Platform',
            isVerified: true,
          });
        }
      }
    }

    // 4. Creator Identity
    if (creatorRes.data) {
      list.push({
        id: creatorRes.data.id,
        type: 'creator',
        name: `${user.displayName || user.username} (Creator)`,
        handle: user.username,
        avatarUrl: user.avatarUrl,
        badge: 'Creator Studio',
        isVerified: creatorRes.data.is_verified,
      });
    }

    // 5. Business / Universal Pages (combining owned and role-assigned)
    const seenPages = new Set<string>();
    if (ownedBizRes.data) {
      ownedBizRes.data.forEach((b) => {
        seenPages.add(b.id);
        list.push({
          id: b.id,
          type: 'business',
          name: b.name,
          handle: b.slug,
          avatarUrl: b.avatar_url || null,
          badge: 'Business Page',
          isVerified: b.is_verified,
        });
      });
    }

    if (pageRolesRes.data) {
      pageRolesRes.data.forEach((pr: any) => {
        const b = pr.businesses;
        if (b && !seenPages.has(b.id)) {
          seenPages.add(b.id);
          list.push({
            id: b.id,
            type: 'business',
            name: b.name,
            handle: b.slug,
            avatarUrl: b.avatar_url || null,
            badge: pr.role === 'owner' ? 'Page Owner' : 'Page Editor',
            isVerified: b.is_verified,
          });
        }
      });
    }

    // 6. Managed Community Hubs
    if (commRes.data) {
      commRes.data.forEach((cm: any) => {
        const c = cm.communities;
        if (c) {
          list.push({
            id: c.id,
            type: 'community',
            name: c.name,
            handle: c.slug,
            avatarUrl: c.cover_storage_path,
            badge: 'Hub Lead',
            isVerified: false,
          });
        }
      });
    }
  } catch (err) {
    console.warn('Error fetching user operating identities:', err);
  }

  return list;
}

