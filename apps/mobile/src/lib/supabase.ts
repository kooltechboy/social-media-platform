import { createClient } from '@supabase/supabase-js';

// Mobile Supabase Client with graceful fallback for offline / development
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
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
