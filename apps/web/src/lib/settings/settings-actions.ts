'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
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
  const paymentsEnabled = formData.get('payments_enabled') === 'on' || formData.get('payments_enabled') === 'true';
  const marketingEnabled = formData.get('marketing_enabled') === 'on' || formData.get('marketing_enabled') === 'true';

  const upsertPayload: Record<string, any> = {
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
    payments_enabled: paymentsEnabled,
    marketing_enabled: marketingEnabled,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('notification_preferences').upsert(
    upsertPayload,
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

  const validThemes = ['island-vibes', 'island-daylight', 'twilight', 'dark', 'light', 'system'];
  const normalizedTheme =
    theme === 'light' || theme === 'island-daylight'
      ? 'island-daylight'
      : validThemes.includes(theme)
      ? 'island-vibes'
      : 'island-vibes';

  const { error } = await supabase
    .from('profiles')
    .update({
      theme_preference: normalizedTheme,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };

  try {
    const cookieStore = await cookies();
    cookieStore.set('tukubi_theme', normalizedTheme, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  } catch {
    // Non-fatal in contexts where cookies cannot be mutated
  }

  revalidatePath('/', 'layout');
  revalidatePath('/settings');
  return {
    success: true,
    message:
      normalizedTheme === 'island-daylight'
        ? 'Theme updated to Island Daylight.'
        : 'Theme updated to Island Vibes.',
  };
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

  try {
    const cookieStore = await cookies();
    cookieStore.set('tukubi_locale', safeLang, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
  } catch {
    // Non-blocking cookie set
  }

  revalidatePath('/settings');
  revalidatePath('/');
  return { success: true, message: 'Language preference saved.' };
}

/**
 * 6. Export Account Data (GDPR / Privacy Compliance / Law 172-13)
 * Assembles all user-owned data from profiles, identity, counts, preferences, posts, and comments.
 */
export async function exportAccountDataAction(): Promise<ActionResponse<{ exportJson: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const [profileRes, identityRes, prefsRes, countsRes, postsRes, commentsRes, savesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('profile_identity').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('notification_preferences').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('profile_counts').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('posts').select('id, content, visibility, created_at, likes_count, comments_count').eq('author_id', user.id).limit(200),
    supabase.from('post_comments').select('id, post_id, content, created_at').eq('author_id', user.id).limit(200),
    supabase.from('saved_posts').select('id, post_id, created_at').eq('user_id', user.id).limit(100),
  ]);

  const exportPayload = {
    metadata: {
      platform: 'TUKUBI',
      tagline: 'The Caribbean Connected. Born in the Caribbean. Built for the World.',
      compliance: 'Dominican Republic Law 172-13 & International GDPR Data Portability',
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
    },
    profile: profileRes.data || {},
    cultural_identity: identityRes.data || {},
    notification_preferences: prefsRes.data || {},
    statistics: countsRes.data || {},
    posts: postsRes.data || [],
    comments: commentsRes.data || [],
    saved_items: savesRes.data || [],
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
 * 7. Deactivate Account (Temporary)
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
  return { success: true, message: 'Your account has been deactivated. You can reactivate anytime by signing back in.' };
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

/**
 * 8. Request Permanent Account Deletion (30-day grace period pipeline)
 */
export async function requestAccountDeletionAction(reason?: string): Promise<ActionResponse<{ scheduledDeletionAt: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Try RPC first if available, otherwise direct insert
  const { data: _rpcData, error: rpcError } = await supabase.rpc('request_account_deletion', {
    p_reason: reason || 'User requested permanent account deletion',
  });

  if (rpcError) {
    // Fallback: direct table operation
    const { error: insertErr } = await supabase.from('account_deletion_requests').insert({
      user_id: user.id,
      reason: reason || 'User requested permanent account deletion',
      status: 'scheduled',
      scheduled_deletion_at: scheduledDeletionAt,
    });

    if (insertErr) {
      console.warn('Direct deletion request insert note:', insertErr.message);
    }

    await supabase.from('profiles').update({
      status: 'pending_deletion',
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
  }

  revalidatePath('/settings');
  return {
    success: true,
    message: 'Your account has been scheduled for permanent deletion in 30 days. You can cancel anytime before then.',
    data: {
      scheduledDeletionAt,
    },
  };
}

/**
 * 9. Cancel Account Deletion
 */
export async function cancelAccountDeletionAction(): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const { error: cancelErr } = await supabase
    .from('account_deletion_requests')
    .update({
      status: 'cancelled',
      cancellation_reason: 'User cancelled deletion via Settings',
    })
    .eq('user_id', user.id)
    .eq('status', 'scheduled');

  if (cancelErr) {
    console.warn('Error updating deletion request status:', cancelErr.message);
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileErr) {
    return { success: false, error: profileErr.message };
  }

  revalidatePath('/settings');
  return { success: true, message: 'Account deletion request has been cancelled. Your account remains active.' };
}
