"use server"

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
  
  // Find user by email
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, mfa_enabled, mfa_secret, mfa_methods')
    .eq('email', email)
    .single();

  if (userError || !users) {
    throw new Error('Invalid credentials');
  }

  if (!users.mfa_enabled) {
    // Skip MFA if not enabled
    return { success: true, requiresMfa: false, userId: users.id };
  }

  // Generate MFA challenge
  const challengeCode = crypto.randomInt(100000, 999999).toString();
  const challengeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store challenge in database
  const { error: challengeError } = await supabase
    .from('mfa_challenges')
    .insert({
      user_id: users.id,
      challenge_code: challengeCode,
      expires_at: challengeExpiry.toISOString(),
      used: false,
    });

  if (challengeError) {
    throw new Error('Failed to create MFA challenge');
  }

  // Send challenge via configured methods
  await sendMfaChallenge(users.id, challengeCode, users.mfa_methods);

  return { 
    success: true, 
    requiresMfa: true, 
    userId: users.id,
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

  // Get MFA challenge
  const { data: challenge, error: challengeError } = await supabase
    .from('mfa_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_code', code)
    .eq('used', false)
    .single();

  if (challengeError || !challenge) {
    throw new Error('Invalid or expired MFA code');
  }

  // Check expiry
  if (new Date(challenge.expires_at) < new Date()) {
    await supabase
      .from('mfa_challenges')
      .update({ used: true })
      .eq('id', challenge.id);
    throw new Error('MFA code expired');
  }

  // Mark challenge as used
  await supabase
    .from('mfa_challenges')
    .update({ used: true })
    .eq('id', challenge.id);

  // Create MFA session
  await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_token: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      mfa_verified: true,
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

  if (method === 'authenticator_app') {
    // Generate TOTP secret
    const secret = crypto.randomBytes(32).toString('base64');
    const otpauth = `otpauth://totp/CaribbeanOne:${userId}?secret=${secret}&issuer=CaribbeanOne`;

    await supabase
      .from('users')
      .update({
        mfa_secret: secret,
        mfa_enabled: true,
        mfa_methods: ['authenticator_app'],
      })
      .eq('id', userId);

    return { success: true, method, secret, otpauth };
  } else {
    // SMS or email MFA
    await supabase
      .from('users')
      .update({
        mfa_enabled: true,
        mfa_methods: supabase
          .from('users')
          .select('mfa_methods')
          .eq('id', userId)
          .single()
          .then(({ data }) => {
            const existing = data?.mfa_methods || [];
            return [...existing, method];
          }),
      })
      .eq('id', userId);

    return { success: true, method };
  }
}

async function sendMfaChallenge(userId: string, code: string, methods: string[]) {
  // Implementation depends on your notification system
  // This is a placeholder - integrate with your existing notification service
  console.log(`MFA challenge for user ${userId}: Code ${code}, Methods: ${methods}`);
  
  // Example integration with notification service
  if (methods.includes('email')) {
    await sendEmailMfaCode(userId, code);
  }
  if (methods.includes('sms')) {
    await sendSmsMfaCode(userId, code);
  }
}

async function sendEmailMfaCode(userId: string, code: string) {
  // Integrate with your email service
  console.log(`Email MFA code for user ${userId}: ${code}`);
}

async function sendSmsMfaCode(userId: string, code: string) {
  // Integrate with your SMS service
  console.log(`SMS MFA code for user ${userId}: ${code}`);
}

export async function validateMfaSession(userId: string, sessionToken: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  
  const { data: session, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_token', sessionToken)
    .eq('mfa_verified', true)
    .single();

  if (error || !session) {
    return false;
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    await supabase
      .from('user_sessions')
      .delete()
      .eq('id', session.id);
    return false;
  }

  return true;
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

  // Wait for the cookie to be set and then redirect to the home page
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