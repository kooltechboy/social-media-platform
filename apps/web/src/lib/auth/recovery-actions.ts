'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export async function requestPasswordResetAction(email: string) {
  const result = emailSchema.safeParse(email);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: 'Service temporarily unavailable. Please try again.' };
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePasswordAction(newPassword: string) {
  const result = passwordSchema.safeParse(newPassword);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: 'Service temporarily unavailable. Please try again.' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
