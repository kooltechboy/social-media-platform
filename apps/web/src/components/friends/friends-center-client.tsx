'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  UserCheck,
  Check,
  X,
  Search,
  MessageSquare,
  Sparkles,
  MapPin,
  MoreVertical,
  Shield,
  EyeOff,
  UserMinus,
  Loader2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import {
  followUserAction,
  unfollowUserAction,
  sendFriendRequestAction,
  acceptFriendRequestAction,
  declineFriendRequestAction,
  cancelFriendRequestAction,
  unfriendAction,
  blockUserAction,
  dismissRecommendationAction,
} from '../../lib/social/relationship-actions';
import { type DiscoverProfile } from '../../lib/discovery/actions';

interface FriendsCenterClientProps {
  initialData: {
    friends: DiscoverProfile[];
    incomingRequests: DiscoverProfile[];
    outgoingRequests: DiscoverProfile[];
    following: DiscoverProfile[];
    followers: DiscoverProfile[];
    pymk: DiscoverProfile[];
    counts: {
      friendsCount: number;
      incomingCount: number;
      outgoingCount: number;
      followingCount: number;
      followersCount: number;
    };
  };
  initialTab: string;
  initialQuery: string;
  currentUserId?: string;
}

export default function FriendsCenterClient({
  initialData,
  initialTab,
  initialQuery,
  currentUserId,
}: FriendsCenterClientProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'pymk' | 'following' | 'followers'>(
    (initialTab as any) || 'friends'
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [friendsList, setFriendsList] = useState<DiscoverProfile[]>(initialData.friends);
  const [incomingList, setIncomingList] = useState<DiscoverProfile[]>(initialData.incomingRequests);
  const [outgoingList, setOutgoingList] = useState<DiscoverProfile[]>(initialData.outgoingRequests);
  const [followingList, setFollowingList] = useState<DiscoverProfile[]>(initialData.following);
  const [followersList, setFollowersList] = useState<DiscoverProfile[]>(initialData.followers);
  const [pymkList, setPymkList] = useState<DiscoverProfile[]>(initialData.pymk);

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialData.following.forEach((p) => (map[p.id] = true));
    return map;
  });

  const [friendshipStatusMap, setFriendshipStatusMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialData.friends.forEach((p) => (map[p.id] = 'accepted'));
    initialData.outgoingRequests.forEach((p) => (map[p.id] = 'pending_sent'));
    initialData.incomingRequests.forEach((p) => (map[p.id] = 'pending_received'));
    return map;
  });

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Social Action Handlers
  async function handleToggleFollow(userId: string) {
    if (!currentUserId || userId === currentUserId) return;
    const isFollowing = !!followingMap[userId];
    setFollowingMap((prev) => ({ ...prev, [userId]: !isFollowing }));
    setPendingActionId(userId);

    try {
      if (isFollowing) {
        await unfollowUserAction(userId);
      } else {
        await followUserAction(userId);
      }
    } catch {
      setFollowingMap((prev) => ({ ...prev, [userId]: isFollowing }));
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleSendFriendRequest(userId: string) {
    if (!currentUserId || userId === currentUserId) return;
    setFriendshipStatusMap((prev) => ({ ...prev, [userId]: 'pending_sent' }));
    setPendingActionId(userId);

    try {
      const res = await sendFriendRequestAction(userId);
      if (res.data && res.data.status === 'accepted') {
        setFriendshipStatusMap((prev) => ({ ...prev, [userId]: 'accepted' }));
      }
    } catch {
      setFriendshipStatusMap((prev) => ({ ...prev, [userId]: 'none' }));
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleAcceptRequest(profile: DiscoverProfile) {
    setFriendshipStatusMap((prev) => ({ ...prev, [profile.id]: 'accepted' }));
    setIncomingList((prev) => prev.filter((p) => p.id !== profile.id));
    setFriendsList((prev) => [profile, ...prev]);
    setPendingActionId(profile.id);

    try {
      await acceptFriendRequestAction(profile.id);
    } catch {
      setFriendshipStatusMap((prev) => ({ ...prev, [profile.id]: 'pending_received' }));
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleDeclineRequest(userId: string) {
    setIncomingList((prev) => prev.filter((p) => p.id !== userId));
    setFriendshipStatusMap((prev) => ({ ...prev, [userId]: 'none' }));
    setPendingActionId(userId);

    try {
      await declineFriendRequestAction(userId);
    } catch {
      // rollback
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleCancelRequest(userId: string) {
    setOutgoingList((prev) => prev.filter((p) => p.id !== userId));
    setFriendshipStatusMap((prev) => ({ ...prev, [userId]: 'none' }));
    setPendingActionId(userId);

    try {
      await cancelFriendRequestAction(userId);
    } catch {
      // rollback
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleUnfriend(userId: string) {
    setActiveMenuId(null);
    setFriendsList((prev) => prev.filter((p) => p.id !== userId));
    setFriendshipStatusMap((prev) => ({ ...prev, [userId]: 'none' }));
    setPendingActionId(userId);

    try {
      await unfriendAction(userId);
    } catch {
      // rollback
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleDismissRecommendation(profileId: string) {
    setActiveMenuId(null);
    setPymkList((prev) => prev.filter((p) => p.id !== profileId));
    try {
      await dismissRecommendationAction('profile', profileId, 'not_interested');
    } catch {
      // silently ignore
    }
  }

  async function handleBlock(userId: string) {
    setActiveMenuId(null);
    setFriendsList((prev) => prev.filter((p) => p.id !== userId));
    setIncomingList((prev) => prev.filter((p) => p.id !== userId));
    setOutgoingList((prev) => prev.filter((p) => p.id !== userId));
    setFollowingList((prev) => prev.filter((p) => p.id !== userId));
    setPymkList((prev) => prev.filter((p) => p.id !== userId));
    try {
      await blockUserAction(userId);
    } catch {
      // silently ignore
    }
  }

  // Filter lists by search query
  const qClean = searchQuery.trim().toLowerCase();
  const filterList = (list: DiscoverProfile[]) => {
    if (!qClean) return list;
    return list.filter(
      (p) =>
        p.display_name.toLowerCase().includes(qClean) ||
        p.username.toLowerCase().includes(qClean) ||
        (p.country_name && p.country_name.toLowerCase().includes(qClean))
    );
  };

  const filteredFriends = filterList(friendsList);
  const filteredIncoming = filterList(incomingList);
  const filteredOutgoing = filterList(outgoingList);
  const filteredFollowing = filterList(followingList);
  const filteredFollowers = filterList(followersList);
  const filteredPymk = filterList(pymkList);

  const tabs = [
    { id: 'friends', label: 'Friends', count: friendsList.length },
    { id: 'requests', label: 'Requests', count: incomingList.length + outgoingList.length, badge: incomingList.length > 0 ? `${incomingList.length} new` : undefined },
    { id: 'pymk', label: 'People You May Know', count: pymkList.length },
    { id: 'following', label: 'Following', count: followingList.length },
    { id: 'followers', label: 'Followers', count: followersList.length },
  ];

  return (
    <div className="space-y-6">
      {/* Search Input Bar & Tabs */}
      <div className="surface-header rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 md:pb-0" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative flex items-center gap-2 whitespace-nowrap min-h-[40px] ${
                  isActive
                    ? 'bg-white/15 text-brand-caribbeanSea border border-brand-caribbeanSea/40 shadow-sm'
                    : 'text-brand-sandstone/70 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-brand-caribbeanSea/25 text-brand-caribbeanSea border border-brand-caribbeanSea/40' : 'bg-white/10 text-brand-sandstone/70'
                }`}>
                  {tab.count}
                </span>
                {tab.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-brand-sunriseCoral text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Filter Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-brand-sandstone/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name, @..."
            className="w-full bg-[#181126]/95 border border-white/15 rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-brand-sandstone/50 focus:outline-none focus:border-brand-caribbeanSea focus:ring-2 focus:ring-brand-caribbeanSea/30 transition-all min-h-[40px]"
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: ALL FRIENDS                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {filteredFriends.length === 0 ? (
            <div className="surface-empty rounded-3xl p-8 sm:p-12 text-center space-y-3.5 max-w-xl mx-auto">
              <Users className="w-12 h-12 text-brand-caribbeanSea mx-auto" />
              <h3 className="text-base sm:text-lg font-black text-white">
                {searchQuery ? `No friends found matching "${searchQuery}"` : 'No friends connected yet'}
              </h3>
              <p className="text-xs sm:text-sm text-brand-sandstone/80 max-w-md mx-auto leading-relaxed">
                Explore Caribbean members, send friend requests, and grow your diaspora network.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('pymk')}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20 hover:brightness-110 transition-all min-h-[42px]"
              >
                <Sparkles className="w-4 h-4" /> View Suggested Members
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="surface-card surface-card-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3.5 group relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/profile/${friend.username}`}
                      className="flex items-center gap-3.5 min-w-0 flex-1"
                    >
                      <UserAvatar
                        src={friend.avatar_url}
                        name={friend.display_name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white truncate group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1.5">
                          {friend.display_name}
                          {friend.is_verified && (
                            <Check className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                          )}
                        </h4>
                        <p className="text-xs text-brand-sandstone/70 truncate">@{friend.username}</p>
                        {friend.country_name && (
                          <span className="text-xs text-brand-sunriseCoral flex items-center gap-1 mt-0.5 font-semibold">
                            <MapPin className="w-3 h-3 shrink-0" /> {friend.country_name}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Overflow menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === friend.id ? null : friend.id)}
                        className="p-2 rounded-xl text-brand-sandstone/60 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        aria-label="More actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === friend.id && (
                        <div className="absolute right-0 top-10 w-44 bg-[#1D1429] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUnfriend(friend.id)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 font-bold flex items-center gap-2"
                          >
                            <UserMinus className="w-4 h-4" /> Unfriend
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBlock(friend.id)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-brand-sandstone font-bold flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" /> Block
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-3 border-t border-white/10">
                    <Link
                      href={`/messages?u=${encodeURIComponent(friend.username)}`}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors min-h-[38px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Message
                    </Link>
                    <Link
                      href={`/profile/${friend.username}`}
                      className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-brand-sandstone/90 border border-white/10 transition-colors min-h-[38px] flex items-center justify-center"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 2: FRIEND REQUESTS (INCOMING & OUTGOING)              */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Incoming Requests ({filteredIncoming.length})
            </h3>

            {filteredIncoming.length === 0 ? (
              <div className="surface-card rounded-2xl p-6 text-center text-xs sm:text-sm text-brand-sandstone/70">
                No incoming friend requests at this time.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredIncoming.map((req) => (
                  <div
                    key={req.id}
                    className="surface-card surface-card-interactive rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/profile/${req.username}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <UserAvatar
                        src={req.avatar_url}
                        name={req.display_name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white truncate">
                          {req.display_name}
                        </h4>
                        <p className="text-xs text-brand-sandstone/70 truncate">@{req.username}</p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={pendingActionId === req.id}
                        onClick={() => handleAcceptRequest(req)}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-black hover:brightness-110 transition-all disabled:opacity-50 min-h-[38px] min-w-[38px] flex items-center justify-center gap-1 text-xs"
                        title="Accept Friend Request"
                        aria-label={`Accept friend request from ${req.display_name}`}
                      >
                        {pendingActionId === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline">Accept</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={pendingActionId === req.id}
                        onClick={() => handleDeclineRequest(req.id)}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 text-rose-300 border border-white/15 hover:bg-rose-500/20 transition-all disabled:opacity-50 min-h-[38px] min-w-[38px] flex items-center justify-center gap-1 text-xs font-bold"
                        title="Decline Friend Request"
                        aria-label={`Decline friend request from ${req.display_name}`}
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Pending Requests */}
          <div className="space-y-3 pt-6 border-t border-white/10">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-2">
              <Clock className="w-4 h-4" /> Sent Requests ({filteredOutgoing.length})
            </h3>

            {filteredOutgoing.length === 0 ? (
              <div className="surface-card rounded-2xl p-6 text-center text-xs sm:text-sm text-brand-sandstone/70">
                No outgoing pending requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredOutgoing.map((req) => (
                  <div
                    key={req.id}
                    className="surface-card rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/profile/${req.username}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <UserAvatar
                        src={req.avatar_url}
                        name={req.display_name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white truncate">
                          {req.display_name}
                        </h4>
                        <p className="text-xs text-brand-sandstone/70 truncate">@{req.username}</p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      disabled={pendingActionId === req.id}
                      onClick={() => handleCancelRequest(req.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 text-brand-sandstone hover:text-rose-400 border border-white/15 hover:bg-white/15 transition-all min-h-[36px]"
                    >
                      {pendingActionId === req.id ? '…' : 'Cancel'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 3: PEOPLE YOU MAY KNOW (RECOMMENDATIONS)              */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'pymk' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-goldenHour" /> Caribbean Members You May Know ({filteredPymk.length})
            </h3>
          </div>

          {filteredPymk.length === 0 ? (
            <div className="surface-empty rounded-3xl p-8 sm:p-12 text-center space-y-3.5 max-w-xl mx-auto">
              <Sparkles className="w-12 h-12 text-brand-goldenHour mx-auto" />
              <h3 className="text-base sm:text-lg font-black text-white">No suggestions right now</h3>
              <p className="text-xs sm:text-sm text-brand-sandstone/80 max-w-md mx-auto leading-relaxed">
                Explore the Members Directory or Caribbean Hubs to connect with members across the diaspora.
              </p>
              <Link
                href="/members"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-5 py-2.5 rounded-xl bg-brand-caribbeanSea text-slate-950 hover:brightness-110 transition-all min-h-[42px]"
              >
                Browse All Members <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredPymk.map((person) => {
                const fStatus = friendshipStatusMap[person.id] || person.relationship?.friendshipStatus || 'none';
                const isFollowing = !!followingMap[person.id] || !!person.relationship?.isFollowing;
                const isSelf = currentUserId === person.id;

                return (
                  <div
                    key={person.id}
                    className="surface-card surface-card-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3.5 group relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/profile/${person.username}`}
                        className="flex items-center gap-3.5 min-w-0 flex-1"
                      >
                        <UserAvatar
                          src={person.avatar_url}
                          name={person.display_name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-white truncate group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1.5">
                            {person.display_name}
                            {person.is_verified && (
                              <Check className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                            )}
                          </h4>
                          <p className="text-xs text-brand-sandstone/70 truncate">@{person.username}</p>
                          {person.recommendationReason && (
                            <span className="text-xs font-bold text-brand-caribbeanSea block mt-0.5 truncate">
                              {person.recommendationReason}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Overflow menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === person.id ? null : person.id)}
                          className="p-2 rounded-xl text-brand-sandstone/60 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === person.id && (
                          <div className="absolute right-0 top-10 w-44 bg-[#1D1429] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 text-xs">
                            <button
                              type="button"
                              onClick={() => handleDismissRecommendation(person.id)}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-brand-sandstone font-bold flex items-center gap-2"
                            >
                              <EyeOff className="w-4 h-4" /> Not interested
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBlock(person.id)}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 font-bold flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" /> Block
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isSelf && (
                      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                        {/* Friend Action */}
                        {fStatus === 'accepted' ? (
                          <span className="flex-1 text-center text-xs font-bold py-2 rounded-xl bg-white/10 text-brand-caribbeanSea border border-brand-caribbeanSea/30 flex items-center justify-center gap-1.5 min-h-[38px]">
                            <UserCheck className="w-3.5 h-3.5" /> Friends
                          </span>
                        ) : fStatus === 'pending_sent' ? (
                          <span className="flex-1 text-center text-xs font-bold py-2 rounded-xl bg-white/5 text-brand-sandstone/70 border border-white/10 flex items-center justify-center gap-1.5 min-h-[38px]">
                            <Clock className="w-3.5 h-3.5" /> Request Sent
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={pendingActionId === person.id}
                            onClick={() => handleSendFriendRequest(person.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black py-2 rounded-xl bg-brand-caribbeanSea hover:brightness-110 text-slate-950 transition-all shadow-sm min-h-[38px]"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Add Friend
                          </button>
                        )}

                        {/* Follow Toggle */}
                        <button
                          type="button"
                          disabled={pendingActionId === person.id}
                          onClick={() => handleToggleFollow(person.id)}
                          className={`text-xs font-bold px-3 py-2 rounded-xl transition-all min-h-[38px] ${
                            isFollowing
                              ? 'bg-white/10 text-brand-sandstone border border-white/15 hover:bg-rose-500/20 hover:text-rose-300'
                              : 'bg-brand-sunriseCoral hover:brightness-110 text-slate-950'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>

                        {/* Message Button */}
                        <Link
                          href={`/messages?u=${encodeURIComponent(person.username)}`}
                          className="text-xs font-bold px-3 py-2 rounded-xl bg-white/5 text-brand-sandstone border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1 min-h-[38px]"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Msg
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 4: FOLLOWING                                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'following' && (
        <div className="space-y-4">
          {filteredFollowing.length === 0 ? (
            <div className="surface-empty rounded-3xl p-8 sm:p-12 text-center space-y-3.5 max-w-xl mx-auto">
              <Users className="w-12 h-12 text-brand-caribbeanSea mx-auto" />
              <h3 className="text-base sm:text-lg font-black text-white">You are not following anyone yet</h3>
              <p className="text-xs sm:text-sm text-brand-sandstone/80 max-w-md mx-auto leading-relaxed">
                Follow creators, businesses, and friends to customize your home feed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredFollowing.map((person) => (
                <div
                  key={person.id}
                  className="surface-card surface-card-interactive rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <Link
                    href={`/profile/${person.username}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <UserAvatar
                      src={person.avatar_url}
                      name={person.display_name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-white truncate">
                        {person.display_name}
                      </h4>
                      <p className="text-xs text-brand-sandstone/70 truncate">@{person.username}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/messages?u=${encodeURIComponent(person.username)}`}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-white/10 text-white border border-white/10 hover:bg-white/15 transition-colors flex items-center gap-1 min-h-[38px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Msg
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(person.id)}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-white/10 text-brand-sandstone border border-white/15 hover:bg-rose-500/20 hover:text-rose-300 transition-all min-h-[38px]"
                    >
                      Following
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 5: FOLLOWERS                                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'followers' && (
        <div className="space-y-4">
          {filteredFollowers.length === 0 ? (
            <div className="surface-empty rounded-3xl p-8 sm:p-12 text-center space-y-3.5 max-w-xl mx-auto">
              <Users className="w-12 h-12 text-brand-caribbeanSea mx-auto" />
              <h3 className="text-base sm:text-lg font-black text-white">No followers yet</h3>
              <p className="text-xs sm:text-sm text-brand-sandstone/80 max-w-md mx-auto leading-relaxed">
                Share posts, join diaspora hubs, and engage with creator content to build your following.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredFollowers.map((person) => {
                const isFollowing = !!followingMap[person.id];
                return (
                  <div
                    key={person.id}
                    className="surface-card surface-card-interactive rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/profile/${person.username}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <UserAvatar
                        src={person.avatar_url}
                        name={person.display_name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white truncate">
                          {person.display_name}
                        </h4>
                        <p className="text-xs text-brand-sandstone/70 truncate">@{person.username}</p>
                      </div>
                    </Link>

                    {currentUserId !== person.id && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/messages?u=${encodeURIComponent(person.username)}`}
                          className="text-xs font-bold px-3 py-2 rounded-xl bg-white/10 text-white border border-white/10 hover:bg-white/15 transition-colors flex items-center gap-1 min-h-[38px]"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Msg
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleFollow(person.id)}
                          className={`text-xs font-bold px-3 py-2 rounded-xl transition-all min-h-[38px] ${
                            isFollowing
                              ? 'bg-white/10 text-brand-sandstone border border-white/15'
                              : 'bg-brand-sunriseCoral text-slate-950 hover:brightness-110 font-black'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow Back'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
