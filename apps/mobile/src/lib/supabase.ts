import { createClient } from '@supabase/supabase-js';
import { mobileAuthStorage } from './storage';

// Mobile Supabase client. Requires EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.
export interface MobileProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
}

export interface MobilePost {
  id: string;
  author: string;
  authorHandle?: string;
  authorAvatar?: string | null;
  isVerified?: boolean;
  location: string;
  time: string;
  body: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  mediaUrls?: string[];
  linkPreview?: any;
  linkPreviews?: any[];
}

const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const envAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

/**
 * True only when real project credentials are present. The app renders a
 * configuration error instead of silently talking to a fake endpoint/key.
 */
export const isSupabaseConfigured = envUrl.length > 0 && envAnonKey.length > 0;

// createClient throws on an empty URL, so an inert, non-routable URL is used purely to
// let the module load; App.tsx blocks all usage when `isSupabaseConfigured` is false.
export const supabase = createClient(
  isSupabaseConfigured ? envUrl : 'https://unconfigured.invalid',
  isSupabaseConfigured ? envAnonKey : 'unconfigured',
  {
    auth: {
      storage: mobileAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Current signed-in user id from the locally persisted session (no network round-trip).
 * Authorization is still enforced by RLS on every query — this is only for scoping UI reads.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

