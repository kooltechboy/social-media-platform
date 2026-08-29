import React from 'react';
import { notFound } from 'next/navigation';
import { MapPin, Globe, BadgeCheck, Lock, Settings, Share2, UserPlus, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import FollowButton from '../../../components/follow-button';
import ProfileHeaderActions from '../../../components/profile-header-actions';

export const dynamic = 'force-dynamic';

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  website: string | null;
  is_verified: boolean;
  avatar_path: string | null;
  cover_path: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
}

interface Post {
  id: string;
  content: string | null;
  created_at: string;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decodedParam = decodeURIComponent(username || '').trim();
  const [currentUser, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-6">
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 text-center max-w-sm">
          <p className="text-sm text-brand-sandstone/60">Database service currently unavailable.</p>
        </div>
      </div>
    );
  }

  // 1. Look up by case-insensitive username first
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, website, is_verified, avatar_path, cover_path, follower_count, following_count, post_count')
    .ilike('username', decodedParam)
    .maybeSingle();

  // 2. Fallback lookup by ID if param is a valid UUID
  if (!profile && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedParam)) {
    const { data: profileById } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, website, is_verified, avatar_path, cover_path, follower_count, following_count, post_count')
      .eq('id', decodedParam)
      .maybeSingle();
    profile = profileById;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-6">
        <div className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-8 text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 flex items-center justify-center mx-auto text-2xl font-black">
            🌴
          </div>
          <h2 className="text-lg font-black text-brand-sandstone">Member Profile Not Found</h2>
          <p className="text-xs text-brand-sandstone/60 leading-relaxed">
            The profile &quot;@{decodedParam}&quot; could not be located on the Tukubi Network. The username may have changed or the profile may be private.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="bg-brand-dusk hover:bg-brand-dusk text-slate-300 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 transition-colors"
            >
              Return Home
            </Link>
            <Link
              href="/search"
              className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition-colors"
            >
              Search Ecosystem
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profileRow = profile as unknown as ProfileRow;
  const isOwnProfile = currentUser?.id === profileRow.id;

  let isFollowing = false;
  let recentPosts: Post[] = [];

  const [followResult, postsResult] = await Promise.all([
    currentUser && !isOwnProfile
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileRow.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('posts')
      .select('id, content, created_at')
      .eq('author_id', profileRow.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  isFollowing = !!followResult.data;
  recentPosts = (postsResult.data ?? []) as Post[];

  const initials = profileRow.display_name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone">
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-brand-sandstone text-sm font-semibold">
          ← Back
        </Link>
        <h1 className="text-lg font-extrabold text-brand-sandstone truncate">{profileRow.display_name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ProfileHeaderActions
            username={profileRow.username}
            isOwnProfile={isOwnProfile}
            isAuthenticated={!!currentUser}
          />
          {isOwnProfile && (
            <Link href="/settings" aria-label="Profile settings" className="p-2 text-slate-300 hover:text-brand-sandstone rounded-full hover:bg-brand-dusk transition-colors">
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <section className="bg-brand-dusk/70 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-sky-950 via-slate-900 to-amber-950/40" />
          <div className="p-5 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-caribbeanSea to-brand-goldenHour p-0.5">
              <div className="w-full h-full bg-brand-dusk rounded-xl flex items-center justify-center text-2xl font-extrabold">
                {initials}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-brand-sandstone">{profileRow.display_name}</h2>
              {profileRow.is_verified && (
                <BadgeCheck className="w-5 h-5 text-brand-caribbeanSea" aria-label="Verified" />
              )}
            </div>
            <p className="text-sm text-brand-sandstone/60">@{profileRow.username}</p>

            {profileRow.bio && (
              <p className="text-sm text-slate-200 mt-3 leading-relaxed">{profileRow.bio}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-brand-sandstone/60">
              {profileRow.website && (
                <a
                  href={profileRow.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-brand-caribbeanSea hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" /> {profileRow.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            <div className="mt-5 flex items-center gap-3">
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold text-xs px-5 py-2 rounded-full transition-colors"
                >
                  Edit Profile
                </Link>
              ) : (
                currentUser && (
                  <FollowButton
                    targetUserId={profileRow.id}
                    isFollowing={isFollowing}
                  />
                )
              )}
              {!currentUser && (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 bg-brand-caribbeanSea hover:bg-brand-caribbeanSea text-slate-950 font-bold text-xs px-4 py-2 rounded-full transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Follow
                </Link>
              )}
            </div>

            <div className="mt-5 flex gap-6 text-sm">
              <span>
                <strong className="text-brand-sandstone">{(profileRow.post_count ?? recentPosts.length).toLocaleString()}</strong>{' '}
                <span className="text-brand-sandstone/60">Posts</span>
              </span>
              <span>
                <strong className="text-brand-sandstone">{(profileRow.follower_count ?? 0).toLocaleString()}</strong>{' '}
                <span className="text-brand-sandstone/60">Followers</span>
              </span>
              <span>
                <strong className="text-brand-sandstone">{(profileRow.following_count ?? 0).toLocaleString()}</strong>{' '}
                <span className="text-brand-sandstone/60">Following</span>
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {recentPosts.length === 0 ? (
            <div className="bg-brand-dusk/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-sm text-brand-sandstone/40">No posts yet.</p>
            </div>
          ) : (
            recentPosts.map((post) => (
              <article key={post.id} className="bg-brand-dusk/60 border border-slate-800 rounded-2xl p-5">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                <span className="text-[11px] text-brand-sandstone/40 mt-2 block">{relativeTime(post.created_at)}</span>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
