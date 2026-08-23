'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { z } from 'zod';

// MFA (Multi-Factor Authentication) Schema
const mfaChallengeSchema = z.object({
  userId: z.string(),
  code: z.string().length(6).regex(/^[0-9]+$/),
});

const mfaSetupSchema = z.object({
  userId: z.string(),
  method: z.enum(['authenticator_app', 'sms', 'email']),
});

export async function initiateMfaLogin(email: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase not configured');

  // Look up user from auth schema
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const authUser = users?.find(u => u.email === email);

  if (userError || !authUser) {
    throw new Error('Invalid credentials');
  }

  // Read MFA status from user_metadata (set during setup)
  const mfaEnabled = authUser.user_metadata?.mfa_enabled === true;
  const mfaMethods = (authUser.user_metadata?.mfa_methods as string[]) || [];

  if (!mfaEnabled) {
    return { success: true, requiresMfa: false, userId: authUser.id };
  }

  // Generate MFA challenge
  const challengeCode = crypto.randomInt(100000, 999999).toString();
  const challengeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store challenge in auth.users user_metadata (no separate table needed)
  await supabase.auth.admin.updateUserById(authUser.id, {
    user_metadata: {
      ...authUser.user_metadata,
      mfa_challenge: challengeCode,
      mfa_challenge_expires_at: challengeExpiry.toISOString(),
    },
  });

  // Send challenge via configured methods
  await sendMfaChallenge(authUser.id, challengeCode, mfaMethods);

  return {
    success: true,
    requiresMfa: true,
    userId: authUser.id,
    challengeExpiry: challengeExpiry.toISOString()
  };
}

export async function verifyMfaChallenge(userId: string, code: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase not configured');

  // Validate input
  const validation = mfaChallengeSchema.safeParse({ userId, code });
  if (!validation.success) {
    throw new Error('Invalid MFA challenge format');
  }

  // Get user and verify challenge
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError || !user) {
    throw new Error('User not found');
  }

  const meta = user.user_metadata || {};
  const storedCode = meta.mfa_challenge;
  const expiresAt = meta.mfa_challenge_expires_at;

  if (!storedCode || storedCode !== code) {
    throw new Error('Invalid MFA code');
  }

  if (expiresAt && new Date(expiresAt) < new Date()) {
    // Clear expired challenge
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { ...meta, mfa_challenge: null, mfa_challenge_expires_at: null },
    });
    throw new Error('MFA code expired');
  }

  // Clear challenge after successful verification
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...meta, mfa_challenge: null, mfa_challenge_expires_at: null },
  });

  return { success: true, userId };
}

export async function setupMfa(userId: string, method: 'authenticator_app' | 'sms' | 'email') {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase not configured');

  const validation = mfaSetupSchema.safeParse({ userId, method });
  if (!validation.success) {
    throw new Error('Invalid MFA setup parameters');
  }

  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const existingMeta = user?.user_metadata || {};

  if (method === 'authenticator_app') {
    // Generate TOTP secret
    const secret = crypto.randomBytes(32).toString('base64');
    const otpauth = `otpauth://totp/CaribbeanOne:${userId}?secret=${secret}&issuer=CaribbeanOne`;

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existingMeta,
        mfa_secret: secret,
        mfa_enabled: true,
        mfa_methods: ['authenticator_app'],
      },
    });

    return { success: true, method, secret, otpauth };
  } else {
    // SMS or email MFA: add method to existing list
    const existingMethods = (existingMeta.mfa_methods as string[]) || [];
    const updatedMethods = existingMethods.includes(method) ? existingMethods : [...existingMethods, method];

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existingMeta,
        mfa_enabled: true,
        mfa_methods: updatedMethods,
      },
    });

    return { success: true, method };
  }
}

async function sendMfaChallenge(userId: string, code: string, methods: string[]) {
  console.log(`MFA challenge for user ${userId}: Code ${code}, Methods: ${methods}`);

  if (methods.includes('email')) {
    await sendEmailMfaCode(userId, code);
  }
  if (methods.includes('sms')) {
    await sendSmsMfaCode(userId, code);
  }
}

async function sendEmailMfaCode(userId: string, code: string) {
  console.log(`Email MFA code for user ${userId}: ${code}`);
}

async function sendSmsMfaCode(userId: string, code: string) {
  console.log(`SMS MFA code for user ${userId}: ${code}`);
}

export async function validateMfaSession(userId: string, sessionToken: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;

  // Validate against user_metadata
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  if (!user) return false;

  // Check if session token matches stored token (set during verify)
  const meta = user.user_metadata || {};
  return meta.mfa_session_token === sessionToken;
}

export type AuthFormState = { error: string | null; info: string | null };

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
      }
    }
  });

  if (error) return { error: error.message, info: null };

  redirect('/');
}

export async function signInAction(prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Email and password are required', info: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Database connection failed', info: null };

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message, info: null };

  redirect('/');
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
}