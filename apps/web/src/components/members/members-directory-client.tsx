'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  Check,
  MapPin,
  Sparkles,
  Shield,
  EyeOff,
  MoreVertical,
  Loader2,
  X,
  Filter,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import {
  followUserAction,
  unfollowUserAction,
  sendFriendRequestAction,
  blockUserAction,
  dismissRecommendationAction,
} from '../../lib/social/relationship-actions';
import { fetchMembersDirectoryAction, type DiscoverProfile } from '../../lib/discovery/actions';
import { CARIBBEAN_TERRITORIES } from '../../lib/constants/caribbean-territories';

interface MembersDirectoryClientProps {
  initialMembers: DiscoverProfile[];
  totalCount: number;
  initialPymk: DiscoverProfile[];
  initialCountry: string;
  initialCategory: string;
  initialQuery: string;
  currentUserId?: string;
}

export default function MembersDirectoryClient({
  initialMembers,
  totalCount: initialTotal,
  initialPymk,
  initialCountry,
  initialCategory,
  initialQuery,
  currentUserId,
}: MembersDirectoryClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [members, setMembers] = useState<DiscoverProfile[]>(initialMembers);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [pymk, setPymk] = useState<DiscoverProfile[]>(initialPymk);
  const [isLoading, setIsLoading] = useState(false);

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialMembers.forEach((p) => {
      if (p.relationship?.isFollowing) map[p.id] = true;
    });
    initialPymk.forEach((p) => {
      if (p.relationship?.isFollowing) map[p.id] = true;
    });
    return map;
  });

  const [friendshipStatusMap, setFriendshipStatusMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialMembers.forEach((p) => {
      if (p.relationship?.friendshipStatus) map[p.id] = p.relationship.friendshipStatus;
    });
    initialPymk.forEach((p) => {
      if (p.relationship?.friendshipStatus) map[p.id] = p.relationship.friendshipStatus;
    });
    return map;
  });

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Debounced directory query on filter changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetchMembersDirectoryAction({
          countryIso: selectedCountry === 'ALL' ? undefined : selectedCountry,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          query: query.trim() || undefined,
        });
        setMembers(res.members);
        setTotalCount(res.totalCount);
      } catch (err) {
        console.error('Failed to query directory:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedCountry, selectedCategory]);

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

  async function handleDismissPymk(profileId: string) {
    setActiveMenuId(null);
    setPymk((prev) => prev.filter((p) => p.id !== profileId));
    try {
      await dismissRecommendationAction('profile', profileId, 'not_interested');
    } catch {
      // ignore
    }
  }

  async function handleBlock(userId: string) {
    setActiveMenuId(null);
    setMembers((prev) => prev.filter((p) => p.id !== userId));
    setPymk((prev) => prev.filter((p) => p.id !== userId));
    try {
      await blockUserAction(userId);
    } catch {
      // ignore
    }
  }

  const territoryOptions = [
    { iso: 'ALL', name: 'All Territories 🌴' },
    ...CARIBBEAN_TERRITORIES.map((t) => ({ iso: t.iso, name: `${t.flag} ${t.name}` })),
  ];

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. PEOPLE YOU MAY KNOW CAROUSEL / HIGHLIGHT STRIP         */}
      {/* ────────────────────────────────────────────────────────── */}
      {pymk.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Recommended Connections
            </h3>
            <Link
              href="/friends?tab=pymk"
              className="text-[11px] font-bold text-brand-goldenHour hover:underline"
            >
              View all suggestions
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pymk.slice(0, 3).map((person) => {
              const fStatus = friendshipStatusMap[person.id] || person.relationship?.friendshipStatus || 'none';
              const isFollowing = !!followingMap[person.id];
              const isSelf = currentUserId === person.id;

              return (
                <div
                  key={person.id}
                  className="glass rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-brand-caribbeanSea/30 transition-all group"
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
                      <h4 className="text-xs font-extrabold text-brand-sandstone truncate group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1">
                        {person.display_name}
                        {person.is_verified && (
                          <Check className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                        )}
                      </h4>
                      <p className="text-[10px] text-brand-sandstone/60 truncate">@{person.username}</p>
                      {person.recommendationReason && (
                        <span className="text-[10px] font-bold text-brand-caribbeanSea block mt-0.5 truncate">
                          {person.recommendationReason}
                        </span>
                      )}
                    </div>
                  </Link>

                  {!isSelf && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {fStatus === 'accepted' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-brand-dusk text-brand-caribbeanSea border border-brand-caribbeanSea/30 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Friends
                        </span>
                      ) : fStatus === 'pending_sent' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-brand-dusk text-slate-400 border border-slate-700">
                          Sent
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={pendingActionId === person.id}
                          onClick={() => handleSendFriendRequest(person.id)}
                          className="text-[10px] font-bold px-3 py-1 rounded-xl bg-brand-caribbeanSea hover:bg-emerald-400 text-slate-950 shadow-sm"
                        >
                          + Friend
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(person.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl ${
                          isFollowing
                            ? 'bg-brand-dusk text-slate-300 border border-slate-700'
                            : 'bg-brand-sunriseCoral text-slate-950'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. SEARCH & FILTER CONTROLS                               */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Main Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-brand-caribbeanSea pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members by name, handle, profession..."
              className="w-full bg-brand-twilight/90 border border-slate-700/80 hover:border-brand-caribbeanSea/60 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-brand-sandstone placeholder-brand-sandstone/50 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/30 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-3 text-brand-sandstone/40 hover:text-brand-sandstone"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Territory Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              aria-label="Filter members by Caribbean territory"
              className="w-full bg-brand-twilight/90 border border-slate-700/80 rounded-2xl px-3 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-all"
            >
              {territoryOptions.map((t) => (
                <option key={t.iso} value={t.iso} className="bg-brand-dusk text-brand-sandstone">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter members by category"
              className="w-full bg-brand-twilight/90 border border-slate-700/80 rounded-2xl px-3 py-2.5 text-xs text-brand-sandstone focus:outline-none focus:border-brand-caribbeanSea transition-all"
            >
              <option value="all" className="bg-brand-dusk text-brand-sandstone">All Members</option>
              <option value="creator" className="bg-brand-dusk text-brand-sandstone">Creators & Artists 🎨</option>
              <option value="business" className="bg-brand-dusk text-brand-sandstone">Business Accounts 🏢</option>
              <option value="official" className="bg-brand-dusk text-brand-sandstone">Official Accounts ✨</option>
            </select>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-brand-sandstone/60 pt-2 border-t border-slate-800/80">
          <span>Showing {members.length} {members.length === 1 ? 'member' : 'members'} (Total {totalCount})</span>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-brand-caribbeanSea font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
            </span>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. MEMBERS DIRECTORY GRID                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {members.length === 0 && !isLoading ? (
        <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3 max-w-md mx-auto">
          <Users className="w-12 h-12 text-brand-sandstone/40 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No members found</h3>
          <p className="text-xs text-brand-sandstone/50">
            {query
              ? `No members match "${query}". Try a different name, island, or reset the filters.`
              : 'No members available in this territory filter.'}
          </p>
          {(query || selectedCountry !== 'ALL' || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCountry('ALL');
                setSelectedCategory('all');
              }}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-brand-caribbeanSea text-slate-950"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const fStatus = friendshipStatusMap[member.id] || member.relationship?.friendshipStatus || 'none';
            const isFollowing = !!followingMap[member.id];
            const isSelf = currentUserId === member.id;

            return (
              <div
                key={member.id}
                className="glass rounded-2xl p-5 flex flex-col justify-between space-y-3.5 hover:border-brand-caribbeanSea/40 transition-all group relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/profile/${member.username}`}
                    className="flex items-center gap-3.5 min-w-0 flex-1"
                  >
                    <UserAvatar
                      src={member.avatar_url}
                      name={member.display_name}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-brand-sandstone truncate group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1.5">
                        {member.display_name}
                        {member.is_official ? (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-brand-caribbeanSea/20 text-[#38BDF8] border border-[#0EA5E9]/40">
                            OFFICIAL
                          </span>
                        ) : member.is_verified ? (
                          <Check className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                        ) : null}
                      </h4>
                      <p className="text-xs text-brand-sandstone/60 truncate">@{member.username}</p>
                      {member.country_name && (
                        <span className="text-[11px] text-brand-sunriseCoral font-medium flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3 h-3" /> {member.country_name}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Overflow menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                      className="p-1.5 rounded-lg text-brand-sandstone/50 hover:text-brand-sandstone hover:bg-slate-800 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === member.id && (
                      <div className="absolute right-0 top-8 w-44 bg-brand-dusk border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleBlock(member.id)}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 font-semibold flex items-center gap-2"
                        >
                          <Shield className="w-3.5 h-3.5" /> Block Member
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {member.bio && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {member.bio}
                  </p>
                )}

                {!isSelf && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    {/* Add Friend / Status Button */}
                    {fStatus === 'accepted' ? (
                      <span className="flex-1 text-center text-[11px] font-bold py-1.5 rounded-xl bg-brand-dusk text-brand-caribbeanSea border border-brand-caribbeanSea/30 flex items-center justify-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Friends
                      </span>
                    ) : fStatus === 'pending_sent' ? (
                      <span className="flex-1 text-center text-[11px] font-bold py-1.5 rounded-xl bg-brand-dusk text-slate-400 border border-slate-700">
                        Request Sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={pendingActionId === member.id}
                        onClick={() => handleSendFriendRequest(member.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold py-1.5 rounded-xl bg-brand-caribbeanSea hover:bg-emerald-400 text-slate-950 transition-all shadow-sm"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add Friend
                      </button>
                    )}

                    {/* Follow Toggle Button */}
                    <button
                      type="button"
                      disabled={pendingActionId === member.id}
                      onClick={() => handleToggleFollow(member.id)}
                      className={`text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-all ${
                        isFollowing
                          ? 'bg-brand-dusk text-slate-300 border border-slate-700 hover:bg-rose-500/20 hover:text-rose-400'
                          : 'bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-sunriseCoral/20'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
