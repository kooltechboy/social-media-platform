import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '../supabase/server';

export interface UserProfileRecord {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  account_type?: string;
  bio?: string | null;
  is_verified?: boolean;
  is_official?: boolean;
  language_preference?: string | null;
}

/**
 * Ensures that an authenticated user has a corresponding row in `public.profiles`.
 * This acts as an idempotent application-level safeguard in parallel with the PostgreSQL trigger,
 * preventing foreign-key violations on posts, stories, and interactions.
 */
export async function ensureUserProfile(
  client: SupabaseClient | null,
  user: { id: string; email?: string; user_metadata?: Record<string, any> }
): Promise<UserProfileRecord | null> {
  if (!user || !user.id) return null;

  // 1. First attempt fast lookup with existing client
  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('id, username, display_name, avatar_url, account_type, bio, is_verified, language_preference')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        return data as UserProfileRecord;
      }
    } catch {
      // Continue to service client bootstrap
    }
  }

  // 2. If missing or query failed, bootstrap via privileged service client
  const serviceClient = await createServiceSupabaseClient();
  const db = serviceClient || client;
  if (!db) return null;

  // Check again with service client to avoid race conditions
  const { data: existing } = await db
    .from('profiles')
    .select('id, username, display_name, avatar_url, account_type, bio, is_verified, language_preference')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) {
    return existing as UserProfileRecord;
  }

  // Generate clean candidate username
  const meta = user.user_metadata || {};
  let baseUsername = (meta.username || user.email?.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 24);

  if (baseUsername.length < 3) {
    baseUsername = `user_${user.id.slice(0, 6)}`;
  }

  let finalUsername = baseUsername;
  let attempt = 0;

  // Find unique username
  while (attempt < 5) {
    const { data: collision } = await db
      .from('profiles')
      .select('id')
      .eq('username', finalUsername)
      .maybeSingle();

    if (!collision || collision.id === user.id) {
      break;
    }
    attempt++;
    finalUsername = `${baseUsername.slice(0, 18)}_${attempt}_${Math.floor(Math.random() * 100)}`;
  }

  const displayName = meta.display_name || meta.full_name || meta.name || finalUsername;
  const rawAccType = meta.account_type;
  const validAccType = ['personal', 'creator', 'business', 'organization'].includes(rawAccType)
    ? rawAccType
    : 'personal';

  const newProfile: UserProfileRecord = {
    id: user.id,
    username: finalUsername,
    display_name: displayName,
    avatar_url: meta.avatar_url || null,
    account_type: validAccType,
    bio: meta.bio || null,
    is_verified: false,
  };

  try {
    const { data: inserted, error: insertError } = await db
      .from('profiles')
      .upsert(
        {
          id: user.id,
          username: finalUsername,
          display_name: displayName,
          account_type: validAccType,
          avatar_url: meta.avatar_url || null,
          bio: meta.bio || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('id, username, display_name, avatar_url, account_type, bio, is_verified')
      .single();

    if (!insertError && inserted) {
      // Ensure initial profile counts
      await db.from('profile_counts').upsert(
        {
          profile_id: user.id,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          likes_received_count: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' }
      );

      // Ensure notification preferences
      await db.from('notification_preferences').upsert(
        {
          profile_id: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' }
      );

      return inserted as UserProfileRecord;
    }
  } catch (err) {
    console.error('Failed to bootstrap profile in ensureUserProfile:', err);
  }

  return newProfile;
}
