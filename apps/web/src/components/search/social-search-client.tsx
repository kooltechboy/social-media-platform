'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  FileText,
  Users,
  CheckCircle,
  MapPin,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import { followAction, unfollowAction } from '../../lib/social/profile-actions';

export interface SearchProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  origin_country_iso?: string | null;
  is_verified?: boolean;
  account_type?: string;
}

export interface SearchPost {
  id: string;
  author_id: string;
  content: string | null;
  created_at: string;
  media_urls?: string[] | null;
  likes_count: number;
  comments_count: number;
  profiles?: {
    display_name: string;
    username: string;
    avatar_url?: string | null;
    is_verified?: boolean;
  } | null;
}

export interface SearchCommunity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  member_count: number;
  country_iso?: string | null;
}

interface SocialSearchClientProps {
  initialQuery: string;
  initialProfiles: SearchProfile[];
  initialPosts: SearchPost[];
  initialCommunities: SearchCommunity[];
  currentUserId?: string;
  initialFollowingIds: string[];
}

export default function SocialSearchClient({
  initialQuery,
  initialProfiles,
  initialPosts,
  initialCommunities,
  currentUserId,
  initialFollowingIds,
}: SocialSearchClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'posts' | 'communities'>('all');
  const [profiles, setProfiles] = useState<SearchProfile[]>(initialProfiles);
  const [posts, setPosts] = useState<SearchPost[]>(initialPosts);
  const [communities, setCommunities] = useState<SearchCommunity[]>(initialCommunities);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialFollowingIds.forEach((id) => (map[id] = true));
    return map;
  });
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search on query change
  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setProfiles([]);
        setPosts([]);
        setCommunities([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const sanitized = trimmed.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();

        // 1. Search profiles / members by name and username
        const profilesPromise = supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, bio, origin_country_iso, is_verified, account_type')
          .or(`display_name.ilike.%${sanitized}%,username.ilike.%${sanitized}%`)
          .limit(20);

        // 2. Search posts by content
        const postsPromise = supabase
          .from('posts')
          .select('id, author_id, content, created_at, media_urls, likes_count, comments_count, profiles:profiles!posts_author_id_fkey(display_name, username, avatar_url, is_verified)')
          .eq('visibility', 'public')
          .ilike('content', `%${sanitized}%`)
          .order('created_at', { ascending: false })
          .limit(20);

        // 3. Search communities by name & slug
        const communitiesPromise = supabase
          .from('communities')
          .select('id, name, slug, description, member_count, country_iso')
          .or(`name.ilike.%${sanitized}%,slug.ilike.%${sanitized}%`)
          .limit(10);

        const [pRes, postRes, cRes] = await Promise.all([
          profilesPromise,
          postsPromise,
          communitiesPromise,
        ]);

        if (pRes.data) setProfiles(pRes.data);
        if (postRes.data) {
          const formattedPosts = postRes.data.map((p: any) => {
            const raw = p.profiles;
            const profile = Array.isArray(raw) ? raw[0] : raw;
            return { ...p, profiles: profile };
          });
          setPosts(formattedPosts);
        }
        if (cRes.data) setCommunities(cRes.data);
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function handleToggleFollow(userId: string) {
    if (userId === currentUserId) return;
    const isCurrentlyFollowing = !!followingMap[userId];

    // Optimistic UI update
    setFollowingMap((prev) => ({ ...prev, [userId]: !isCurrentlyFollowing }));
    setPendingFollowId(userId);

    try {
      if (isCurrentlyFollowing) {
        const res = await unfollowAction(userId);
        if (res.error) {
          setFollowingMap((prev) => ({ ...prev, [userId]: isCurrentlyFollowing }));
        }
      } else {
        const res = await followAction(userId);
        if (res.error) {
          setFollowingMap((prev) => ({ ...prev, [userId]: isCurrentlyFollowing }));
        }
      }
    } catch {
      setFollowingMap((prev) => ({ ...prev, [userId]: isCurrentlyFollowing }));
    } finally {
      setPendingFollowId(null);
    }
  }

  const hasResults = profiles.length > 0 || posts.length > 0 || communities.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-brand-caribbeanSea pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, usernames, posts, and Caribbean communities..."
          autoFocus
          className="w-full bg-brand-twilight/90 border border-slate-700/80 hover:border-brand-caribbeanSea/60 rounded-full pl-12 pr-12 py-3.5 text-sm sm:text-base text-brand-sandstone placeholder-brand-sandstone/50 focus:outline-none focus:border-brand-caribbeanSea focus:ring-2 focus:ring-brand-caribbeanSea/30 transition-all shadow-inner"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 top-3.5 text-brand-sandstone/40 hover:text-brand-sandstone"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none" role="tablist">
        {[
          { id: 'all', label: 'All Results', count: profiles.length + posts.length + communities.length },
          { id: 'people', label: 'People & Members', count: profiles.length },
          { id: 'posts', label: 'Posts', count: posts.length },
          { id: 'communities', label: 'Communities', count: communities.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-2 whitespace-nowrap text-xs sm:text-sm font-bold transition-all relative px-2 flex items-center gap-1.5 ${
                isActive ? 'text-brand-caribbeanSea' : 'text-brand-sandstone/60 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {query && tab.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-dusk border border-slate-800 text-brand-sandstone/80">
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center p-12 text-brand-sandstone/60 text-xs gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-brand-caribbeanSea" />
          <span>Searching Tukubi...</span>
        </div>
      )}

      {/* No Query Entered */}
      {!query.trim() && !isLoading && (
        <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-caribbeanSea/10 text-brand-caribbeanSea border border-brand-caribbeanSea/30 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">Find Members, Friends & Content</h3>
          <p className="text-xs text-brand-sandstone/60 max-w-md mx-auto leading-relaxed">
            Search by full name, username (e.g. &quot;daniel&quot; or &quot;@marcus&quot;), island keywords, or trending topics across the Caribbean diaspora.
          </p>
        </div>
      )}

      {/* Results Content */}
      {query.trim() && !isLoading && !hasResults && (
        <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-10 text-center space-y-2">
          <p className="text-sm font-bold text-slate-300">No results found for &quot;{query}&quot;</p>
          <p className="text-xs text-brand-sandstone/50">
            Check the spelling or try searching for another name, username, or topic.
          </p>
        </div>
      )}

      {query.trim() && !isLoading && hasResults && (
        <div className="space-y-6">
          {/* 1. PEOPLE & MEMBERS SECTION */}
          {(activeTab === 'all' || activeTab === 'people') && profiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> People & Members ({profiles.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profiles.map((person) => {
                  const isFollowing = !!followingMap[person.id];
                  const isSelf = currentUserId === person.id;

                  return (
                    <div
                      key={person.id}
                      className="glass rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-brand-caribbeanSea/40 transition-all group"
                    >
                      <Link
                        href={`/profile/${person.username}`}
                        className="flex items-center gap-3.5 flex-1 min-w-0"
                      >
                        <UserAvatar
                          src={person.avatar_url}
                          name={person.display_name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-brand-sandstone truncate flex items-center gap-1.5 group-hover:text-brand-caribbeanSea transition-colors">
                            {person.display_name}
                            {person.is_verified && (
                              <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea fill-brand-caribbeanSea/20 shrink-0" />
                            )}
                          </h4>
                          <p className="text-xs text-brand-sandstone/60 truncate">@{person.username}</p>
                          {person.bio && (
                            <p className="text-[11px] text-brand-sandstone/70 line-clamp-1 mt-1">
                              {person.bio}
                            </p>
                          )}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/profile/${person.username}`}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700 transition-colors"
                        >
                          Profile
                        </Link>

                        {!isSelf && (
                          <button
                            type="button"
                            disabled={pendingFollowId === person.id}
                            onClick={() => handleToggleFollow(person.id)}
                            className={`text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 ${
                              isFollowing
                                ? 'bg-brand-dusk text-slate-300 border border-slate-700 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40'
                                : 'bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-sunriseCoral/20'
                            }`}
                          >
                            {pendingFollowId === person.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isFollowing ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Follow</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. POSTS SECTION */}
          {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Posts ({posts.length})
                </h3>
              </div>

              <div className="space-y-3">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="glass rounded-2xl p-4 hover:border-brand-caribbeanSea/30 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/profile/${post.profiles?.username || 'member'}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <UserAvatar
                          src={post.profiles?.avatar_url}
                          name={post.profiles?.display_name || 'Member'}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs font-bold text-brand-sandstone group-hover:text-brand-caribbeanSea">
                            {post.profiles?.display_name || 'Member'}
                          </p>
                          <p className="text-[10px] text-brand-sandstone/60">
                            @{post.profiles?.username || 'member'}
                          </p>
                        </div>
                      </Link>
                      <span className="text-[10px] text-brand-sandstone/50 font-mono">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>

                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1">
                        {post.media_urls.map((url, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden bg-brand-twilight shrink-0">
                            {url.endsWith('.mp4') || url.includes('video') ? (
                              <video src={url} className="w-full h-full object-cover" />
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={url} alt="Media thumbnail" className="w-full h-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* 3. COMMUNITIES SECTION */}
          {(activeTab === 'all' || activeTab === 'communities') && communities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Communities ({communities.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {communities.map((comm) => (
                  <Link
                    key={comm.id}
                    href={`/communities/${comm.slug}`}
                    className="glass rounded-2xl p-4 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <h4 className="text-sm font-extrabold text-brand-sandstone group-hover:text-purple-300">
                        {comm.name}
                      </h4>
                      <p className="text-[11px] text-brand-sandstone/60 line-clamp-2 mt-1">
                        {comm.description || 'Caribbean diaspora hub and community group.'}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-brand-sandstone/50 flex items-center gap-1">
                      <Users className="w-3 h-3 text-purple-400" />
                      <span>{comm.member_count} members</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
