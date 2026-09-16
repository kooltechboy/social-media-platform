'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { Search, MessageSquare, BadgeCheck, Users, Compass, ArrowRight, Loader2, X, Sparkles, MessageCircle, UserCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import UserAvatar from './user-avatar';
import { followUserAction, unfollowUserAction } from '../lib/social/relationship-actions';

interface FriendMember {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen?: string;
}

export interface OnlineFriendsWidgetProps {
  initialUserId?: string | null;
}

export default function OnlineFriendsWidget({ initialUserId }: OnlineFriendsWidgetProps = {}) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'online'>('all');
  const [friends, setFriends] = useState<FriendMember[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserId || null);
  const [followingUserIds, setFollowingUserIds] = useState<Set<string>>(new Set());
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // 1. Initial profile fetch and Realtime Presence setup
  useEffect(() => {
    let channel: any;

    async function loadMembersAndPresence() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let activeUserId = initialUserId;
        if (!activeUserId) {
          const { data: authData } = await supabase.auth.getUser();
          activeUserId = authData?.user?.id || null;
        }

        if (activeUserId) {
          setCurrentUserId(activeUserId);

          // 1. Fetch Follows (for one-way follow state)
          const followsRes = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', activeUserId);

          if (followsRes?.data) {
            setFollowingUserIds(new Set(followsRes.data.map((f: any) => f.following_id)));
          }

          // 2. Fetch Strictly Accepted Friendships (Core Product Rule)
          const { data: frData } = await supabase
            .from('friendships')
            .select('requester_id, addressee_id')
            .eq('status', 'accepted')
            .or(`requester_id.eq.${activeUserId},addressee_id.eq.${activeUserId}`);

          const friendIds = (frData || []).map((f: any) =>
            f.requester_id === activeUserId ? f.addressee_id : f.requester_id
          );

          if (friendIds.length > 0) {
            const { data: profilesRes } = await supabase
              .from('profiles')
              .select('id, display_name, username, is_verified, avatar_url, updated_at')
              .in('id', friendIds);

            if (profilesRes) {
              const mapped: FriendMember[] = profilesRes.map((p) => ({
                id: p.id,
                name: p.display_name || p.username || 'Caribbean Friend',
                username: p.username || p.id.slice(0, 8),
                avatarUrl: p.avatar_url,
                isVerified: !!p.is_verified,
                isOnline: false,
              }));
              setFriends(mapped);
            }
          } else {
            setFriends([]);
          }
        } else {
          setFriends([]);
        }

        // 3. Track Realtime Presence
        channel = supabase.channel('tukubi:presence', {
          config: { presence: { key: activeUserId || `anon-${Math.random().toString(36).slice(2, 7)}` } },
        });

        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const onlineIds = new Set<string>();
            Object.values(state).forEach((presences: any) => {
              presences.forEach((p: any) => {
                if (p.userId) onlineIds.add(p.userId);
              });
            });
            setOnlineUserIds(onlineIds);
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED' && activeUserId) {
              await channel.track({
                userId: activeUserId,
                onlineAt: new Date().toISOString(),
              });
            }
          });
      } catch (err) {
        console.error('[OnlineFriendsWidget] Error fetching friends:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMembersAndPresence();

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, initialUserId]);

  // 3. Debounced search within accepted friends
  useEffect(() => {
    // Client-side search within authenticated user's friends list
    // (Preserves strict friendship boundary and prevents member leakage)
  }, [search]);

  async function handleToggleFollow(targetId: string) {
    if (!currentUserId || targetId === currentUserId) return;
    const isCurrentlyFollowing = followingUserIds.has(targetId);

    setFollowingUserIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }
      return next;
    });

    setFollowLoadingId(targetId);
    try {
      if (isCurrentlyFollowing) {
        await unfollowUserAction(targetId);
      } else {
        await followUserAction(targetId);
      }
    } catch (err) {
      console.error('[OnlineFriendsWidget] Follow error:', err);
      setFollowingUserIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.add(targetId);
        } else {
          next.delete(targetId);
        }
        return next;
      });
    } finally {
      setFollowLoadingId(null);
    }
  }

  const onlineCount = friends.filter((f) => onlineUserIds.has(f.id)).length;

  const displayedFriends = useMemo(() => {
    let list = friends.map((f) => ({
      ...f,
      isOnline: onlineUserIds.has(f.id),
    }));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.username.toLowerCase().includes(q));
    }
    if (activeFilter === 'online') {
      list = list.filter((f) => f.isOnline);
    }
    return list;
  }, [friends, onlineUserIds, search, activeFilter]);

  return (
    <div className="bg-[#130B1E]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
      {/* Specular top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Header with live status */}
      <div className="flex items-center justify-between">
        <Link
          href="/friends"
          className="font-black text-sm md:text-base text-white flex items-center gap-2 hover:text-brand-caribbeanSea transition-colors"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 flex items-center justify-center text-brand-caribbeanSea">
            <Users className="w-4 h-4 md:w-4.5 md:h-4.5" />
          </div>
          <span>Online Friends</span>
        </Link>
        <span className="text-[10px] md:text-xs font-black px-2.5 md:px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {onlineCount} ONLINE
        </span>
      </div>

      {/* Filter Tabs & Quick Action */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center bg-[#1E142B] p-1 rounded-xl border border-white/10 text-[11px] md:text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 md:px-3.5 py-1 md:py-1.5 rounded-lg transition-all ${
              activeFilter === 'all'
                ? 'bg-brand-caribbeanSea text-slate-950 font-black shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('online')}
            className={`px-3 md:px-3.5 py-1 md:py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              activeFilter === 'online'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Online ({onlineCount})
          </button>
        </div>

        <Link
          href="/messages"
          className="text-[11px] md:text-xs font-bold px-2.5 md:px-3 py-1.5 md:py-2 min-h-[34px] md:min-h-[38px] rounded-xl bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/20 hover:from-brand-caribbeanSea/30 hover:to-brand-sunriseCoral/30 border border-brand-caribbeanSea/30 text-white flex items-center gap-1.5 transition-all"
          title="Open Messages"
        >
          <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-caribbeanSea" />
          <span>Messages</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 md:h-4.5 md:w-4.5 text-slate-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members by name or @..."
          className="w-full bg-[#1A1128] border border-white/15 rounded-xl pl-9 pr-8 py-2.5 md:py-3 min-h-[40px] md:min-h-[44px] text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/50 transition-all font-medium"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        )}
      </div>

      {/* Members Feed */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {loading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-white/15 rounded w-28" />
                  <div className="h-2.5 bg-white/10 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedFriends.length > 0 ? (
          displayedFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-2.5 md:p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all group shadow-sm cursor-pointer"
            >
              <Link
                href={`/messages?u=${encodeURIComponent(friend.username)}`}
                className="flex items-center gap-3 flex-1 min-w-0 pr-2"
                title={`Chat with ${friend.name}`}
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    src={friend.avatarUrl}
                    name={friend.name}
                    size="sm"
                  />
                  {friend.isOnline && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#130B1E] shadow-sm"
                      title="Online now"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs md:text-sm font-black text-white group-hover:text-brand-caribbeanSea transition-colors truncate">
                      {friend.name}
                    </p>
                    {friend.isVerified && (
                      <BadgeCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-caribbeanSea flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] md:text-xs font-semibold text-slate-300 truncate">
                    @{friend.username}
                  </p>
                </div>
              </Link>

              {/* Actions: Follow and Direct Message */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {currentUserId && currentUserId !== friend.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFollow(friend.id);
                    }}
                    disabled={followLoadingId === friend.id}
                    className={`px-2 md:px-2.5 py-1.5 md:py-2 min-h-[32px] md:min-h-[36px] rounded-xl text-[10px] md:text-xs font-black border transition-all flex items-center gap-1 shadow-sm ${
                      followingUserIds.has(friend.id)
                        ? 'bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border-white/15 hover:border-rose-500/30'
                        : 'bg-brand-sunriseCoral/20 hover:bg-brand-sunriseCoral text-brand-sunriseCoral hover:text-slate-950 border-brand-sunriseCoral/40 hover:border-transparent'
                    }`}
                    title={followingUserIds.has(friend.id) ? `Unfollow ${friend.name}` : `Follow ${friend.name}`}
                  >
                    {followingUserIds.has(friend.id) ? (
                      <>
                        <UserCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="hidden sm:inline">Follow</span>
                      </>
                    )}
                  </button>
                )}

                <Link
                  href={`/messages?u=${encodeURIComponent(friend.username)}`}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 min-h-[32px] md:min-h-[36px] rounded-xl bg-brand-caribbeanSea/15 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 border border-brand-caribbeanSea/30 hover:border-transparent transition-all shadow-sm flex items-center gap-1 flex-shrink-0"
                  title={`Start chat with ${friend.name}`}
                >
                  <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-[10px] md:text-xs font-black hidden sm:inline-block">Chat</span>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 px-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 space-y-2">
            <Users className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs md:text-sm font-bold text-slate-200">
              {friends.length === 0
                ? "You don't have any friends yet"
                : activeFilter === 'online'
                ? 'None of your friends are currently online'
                : `No friends found matching "${search}"`}
            </p>
            <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed">
              {friends.length === 0
                ? 'Friends are mutual accepted connections on TUKUBI. Explore the Members Directory to connect.'
                : 'Stay tuned for when your connections log in across the diaspora.'}
            </p>
            {friends.length === 0 && (
              <Link
                href="/members"
                className="inline-block text-[11px] font-black px-3 py-1.5 rounded-xl bg-brand-caribbeanSea text-slate-950 hover:brightness-110 transition-all mt-1"
              >
                Browse Members
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <Link
          href="/friends"
          className="text-[11px] md:text-xs font-black text-brand-caribbeanSea hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          View All Friends <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
        </Link>
        <Link
          href="/members"
          className="text-[11px] md:text-xs font-black text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          <Compass className="w-3 h-3 md:w-3.5 md:h-3.5" /> Discover Directory
        </Link>
      </div>
    </div>
  );
}
