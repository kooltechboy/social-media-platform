import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import SocialSearchClient, {
  type SearchProfile,
  type SearchPost,
  type SearchCommunity,
} from '../../components/search/social-search-client';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createSupabaseServerClient(),
  ]);

  let initialProfiles: SearchProfile[] = [];
  let initialPosts: SearchPost[] = [];
  let initialCommunities: SearchCommunity[] = [];
  let initialFollowingIds: string[] = [];

  if (supabase) {
    // 1. Fetch current user's followings if authenticated
    if (user?.id) {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      if (follows) {
        initialFollowingIds = follows.map((f) => f.following_id);
      }
    }

    if (query) {
      const sanitized = query.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();

      // Parallel search queries
      const [profilesRes, postsRes, communitiesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, bio, origin_country_iso, is_verified, account_type')
          .or(`display_name.ilike.%${sanitized}%,username.ilike.%${sanitized}%`)
          .limit(20),
        supabase
          .from('posts')
          .select('id, author_id, content, created_at, media_urls, likes_count, comments_count, profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified)')
          .eq('visibility', 'public')
          .ilike('content', `%${sanitized}%`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('communities')
          .select('id, name, slug, description, member_count, country_iso')
          .or(`name.ilike.%${sanitized}%,slug.ilike.%${sanitized}%`)
          .limit(10),
      ]);

      if (profilesRes.data) initialProfiles = profilesRes.data;
      if (postsRes.data) {
        initialPosts = postsRes.data.map((p: any) => {
          const raw = p.profiles;
          const profile = Array.isArray(raw) ? raw[0] : raw;
          return { ...p, profiles: profile };
        });
      }
      if (communitiesRes.data) initialCommunities = communitiesRes.data;
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-brand-sandstone flex items-center gap-2.5">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-brand-caribbeanSea" /> Search Tukubi
          </h1>
        </div>
      </div>

      {/* Main Interactive Search Client */}
      <SocialSearchClient
        initialQuery={query}
        initialProfiles={initialProfiles}
        initialPosts={initialPosts}
        initialCommunities={initialCommunities}
        currentUserId={user?.id}
        initialFollowingIds={initialFollowingIds}
      />
    </div>
  );
}
