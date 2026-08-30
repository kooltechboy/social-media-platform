'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';
import type { ActionResponse } from '../profile/profile-actions';

/**
 * 1. Update Account Details (Display name, phone)
 */
export async function updateAccountAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const displayName = String(formData.get('displayName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();

  if (!displayName) {
    return { success: false, error: 'Display name cannot be empty.' };
  }
  if (displayName.length > 100) {
    return { success: false, error: 'Display name cannot exceed 100 characters.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Update auth metadata
  await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  revalidatePath('/settings');
  revalidatePath('/profile');
  return { success: true, message: 'Account details updated successfully.' };
}

/**
 * 2. Update Security Password via Supabase Auth
 * Note: Strictly enforces security without unwanted alerts.
 */
export async function updatePasswordAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  // Enforce complexity: at least one letter and one number or special character
  if (!/(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*])/.test(newPassword)) {
    return {
      success: false,
      error: 'Password must contain at least one letter and one number or special character.',
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: 'Password updated successfully. Please use your new password next time you sign in.' };
}

/**
 * 3. Update Notification Preferences
 */
export async function updateNotificationPreferencesAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const pushEnabled = formData.get('push_enabled') === 'on' || formData.get('push_enabled') === 'true';
  const emailEnabled = formData.get('email_enabled') === 'on' || formData.get('email_enabled') === 'true';
  const smsEnabled = formData.get('sms_enabled') === 'on' || formData.get('sms_enabled') === 'true';
  const likesEnabled = formData.get('likes_enabled') === 'on' || formData.get('likes_enabled') === 'true';
  const commentsEnabled = formData.get('comments_enabled') === 'on' || formData.get('comments_enabled') === 'true';
  const followsEnabled = formData.get('follows_enabled') === 'on' || formData.get('follows_enabled') === 'true';
  const mentionsEnabled = formData.get('mentions_enabled') === 'on' || formData.get('mentions_enabled') === 'true';
  const messagesEnabled = formData.get('messages_enabled') === 'on' || formData.get('messages_enabled') === 'true';
  const communityEnabled = formData.get('community_enabled') === 'on' || formData.get('community_enabled') === 'true';
  const spotpayEnabled = formData.get('spotpay_enabled') === 'on' || formData.get('spotpay_enabled') === 'true';
  const marketingEnabled = formData.get('marketing_enabled') === 'on' || formData.get('marketing_enabled') === 'true';

  const { error } = await supabase.from('notification_preferences').upsert(
    {
      profile_id: user.id,
      push_enabled: pushEnabled,
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      likes_enabled: likesEnabled,
      comments_enabled: commentsEnabled,
      follows_enabled: followsEnabled,
      mentions_enabled: mentionsEnabled,
      messages_enabled: messagesEnabled,
      community_enabled: communityEnabled,
      spotpay_enabled: spotpayEnabled,
      marketing_enabled: marketingEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true, message: 'Notification preferences saved.' };
}

/**
 * 4. Update Appearance / Theme Preference
 */
export async function updateThemeAction(theme: string): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const validThemes = ['twilight', 'dark', 'light', 'system'];
  const safeTheme = validThemes.includes(theme) ? theme : 'twilight';

  const { error } = await supabase
    .from('profiles')
    .update({
      theme_preference: safeTheme,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true, message: `Theme preference set to ${safeTheme}.` };
}

/**
 * 5. Update Language Preference
 */
export async function updateLanguageAction(language: string): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const validLangs = ['en', 'es', 'fr', 'ht', 'nl', 'pap'];
  const safeLang = validLangs.includes(language) ? language : 'en';

  const { error } = await supabase
    .from('profiles')
    .update({
      language_preference: safeLang,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true, message: 'Language preference saved.' };
}

/**
 * 6. Export Account Data (GDPR / Privacy Compliance)
 * Assembles all user-owned data from profiles, counts, preferences, and posts.
 */
export async function exportAccountDataAction(): Promise<ActionResponse<{ exportJson: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const [profileRes, prefsRes, countsRes, postsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('notification_preferences').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('profile_counts').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('posts').select('id, content, visibility, created_at').eq('author_id', user.id).limit(100),
  ]);

  const exportPayload = {
    metadata: {
      platform: 'TUKUBI',
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
    },
    profile: profileRes.data || {},
    notification_preferences: prefsRes.data || {},
    statistics: countsRes.data || {},
    recent_posts: postsRes.data || [],
  };

  return {
    success: true,
    message: 'Data export package generated successfully.',
    data: {
      exportJson: JSON.stringify(exportPayload, null, 2),
    },
  };
}

/**
 * 7. Deactivate or Delete Account
 */
export async function deactivateAccountAction(): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'deactivated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  revalidatePath('/profile');
  return { success: true, message: 'Your account has been deactivated. You can reactivate anytime by updating your settings.' };
}

export async function reactivateAccountAction(): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true, message: 'Your account is now active.' };
}
