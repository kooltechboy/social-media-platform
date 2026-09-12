import { createSupabaseServerClient } from '../supabase/server';

export interface CanonicalMessagingUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified?: boolean;
  isOfficial?: boolean;
}

export interface ResolveUserResult {
  user: CanonicalMessagingUser | null;
  error: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Authoritative canonical user resolver for TUKUBI messaging.
 * Resolves a username (case-insensitive) or profile UUID to a single canonical identity.
 */
export async function resolveUserForMessaging(
  identifier: string,
  client?: any
): Promise<ResolveUserResult> {
  const clean = (identifier || '').replace(/^@/, '').trim();
  if (!clean) {
    return { user: null, error: 'User identifier is required.' };
  }

  const supabase = client || (await createSupabaseServerClient());
  if (!supabase) {
    return { user: null, error: 'Database service is unavailable.' };
  }

  // 1. If it's a valid UUID, search by ID first
  if (UUID_REGEX.test(clean)) {
    const { data: byId, error: errById } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, is_verified, is_official')
      .eq('id', clean)
      .maybeSingle();

    if (byId && !errById) {
      return {
        user: {
          id: byId.id,
          username: byId.username || byId.id.slice(0, 8),
          displayName: byId.display_name || byId.username || 'Caribbean Member',
          avatarUrl: byId.avatar_url || null,
          isVerified: !!byId.is_verified,
          isOfficial: !!byId.is_official,
        },
        error: null,
      };
    }
  }

  // 2. Search by case-insensitive username
  const { data: byUsername, error: errByUsername } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_verified, is_official')
    .ilike('username', clean)
    .maybeSingle();

  if (byUsername && !errByUsername) {
    return {
      user: {
        id: byUsername.id,
        username: byUsername.username,
        displayName: byUsername.display_name || byUsername.username || 'Caribbean Member',
        avatarUrl: byUsername.avatar_url || null,
        isVerified: !!byUsername.is_verified,
        isOfficial: !!byUsername.is_official,
      },
      error: null,
    };
  }

  // 3. Fallback: Search display_name if exact match
  const { data: byDisplay } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_verified, is_official')
    .ilike('display_name', clean)
    .limit(1)
    .maybeSingle();

  if (byDisplay) {
    return {
      user: {
        id: byDisplay.id,
        username: byDisplay.username || byDisplay.id.slice(0, 8),
        displayName: byDisplay.display_name || byDisplay.username || 'Caribbean Member',
        avatarUrl: byDisplay.avatar_url || null,
        isVerified: !!byDisplay.is_verified,
        isOfficial: !!byDisplay.is_official,
      },
      error: null,
    };
  }

  return { user: null, error: 'User not found.' };
}

/**
 * Get canonical profile by user ID
 */
export async function getProfileByUserId(userId: string): Promise<CanonicalMessagingUser | null> {
  const result = await resolveUserForMessaging(userId);
  return result.user;
}

/**
 * Get canonical profile by username
 */
export async function getUserByUsername(username: string): Promise<CanonicalMessagingUser | null> {
  const result = await resolveUserForMessaging(username);
  return result.user;
}
