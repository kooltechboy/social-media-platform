'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string | null;
  data?: T;
}

const RESERVED_USERNAMES = new Set([
  'admin',
  'superadmin',
  'administrator',
  'tukubi',
  'tukubiofficial',
  'officialtukubi',
  'tukubisupport',
  'tukubicreators',
  'tukubibusiness',
  'tukubiculture',
  'tukubidiaspora',
  'tukubinews',
  'system',
  'support',
  'staff',
  'moderator',
  'help',
  'api',
  'root',
  'auth',
  'login',
  'signup',
  'profile',
  'settings',
  'search',
  'explore',
  'create',
  'messages',
  'notifications',
  'financial-center',
  'creator-studio',
]);

/**
 * 1. Update Basic Profile Info (display name, username, bio, pronouns, website)
 */
export async function updateProfileBasicAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const displayName = String(formData.get('displayName') ?? '').trim();
  const rawUsername = String(formData.get('username') ?? '').trim().toLowerCase();
  const bio = String(formData.get('bio') ?? '').trim();
  const pronouns = String(formData.get('pronouns') ?? '').trim();
  let website = String(formData.get('website') ?? '').trim();

  if (!displayName) {
    return { success: false, error: 'Display name is required.' };
  }
  if (displayName.length > 100) {
    return { success: false, error: 'Display name cannot exceed 100 characters.' };
  }

  // Validate username
  const username = rawUsername || user.username;
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
    return {
      success: false,
      error: 'Username must be 3-30 characters and contain only lowercase letters, numbers, underscores, or periods.',
    };
  }

  if (RESERVED_USERNAMES.has(username) && username !== user.username) {
    return { success: false, error: 'This username is reserved by the system.' };
  }

  // Check username uniqueness if changed
  if (username !== user.username) {
    const { data: collision } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .neq('id', user.id)
      .maybeSingle();

    if (collision) {
      return { success: false, error: 'Username is already in use by another member.' };
    }
  }

  if (bio.length > 500) {
    return { success: false, error: 'Bio cannot exceed 500 characters.' };
  }

  if (pronouns.length > 50) {
    return { success: false, error: 'Pronouns cannot exceed 50 characters.' };
  }

  if (website && !/^https?:\/\//i.test(website)) {
    website = `https://${website}`;
  }
  if (website && !/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i.test(website)) {
    return { success: false, error: 'Please enter a valid website URL.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      username,
      bio: bio || null,
      pronouns: pronouns || null,
      website: website || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath(`/profile/${username}`);
  revalidatePath(`/profile/${user.username}`);
  revalidatePath('/settings');

  return { success: true, message: 'Profile information updated successfully.' };
}

/**
 * 2. Update Personal Info (first name, last name, DOB, gender, relationship, location, phone)
 */
export async function updateProfilePersonalInfoAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const dateOfBirth = String(formData.get('dateOfBirth') ?? '').trim();
  const gender = String(formData.get('gender') ?? '').trim();
  const relationshipStatus = String(formData.get('relationshipStatus') ?? '').trim();
  const country = String(formData.get('country') ?? '').trim();
  const island = String(formData.get('island') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();

  // Validate DOB format if provided
  let formattedDob: string | null = null;
  if (dateOfBirth) {
    const parsed = new Date(dateOfBirth);
    if (isNaN(parsed.getTime())) {
      return { success: false, error: 'Invalid date of birth provided.' };
    }
    // Must not be in the future
    if (parsed > new Date()) {
      return { success: false, error: 'Date of birth cannot be in the future.' };
    }
    formattedDob = parsed.toISOString().split('T')[0];
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      date_of_birth: formattedDob,
      gender: gender || null,
      relationship_status: relationshipStatus || null,
      country: country || null,
      island: island || null,
      city: city || null,
      address: address || null,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath(`/profile/${user.username}`);
  revalidatePath('/settings');

  return { success: true, message: 'Personal details updated successfully.' };
}

/**
 * 3. Update Professional & Educational Info
 */
export async function updateProfileProfessionalAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const jobTitle = String(formData.get('jobTitle') ?? '').trim();
  const employer = String(formData.get('employer') ?? '').trim();
  const industry = String(formData.get('industry') ?? '').trim();
  const education = String(formData.get('education') ?? '').trim();
  const school = String(formData.get('school') ?? '').trim();
  const rawSkills = String(formData.get('skills') ?? '').trim();
  const professionalBio = String(formData.get('professionalBio') ?? '').trim();

  const skills = rawSkills
    ? rawSkills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20)
    : [];

  const { error } = await supabase
    .from('profiles')
    .update({
      job_title: jobTitle || null,
      employer: employer || null,
      industry: industry || null,
      education: education || null,
      school: school || null,
      skills,
      professional_bio: professionalBio || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath(`/profile/${user.username}`);
  revalidatePath('/settings');

  return { success: true, message: 'Career & education details updated.' };
}

/**
 * 4. Update Social Links
 */
export async function updateProfileSocialAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const instagram = String(formData.get('instagram') ?? '').trim().replace(/^@/, '');
  const twitter = String(formData.get('twitter') ?? '').trim().replace(/^@/, '');
  const tiktok = String(formData.get('tiktok') ?? '').trim().replace(/^@/, '');
  const linkedin = String(formData.get('linkedin') ?? '').trim();
  const youtube = String(formData.get('youtube') ?? '').trim();
  const facebook = String(formData.get('facebook') ?? '').trim();

  const socialLinks: Record<string, string> = {};
  if (instagram) socialLinks.instagram = instagram;
  if (twitter) socialLinks.twitter = twitter;
  if (tiktok) socialLinks.tiktok = tiktok;
  if (linkedin) socialLinks.linkedin = linkedin;
  if (youtube) socialLinks.youtube = youtube;
  if (facebook) socialLinks.facebook = facebook;

  const { error } = await supabase
    .from('profiles')
    .update({
      social_links: socialLinks,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath(`/profile/${user.username}`);
  revalidatePath('/settings');

  return { success: true, message: 'Social links updated.' };
}

/**
 * 5. Update Profile Privacy Settings
 */
export async function updateProfilePrivacyAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const profileVisibility = String(formData.get('profileVisibility') ?? 'public');
  const dobVisibility = String(formData.get('dobVisibility') ?? 'private');
  const addressVisibility = String(formData.get('addressVisibility') ?? 'private');
  const relationshipVisibility = String(formData.get('relationshipVisibility') ?? 'public');
  const onlineStatusEnabled = formData.get('onlineStatusEnabled') === 'true' || formData.get('onlineStatusEnabled') === 'on';
  const messagingPermission = String(formData.get('messagingPermission') ?? 'everyone');
  const interactionPermission = String(formData.get('interactionPermission') ?? 'everyone');

  const validVisibilities = ['public', 'followers', 'private'];
  const pVis = validVisibilities.includes(profileVisibility) ? profileVisibility : 'public';
  const dobVis = validVisibilities.includes(dobVisibility) ? dobVisibility : 'private';
  const addrVis = validVisibilities.includes(addressVisibility) ? addressVisibility : 'private';
  const relVis = validVisibilities.includes(relationshipVisibility) ? relationshipVisibility : 'public';

  const { error } = await supabase
    .from('profiles')
    .update({
      profile_visibility: pVis,
      dob_visibility: dobVis,
      address_visibility: addrVis,
      relationship_visibility: relVis,
      online_status_enabled: onlineStatusEnabled,
      messaging_permission: messagingPermission,
      interaction_permission: interactionPermission,
      is_private: pVis === 'private',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath(`/profile/${user.username}`);
  revalidatePath('/settings');

  return { success: true, message: 'Privacy controls updated successfully.' };
}

/**
 * 6. Upload Avatar to Supabase Storage
 */
export async function uploadAvatarAction(formData: FormData): Promise<ActionResponse<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return { success: false, error: 'No image file provided.' };
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
    return { success: false, error: 'Only JPG, PNG, WebP, and GIF images are supported.' };
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'Avatar image cannot exceed 5MB.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

  // Update profile record with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: `Failed to save avatar URL: ${updateError.message}` };
  }

  // Also sync avatar to auth user metadata so session reflects it immediately
  await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });

  revalidatePath('/profile');
  revalidatePath(`/profile/${user.username}`);
  revalidatePath('/settings');

  return { success: true, message: 'Profile photo updated!', data: { url: publicUrl } };
}

/**
 * 7. Upload Cover Banner to Supabase Storage
 */
export async function uploadCoverAction(formData: FormData): Promise<ActionResponse<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const file = formData.get('file') as File | null;
  if (!file || typeof file === 'string') {
    return { success: false, error: 'No banner image file provided.' };
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
    return { success: false, error: 'Only JPG, PNG, and WebP images are supported for banners.' };
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'Banner image cannot exceed 10MB.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${user.id}/cover-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: `Banner upload failed: ${uploadError.message}` };
  }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      cover_url: publicUrl,
      banner_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: `Failed to save banner: ${updateError.message}` };
  }

  revalidatePath('/profile');
  revalidatePath(`/profile/${user.username}`);
  revalidatePath('/settings');

  return { success: true, message: 'Cover photo updated!', data: { url: publicUrl } };
}

/**
 * 8. Remove Cover Banner
 */
export async function removeCoverAction(): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Sign in required.' };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database service unavailable.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      cover_url: null,
      banner_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath(`/profile/${user.username}`);
  revalidatePath('/settings');

  return { success: true, message: 'Cover banner removed.' };
}
