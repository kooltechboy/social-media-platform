'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../supabase/server';

export interface AuthFormState {
  error: string | null;
  info: string | null;
}

const EMPTY: AuthFormState = { error: null, info: null };

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Email and password are required.', info: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Authentication is not configured.', info: null };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, info: null };
  redirect('/');
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? '').trim() || email.split('@')[0];
  const username = String(formData.get('username') ?? '').trim() || email.split('@')[0];

  if (!email || !password) return { error: 'Email and password are required.', info: null };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.', info: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Authentication is not configured.', info: null };

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message, info: null };

  if (data.user && !data.session) {
    return { error: null, info: 'Check your email to confirm your account, then sign in.' };
  }

  if (data.user) {
    const baseUsername = username.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 30) || 'member';
    const profileRow = {
      id: data.user.id,
      username: baseUsername,
      display_name: displayName.slice(0, 100),
    };
    const { error: profileError } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' });
    if (profileError) {
      await supabase.from('profiles').upsert(
        { ...profileRow, username: `${baseUsername}_${Date.now() % 10000}` },
        { onConflict: 'id' },
      );
    }
  }
  redirect('/');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.auth.signOut();
  redirect('/');
}
