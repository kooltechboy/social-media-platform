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
        origin_country_iso: originCountryIso || 'JAM',
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

  // If user profile record can be created or updated right away
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
