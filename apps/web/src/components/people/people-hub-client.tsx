'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Compass,
  Users,
  UserPlus,
  Radio,
  Sparkles,
  Search,
  Filter,
  Check,
  UserCheck,
  Clock,
  ArrowRight,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import PersonCard from './person-card';
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
import {
  fetchMembersDirectoryAction,
  type DiscoverProfile,
} from '../../lib/discovery/actions';
import { CARIBBEAN_TERRITORIES } from '../../lib/constants/caribbean-territories';

export type PeopleTab = 'discover' | 'friends' | 'requests' | 'following' | 'followers';

export interface PeopleHubClientProps {
  initialTab?: PeopleTab;
  initialOverview: {
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
  initialDirectory: {
    members: DiscoverProfile[];
    totalCount: number;
  };
  initialCountry?: string;
  initialCategory?: string;
  initialQuery?: string;
  currentUserId?: string;
}

export default function PeopleHubClient({
  initialTab = 'discover',
  initialOverview,
  initialDirectory,
  initialCountry = 'ALL',
  initialCategory = 'all',
  initialQuery = '',
  currentUserId,
}: PeopleHubClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PeopleTab>(initialTab);
  const [requestsSubTab, setRequestsSubTab] = useState<'incoming' | 'sent'>('incoming');

  // Discover state
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [directoryMembers, setDirectoryMembers] = useState<DiscoverProfile[]>(initialDirectory.members);
  const [directoryTotal, setDirectoryTotal] = useState(initialDirectory.totalCount);
  const [isSearchingDirectory, setIsSearchingDirectory] = useState(false);

  // Overview states
  const [friends, setFriends] = useState<DiscoverProfile[]>(initialOverview.friends);
  const [incomingRequests, setIncomingRequests] = useState<DiscoverProfile[]>(initialOverview.incomingRequests);
  const [outgoingRequests, setOutgoingRequests] = useState<DiscoverProfile[]>(initialOverview.outgoingRequests);
  const [following, setFollowing] = useState<DiscoverProfile[]>(initialOverview.following);
  const [followers, setFollowers] = useState<DiscoverProfile[]>(initialOverview.followers);
  const [pymk, setPymk] = useState<DiscoverProfile[]>(initialOverview.pymk);

  // Filter inside friends / following / followers
  const [localFilterQuery, setLocalFilterQuery] = useState('');

  // Pending action lock
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Handle Tab Switch & Sync URL
  const handleTabChange = (tab: PeopleTab) => {
    setActiveTab(tab);
    setLocalFilterQuery('');
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url.toString());
  };

  // Debounced Directory Query for Discover tab
  useEffect(() => {
    if (activeTab !== 'discover') return;
    const timer = setTimeout(async () => {
      setIsSearchingDirectory(true);
      try {
        const res = await fetchMembersDirectoryAction({
          countryIso: selectedCountry === 'ALL' ? undefined : selectedCountry,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          query: searchQuery.trim() || undefined,
        });
        setDirectoryMembers(res.members);
        setDirectoryTotal(res.totalCount);
      } catch (err) {
        console.error('[PeopleHub] Directory search error:', err);
      } finally {
        setIsSearchingDirectory(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCountry, selectedCategory, activeTab]);

  // Social Relationship Action Handlers with optimistic UI updates
  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUserId || targetUserId === currentUserId) return;
    setPendingUserId(targetUserId);

    // Optimistically update everywhere
    const updateProfileRel = (p: DiscoverProfile): DiscoverProfile => {
      if (p.id !== targetUserId) return p;
      const isNowFollowing = !p.relationship?.isFollowing;
      return {
        ...p,
        relationship: {
          ...p.relationship,
          state: isNowFollowing ? 'following' : 'none',
          isFollowing: isNowFollowing,
          friendshipStatus: p.relationship?.friendshipStatus || 'none',
        },
      };
    };

    setDirectoryMembers((prev) => prev.map(updateProfileRel));
    setFriends((prev) => prev.map(updateProfileRel));
    setFollowing((prev) => {
      const exists = prev.some((p) => p.id === targetUserId);
      if (exists) {
        return prev.filter((p) => p.id !== targetUserId);
      }
      const match =
        directoryMembers.find((p) => p.id === targetUserId) ||
        followers.find((p) => p.id === targetUserId) ||
        friends.find((p) => p.id === targetUserId);
      return match ? [updateProfileRel(match), ...prev] : prev;
    });
    setFollowers((prev) => prev.map(updateProfileRel));
    setPymk((prev) => prev.map(updateProfileRel));

    const target = directoryMembers.find((p) => p.id === targetUserId) ||
      following.find((p) => p.id === targetUserId);
    const wasFollowing = target?.relationship?.isFollowing ?? true;

    try {
      if (wasFollowing) {
        await unfollowUserAction(targetUserId);
      } else {
        await followUserAction(targetUserId);
      }
    } catch {
      // Revert on error
      router.refresh();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!currentUserId || targetUserId === currentUserId) return;
    setPendingUserId(targetUserId);

    const updateToPending = (p: DiscoverProfile): DiscoverProfile => {
      if (p.id !== targetUserId) return p;
      return {
        ...p,
        relationship: {
          ...p.relationship,
          state: 'request_sent',
          isFollowing: p.relationship?.isFollowing ?? false,
          friendshipStatus: 'pending_sent',
        },
      };
    };

    setDirectoryMembers((prev) => prev.map(updateToPending));
    setFollowers((prev) => prev.map(updateToPending));
    setPymk((prev) => prev.map(updateToPending));

    const targetPerson =
      directoryMembers.find((p) => p.id === targetUserId) ||
      followers.find((p) => p.id === targetUserId) ||
      pymk.find((p) => p.id === targetUserId);

    if (targetPerson) {
      setOutgoingRequests((prev) => [updateToPending(targetPerson), ...prev]);
    }

    try {
      const res = await sendFriendRequestAction(targetUserId);
      if (res.data?.status === 'accepted') {
        // Auto-accepted because they had sent us a request
        router.refresh();
      }
    } catch {
      router.refresh();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleAcceptFriendRequest = async (targetUserId: string) => {
    if (!currentUserId) return;
    setPendingUserId(targetUserId);

    const match = incomingRequests.find((p) => p.id === targetUserId);
    setIncomingRequests((prev) => prev.filter((p) => p.id !== targetUserId));

    if (match) {
      const acceptedPerson: DiscoverProfile = {
        ...match,
        relationship: {
          ...match.relationship,
          state: 'friends',
          isFollowing: match.relationship?.isFollowing ?? false,
          friendshipStatus: 'accepted',
        },
      };
      setFriends((prev) => [acceptedPerson, ...prev]);
    }

    try {
      await acceptFriendRequestAction(targetUserId);
    } catch {
      router.refresh();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleDeclineFriendRequest = async (targetUserId: string) => {
    if (!currentUserId) return;
    setPendingUserId(targetUserId);
    setIncomingRequests((prev) => prev.filter((p) => p.id !== targetUserId));

    try {
      await declineFriendRequestAction(targetUserId);
    } catch {
      router.refresh();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleCancelFriendRequest = async (targetUserId: string) => {
    if (!currentUserId) return;
    setPendingUserId(targetUserId);
    setOutgoingRequests((prev) => prev.filter((p) => p.id !== targetUserId));

    const revertRel = (p: DiscoverProfile): DiscoverProfile => {
      if (p.id !== targetUserId) return p;
      return {
        ...p,
        relationship: {
          ...p.relationship,
          state: p.relationship?.isFollowing ? 'following' : 'none',
          isFollowing: p.relationship?.isFollowing ?? false,
          friendshipStatus: 'none',
        },
      };
    };

    setDirectoryMembers((prev) => prev.map(revertRel));
    setFollowers((prev) => prev.map(revertRel));

    try {
      await cancelFriendRequestAction(targetUserId);
    } catch {
      router.refresh();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleUnfriend = async (targetUserId: string) => {
    if (!currentUserId) return;
    setPendingUserId(targetUserId);
    setFriends((prev) => prev.filter((p) => p.id !== targetUserId));

    const revertRel = (p: DiscoverProfile): DiscoverProfile => {
      if (p.id !== targetUserId) return p;
      return {
        ...p,
        relationship: {
          ...p.relationship,
          state: p.relationship?.isFollowing ? 'following' : 'none',
          isFollowing: p.relationship?.isFollowing ?? false,
          friendshipStatus: 'none',
        },
      };
    };

    setDirectoryMembers((prev) => prev.map(revertRel));
    setFollowing((prev) => prev.map(revertRel));
    setFollowers((prev) => prev.map(revertRel));

    try {
      await unfriendAction(targetUserId);
    } catch {
      router.refresh();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleBlock = async (targetUserId: string) => {
    if (!currentUserId) return;
    setPendingUserId(targetUserId);
    setDirectoryMembers((prev) => prev.filter((p) => p.id !== targetUserId));
    setFriends((prev) => prev.filter((p) => p.id !== targetUserId));
    setIncomingRequests((prev) => prev.filter((p) => p.id !== targetUserId));
    setOutgoingRequests((prev) => prev.filter((p) => p.id !== targetUserId));
    setFollowing((prev) => prev.filter((p) => p.id !== targetUserId));
    setFollowers((prev) => prev.filter((p) => p.id !== targetUserId));
    setPymk((prev) => prev.filter((p) => p.id !== targetUserId));

    try {
      await blockUserAction(targetUserId);
    } catch {
      router.refresh();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleDismissPymk = async (targetUserId: string) => {
    setPymk((prev) => prev.filter((p) => p.id !== targetUserId));
    try {
      await dismissRecommendationAction('profile', targetUserId, 'not_interested');
    } catch {
      // Ignore
    }
  };

  // Filter helper for local lists
  const filterList = (list: DiscoverProfile[]) => {
    if (!localFilterQuery.trim()) return list;
    const q = localFilterQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        (p.country_name && p.country_name.toLowerCase().includes(q))
    );
  };

  const territoryOptions = [
    { iso: 'ALL', name: 'All Territories 🌴' },
    ...CARIBBEAN_TERRITORIES.map((t) => ({ iso: t.iso, name: `${t.flag} ${t.name}` })),
  ];

  const totalRequestsCount = incomingRequests.length + outgoingRequests.length;

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* PRIMARY NAVIGATION TABS (DISCOVER, FRIENDS, REQUESTS, ETC) */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#140C22]/90 border border-white/10 rounded-2xl overflow-x-auto scrollbar-none shadow-xl backdrop-blur-xl">
        <button
          type="button"
          onClick={() => handleTabChange('discover')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap min-h-[42px] ${
            activeTab === 'discover'
              ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
              : 'text-brand-sandstone/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Discover Members</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('friends')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap min-h-[42px] ${
            activeTab === 'friends'
              ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
              : 'text-brand-sandstone/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My Friends</span>
          {friends.length > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'friends' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-white'
              }`}
            >
              {friends.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap min-h-[42px] ${
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
              : 'text-brand-sandstone/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Requests</span>
          {incomingRequests.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-black animate-pulse">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('following')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap min-h-[42px] ${
            activeTab === 'following'
              ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
              : 'text-brand-sandstone/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Following</span>
          {following.length > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'following' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-white'
              }`}
            >
              {following.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('followers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap min-h-[42px] ${
            activeTab === 'followers'
              ? 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
              : 'text-brand-sandstone/80 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Followers</span>
          {followers.length > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'followers' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-white'
              }`}
            >
              {followers.length}
            </span>
          )}
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. DISCOVER MEMBERS TAB                                    */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'discover' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Territory & Category Filter Bar */}
          <div className="surface-card rounded-2xl p-4 sm:p-5 space-y-4 border border-white/10 bg-[#140C22]/80">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Keyword Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sandstone/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members by name, username, culture..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs sm:text-sm placeholder:text-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                />
              </div>

              {/* Territory Selector */}
              <div className="w-full md:w-56 shrink-0">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  aria-label="Filter by Caribbean Territory"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-brand-caribbeanSea transition-colors"
                >
                  {territoryOptions.map((t) => (
                    <option key={t.iso} value={t.iso} className="bg-[#1D1429] text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
                {(['all', 'personal', 'creator', 'business'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap min-h-[38px] ${
                      selectedCategory === cat
                        ? 'bg-brand-caribbeanSea text-slate-950 font-black'
                        : 'bg-white/5 text-brand-sandstone/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat === 'all' ? 'All Roles' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Connections Strip (PYMK) */}
          {pymk.length > 0 && !searchQuery && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-goldenHour" /> Recommended Connections
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {pymk.slice(0, 3).map((person) => (
                  <PersonCard
                    key={`pymk-${person.id}`}
                    person={person}
                    currentUserId={currentUserId}
                    onFollowToggle={handleFollowToggle}
                    onSendFriendRequest={handleSendFriendRequest}
                    onBlock={handleBlock}
                    isActionPending={pendingUserId === person.id}
                    contextMode="discover"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Members Grid Header & Count */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-goldenHour" />
              <span>Caribbean Directory</span>
              <span className="text-xs text-brand-sandstone/60 font-medium">({directoryTotal} members)</span>
            </h3>

            {isSearchingDirectory && (
              <div className="flex items-center gap-1.5 text-xs text-brand-sandstone/60">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-caribbeanSea" />
                <span>Updating...</span>
              </div>
            )}
          </div>

          {/* Directory Members Grid */}
          {directoryMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4">
              {directoryMembers.map((member) => (
                <PersonCard
                  key={member.id}
                  person={member}
                  currentUserId={currentUserId}
                  onFollowToggle={handleFollowToggle}
                  onSendFriendRequest={handleSendFriendRequest}
                  onBlock={handleBlock}
                  isActionPending={pendingUserId === member.id}
                  contextMode="discover"
                />
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-10 text-center space-y-3 border border-white/10 bg-[#140C22]/80">
              <Compass className="w-10 h-10 text-brand-goldenHour/60 mx-auto" />
              <h4 className="text-base font-extrabold text-white">No members found</h4>
              <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto">
                We couldn&apos;t find anyone matching your current filters. Try selecting &quot;All Territories&quot; or clearing your search.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountry('ALL');
                  setSelectedCategory('all');
                }}
                className="text-xs font-black px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. MY FRIENDS TAB                                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'friends' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Local Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sandstone/60" />
              <input
                type="text"
                value={localFilterQuery}
                onChange={(e) => setLocalFilterQuery(e.target.value)}
                placeholder="Search your friends..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs sm:text-sm placeholder:text-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
              />
            </div>

            <p className="text-xs text-brand-sandstone/70 self-start sm:self-auto">
              Showing <span className="text-white font-bold">{filterList(friends).length}</span> accepted friends
            </p>
          </div>

          {filterList(friends).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4">
              {filterList(friends).map((friend) => (
                <PersonCard
                  key={friend.id}
                  person={friend}
                  currentUserId={currentUserId}
                  onFollowToggle={handleFollowToggle}
                  onUnfriend={handleUnfriend}
                  onBlock={handleBlock}
                  isActionPending={pendingUserId === friend.id}
                  contextMode="friends"
                />
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-12 text-center space-y-4 border border-white/10 bg-[#140C22]/80 max-w-md mx-auto">
              <Users className="w-12 h-12 text-brand-caribbeanSea/60 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-black text-white">
                  {localFilterQuery ? 'No matching friends' : "You haven't added any friends yet"}
                </h4>
                <p className="text-xs text-brand-sandstone/70 leading-relaxed">
                  {localFilterQuery
                    ? 'Try searching with a different name or clear the search input.'
                    : 'Personal friends are mutual connections on TUKUBI. Browse discoverable members or connect with Caribbean creators.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('discover')}
                className="inline-flex items-center gap-2 text-xs font-black px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md hover:brightness-110 transition-all"
              >
                <span>Discover People</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. FRIEND REQUESTS TAB (INCOMING & SENT)                   */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub-Tabs: Incoming vs Sent */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setRequestsSubTab('incoming')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                requestsSubTab === 'incoming'
                  ? 'bg-brand-caribbeanSea text-slate-950 shadow-sm'
                  : 'bg-white/5 text-brand-sandstone hover:text-white'
              }`}
            >
              <span>Incoming Requests</span>
              {incomingRequests.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-black">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRequestsSubTab('sent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                requestsSubTab === 'sent'
                  ? 'bg-brand-caribbeanSea text-slate-950 shadow-sm'
                  : 'bg-white/5 text-brand-sandstone hover:text-white'
              }`}
            >
              <span>Sent Requests</span>
              {outgoingRequests.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-bold">
                  {outgoingRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Incoming Sub-Tab */}
          {requestsSubTab === 'incoming' && (
            <div>
              {incomingRequests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incomingRequests.map((req) => (
                    <PersonCard
                      key={`in-${req.id}`}
                      person={req}
                      currentUserId={currentUserId}
                      onAcceptFriendRequest={handleAcceptFriendRequest}
                      onDeclineFriendRequest={handleDeclineFriendRequest}
                      onBlock={handleBlock}
                      isActionPending={pendingUserId === req.id}
                      contextMode="requests"
                    />
                  ))}
                </div>
              ) : (
                <div className="surface-card rounded-2xl p-12 text-center space-y-3 border border-white/10 bg-[#140C22]/80 max-w-md mx-auto">
                  <UserCheck className="w-12 h-12 text-emerald-400/60 mx-auto" />
                  <h4 className="text-base font-extrabold text-white">You&apos;re all caught up!</h4>
                  <p className="text-xs text-brand-sandstone/70">
                    No pending incoming friend requests at this time.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sent Sub-Tab */}
          {requestsSubTab === 'sent' && (
            <div>
              {outgoingRequests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outgoingRequests.map((req) => (
                    <PersonCard
                      key={`out-${req.id}`}
                      person={req}
                      currentUserId={currentUserId}
                      onCancelFriendRequest={handleCancelFriendRequest}
                      onBlock={handleBlock}
                      isActionPending={pendingUserId === req.id}
                      contextMode="requests"
                    />
                  ))}
                </div>
              ) : (
                <div className="surface-card rounded-2xl p-12 text-center space-y-3 border border-white/10 bg-[#140C22]/80 max-w-md mx-auto">
                  <Clock className="w-12 h-12 text-brand-goldenHour/60 mx-auto" />
                  <h4 className="text-base font-extrabold text-white">No pending sent requests</h4>
                  <p className="text-xs text-brand-sandstone/70">
                    When you send friend requests, they will appear here until accepted.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. FOLLOWING TAB                                           */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'following' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sandstone/60" />
              <input
                type="text"
                value={localFilterQuery}
                onChange={(e) => setLocalFilterQuery(e.target.value)}
                placeholder="Search accounts you follow..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs sm:text-sm placeholder:text-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
              />
            </div>

            <p className="text-xs text-brand-sandstone/70 self-start sm:self-auto">
              Following <span className="text-white font-bold">{filterList(following).length}</span> accounts
            </p>
          </div>

          {filterList(following).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4">
              {filterList(following).map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  currentUserId={currentUserId}
                  onFollowToggle={handleFollowToggle}
                  onSendFriendRequest={handleSendFriendRequest}
                  onBlock={handleBlock}
                  isActionPending={pendingUserId === person.id}
                  contextMode="following"
                />
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-12 text-center space-y-4 border border-white/10 bg-[#140C22]/80 max-w-md mx-auto">
              <Radio className="w-12 h-12 text-brand-goldenHour/60 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-black text-white">
                  {localFilterQuery ? 'No matching accounts' : 'You are not following anyone yet'}
                </h4>
                <p className="text-xs text-brand-sandstone/70 leading-relaxed">
                  {localFilterQuery
                    ? 'Try another search term or clear the input.'
                    : 'Follow creators, public figures, businesses, and official accounts to see their posts and broadcasts.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('discover')}
                className="inline-flex items-center gap-2 text-xs font-black px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 shadow-md hover:brightness-110 transition-all"
              >
                <span>Discover People &amp; Creators</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. FOLLOWERS TAB                                           */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'followers' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sandstone/60" />
              <input
                type="text"
                value={localFilterQuery}
                onChange={(e) => setLocalFilterQuery(e.target.value)}
                placeholder="Search followers..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs sm:text-sm placeholder:text-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea transition-colors"
              />
            </div>

            <p className="text-xs text-brand-sandstone/70 self-start sm:self-auto">
              <span className="text-white font-bold">{filterList(followers).length}</span> followers
            </p>
          </div>

          {filterList(followers).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4">
              {filterList(followers).map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  currentUserId={currentUserId}
                  onFollowToggle={handleFollowToggle}
                  onSendFriendRequest={handleSendFriendRequest}
                  onBlock={handleBlock}
                  isActionPending={pendingUserId === person.id}
                  contextMode="followers"
                />
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-12 text-center space-y-4 border border-white/10 bg-[#140C22]/80 max-w-md mx-auto">
              <Sparkles className="w-12 h-12 text-brand-sunriseCoral/60 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-black text-white">
                  {localFilterQuery ? 'No matching followers' : 'No followers yet'}
                </h4>
                <p className="text-xs text-brand-sandstone/70 leading-relaxed">
                  {localFilterQuery
                    ? 'Try another search term or clear the input.'
                    : 'Share your Caribbean profile or post stories and updates to grow your network on TUKUBI.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
