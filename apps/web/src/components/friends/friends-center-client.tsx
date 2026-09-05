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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`pb-2 whitespace-nowrap text-xs sm:text-sm font-bold transition-all relative px-2.5 flex items-center gap-1.5 ${
                  isActive ? 'text-brand-caribbeanSea' : 'text-brand-sandstone/60 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-dusk border border-slate-800 text-brand-sandstone/80">
                  {tab.count}
                </span>
                {tab.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-brand-sunriseCoral text-slate-950">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Live Filter Bar */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-brand-sandstone/50 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name, @..."
            className="w-full bg-brand-twilight/80 border border-slate-700/80 rounded-full pl-9 pr-4 py-2 text-xs text-brand-sandstone placeholder-brand-sandstone/50 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/40 transition-all"
          />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: ALL FRIENDS                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {filteredFriends.length === 0 ? (
            <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-brand-caribbeanSea/60 mx-auto" />
              <h3 className="text-sm font-bold text-slate-200">
                {searchQuery ? `No friends found matching "${searchQuery}"` : 'No friends connected yet'}
              </h3>
              <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
                Explore Caribbean members, send friend requests, and grow your diaspora network.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('pymk')}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20"
              >
                <Sparkles className="w-3.5 h-3.5" /> View Suggested Members
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="glass rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-brand-caribbeanSea/40 transition-all group relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/profile/${friend.username}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <UserAvatar
                        src={friend.avatar_url}
                        name={friend.display_name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-brand-sandstone truncate group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1">
                          {friend.display_name}
                          {friend.is_verified && (
                            <Check className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                          )}
                        </h4>
                        <p className="text-[11px] text-brand-sandstone/60 truncate">@{friend.username}</p>
                        {friend.country_name && (
                          <span className="text-[10px] text-brand-sunriseCoral flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {friend.country_name}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Overflow menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === friend.id ? null : friend.id)}
                        className="p-1.5 rounded-lg text-brand-sandstone/50 hover:text-brand-sandstone hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === friend.id && (
                        <div className="absolute right-0 top-8 w-40 bg-brand-dusk border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUnfriend(friend.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 font-semibold flex items-center gap-2"
                          >
                            <UserMinus className="w-3.5 h-3.5" /> Unfriend
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBlock(friend.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-brand-sandstone/80 font-semibold flex items-center gap-2"
                          >
                            <Shield className="w-3.5 h-3.5" /> Block
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <Link
                      href={`/messages?u=${encodeURIComponent(friend.username)}`}
                      className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold py-1.5 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Message
                    </Link>
                    <Link
                      href={`/profile/${friend.username}`}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-brand-twilight hover:bg-slate-800 text-brand-sandstone/80 border border-slate-800 transition-colors"
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
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Incoming Requests ({filteredIncoming.length})
            </h3>

            {filteredIncoming.length === 0 ? (
              <div className="bg-brand-dusk/40 border border-slate-800/80 rounded-2xl p-6 text-center text-xs text-brand-sandstone/50">
                No incoming friend requests at this time.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredIncoming.map((req) => (
                  <div
                    key={req.id}
                    className="glass rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-brand-caribbeanSea/30 transition-all"
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
                        <h4 className="text-xs font-extrabold text-brand-sandstone truncate">
                          {req.display_name}
                        </h4>
                        <p className="text-[11px] text-brand-sandstone/60 truncate">@{req.username}</p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={pendingActionId === req.id}
                        onClick={() => handleAcceptRequest(req)}
                        className="p-2 rounded-xl bg-brand-caribbeanSea text-slate-950 font-bold hover:bg-emerald-400 transition-all disabled:opacity-50"
                        title="Accept Friend Request"
                      >
                        {pendingActionId === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={pendingActionId === req.id}
                        onClick={() => handleDeclineRequest(req.id)}
                        className="p-2 rounded-xl bg-brand-dusk text-rose-400 border border-slate-700 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                        title="Decline Friend Request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Pending Requests */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Sent Requests ({filteredOutgoing.length})
            </h3>

            {filteredOutgoing.length === 0 ? (
              <div className="bg-brand-dusk/40 border border-slate-800/80 rounded-2xl p-6 text-center text-xs text-brand-sandstone/50">
                No outgoing pending requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredOutgoing.map((req) => (
                  <div
                    key={req.id}
                    className="glass rounded-2xl p-4 flex items-center justify-between gap-3"
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
                        <h4 className="text-xs font-extrabold text-brand-sandstone truncate">
                          {req.display_name}
                        </h4>
                        <p className="text-[11px] text-brand-sandstone/60 truncate">@{req.username}</p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      disabled={pendingActionId === req.id}
                      onClick={() => handleCancelRequest(req.id)}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-brand-dusk text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-rose-400 transition-all"
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
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Caribbean Members You May Know ({filteredPymk.length})
            </h3>
          </div>

          {filteredPymk.length === 0 ? (
            <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-brand-goldenHour/60 mx-auto" />
              <h3 className="text-sm font-bold text-slate-200">No suggestions right now</h3>
              <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
                Explore the Members Directory or Caribbean Hubs to connect with members across the diaspora.
              </p>
              <Link
                href="/members"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950"
              >
                Browse All Members <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPymk.map((person) => {
                const fStatus = friendshipStatusMap[person.id] || person.relationship?.friendshipStatus || 'none';
                const isFollowing = !!followingMap[person.id] || !!person.relationship?.isFollowing;
                const isSelf = currentUserId === person.id;

                return (
                  <div
                    key={person.id}
                    className="glass rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-brand-caribbeanSea/40 transition-all group relative"
                  >
                    <div className="flex items-start justify-between gap-3">
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
                          <h4 className="text-xs font-extrabold text-brand-sandstone truncate group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1">
                            {person.display_name}
                            {person.is_verified && (
                              <Check className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                            )}
                          </h4>
                          <p className="text-[11px] text-brand-sandstone/60 truncate">@{person.username}</p>
                          {person.recommendationReason && (
                            <span className="text-[10px] font-bold text-brand-caribbeanSea block mt-0.5 truncate">
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
                          className="p-1.5 rounded-lg text-brand-sandstone/50 hover:text-brand-sandstone hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === person.id && (
                          <div className="absolute right-0 top-8 w-44 bg-brand-dusk border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 text-xs">
                            <button
                              type="button"
                              onClick={() => handleDismissRecommendation(person.id)}
                              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-brand-sandstone/80 font-semibold flex items-center gap-2"
                            >
                              <EyeOff className="w-3.5 h-3.5" /> Not interested
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBlock(person.id)}
                              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 font-semibold flex items-center gap-2"
                            >
                              <Shield className="w-3.5 h-3.5" /> Block
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isSelf && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        {/* Friend Action */}
                        {fStatus === 'accepted' ? (
                          <span className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-xl bg-brand-dusk text-brand-caribbeanSea border border-brand-caribbeanSea/30 flex items-center justify-center gap-1">
                            <UserCheck className="w-3 h-3" /> Friends
                          </span>
                        ) : fStatus === 'pending_sent' ? (
                          <span className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-xl bg-brand-dusk text-slate-400 border border-slate-700 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" /> Request Sent
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={pendingActionId === person.id}
                            onClick={() => handleSendFriendRequest(person.id)}
                            className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold py-1.5 rounded-xl bg-brand-caribbeanSea hover:bg-emerald-400 text-slate-950 transition-all shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Add Friend
                          </button>
                        )}

                        {/* Follow Toggle */}
                        <button
                          type="button"
                          disabled={pendingActionId === person.id}
                          onClick={() => handleToggleFollow(person.id)}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                            isFollowing
                              ? 'bg-brand-dusk text-slate-300 border border-slate-700 hover:bg-rose-500/20 hover:text-rose-400'
                              : 'bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>

                        {/* Message Button */}
                        <Link
                          href={`/messages?u=${encodeURIComponent(person.username)}`}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-brand-dusk text-brand-sandstone border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1"
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
            <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-brand-caribbeanSea/60 mx-auto" />
              <h3 className="text-sm font-bold text-slate-200">You are not following anyone yet</h3>
              <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
                Follow creators, businesses, and friends to customize your home feed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFollowing.map((person) => (
                <div
                  key={person.id}
                  className="glass rounded-2xl p-4 flex items-center justify-between gap-3"
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
                      <h4 className="text-xs font-extrabold text-brand-sandstone truncate">
                        {person.display_name}
                      </h4>
                      <p className="text-[11px] text-brand-sandstone/60 truncate">@{person.username}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/messages?u=${encodeURIComponent(person.username)}`}
                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-brand-dusk text-brand-sandstone border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Msg
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(person.id)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-brand-dusk text-slate-300 border border-slate-700 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
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
            <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-brand-caribbeanSea/60 mx-auto" />
              <h3 className="text-sm font-bold text-slate-200">No followers yet</h3>
              <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
                Share posts, join diaspora hubs, and engage with creator content to build your following.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFollowers.map((person) => {
                const isFollowing = !!followingMap[person.id];
                return (
                  <div
                    key={person.id}
                    className="glass rounded-2xl p-4 flex items-center justify-between gap-3"
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
                        <h4 className="text-xs font-extrabold text-brand-sandstone truncate">
                          {person.display_name}
                        </h4>
                        <p className="text-[11px] text-brand-sandstone/60 truncate">@{person.username}</p>
                      </div>
                    </Link>

                    {currentUserId !== person.id && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/messages?u=${encodeURIComponent(person.username)}`}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-brand-dusk text-brand-sandstone border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Msg
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleFollow(person.id)}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                            isFollowing
                              ? 'bg-brand-dusk text-slate-300 border border-slate-700'
                              : 'bg-brand-sunriseCoral text-slate-950'
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
