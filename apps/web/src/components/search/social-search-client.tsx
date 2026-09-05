'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  Building2,
  ShoppingBag,
  Users,
  Calendar,
  FileText,
  Sparkles,
  Check,
  UserPlus,
  UserCheck,
  Clock,
  X,
  Loader2,
  MapPin,
  MoreVertical,
  Shield,
  EyeOff,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import UserAvatar from '../user-avatar';
import {
  followUserAction,
  unfollowUserAction,
  sendFriendRequestAction,
  blockUserAction,
  dismissRecommendationAction,
} from '../../lib/social/relationship-actions';
import {
  universalSearchAction,
  type DiscoverProfile,
  type DiscoverBusiness,
  type DiscoverCommunity,
  type DiscoverEvent,
  type DiscoverProduct,
  type DiscoverPost,
} from '../../lib/discovery/actions';
import { type UniversalSearchResults } from '@caribbean/search';

interface SocialSearchClientProps {
  initialQuery: string;
  initialCategory: string;
  initialSearchData: (UniversalSearchResults & {
    profilesData: DiscoverProfile[];
    businessesData: DiscoverBusiness[];
    communitiesData: DiscoverCommunity[];
    eventsData: DiscoverEvent[];
    productsData: DiscoverProduct[];
    postsData: DiscoverPost[];
  }) | null;
  initialRecommendations: DiscoverProfile[];
  currentUserId?: string;
}

export default function SocialSearchClient({
  initialQuery,
  initialCategory,
  initialSearchData,
  initialRecommendations,
  currentUserId,
}: SocialSearchClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<string>(initialCategory || 'all');
  const [searchData, setSearchData] = useState(initialSearchData);
  const [recommendations, setRecommendations] = useState<DiscoverProfile[]>(initialRecommendations);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (initialSearchData) {
      initialSearchData.profilesData.forEach((p: DiscoverProfile) => {
        if (p.relationship?.isFollowing) map[p.id] = true;
      });
    }
    initialRecommendations.forEach((p: DiscoverProfile) => {
      if (p.relationship?.isFollowing) map[p.id] = true;
    });
    return map;
  });

  const [friendshipStatusMap, setFriendshipStatusMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (initialSearchData) {
      initialSearchData.profilesData.forEach((p: DiscoverProfile) => {
        if (p.relationship?.friendshipStatus) map[p.id] = p.relationship.friendshipStatus;
      });
    }
    initialRecommendations.forEach((p: DiscoverProfile) => {
      if (p.relationship?.friendshipStatus) map[p.id] = p.relationship.friendshipStatus;
    });
    return map;
  });

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Debounced live search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchData(null);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await universalSearchAction({
          term: trimmed,
          category: activeTab === 'all' ? undefined : activeTab,
          limit: 30,
        });
        setSearchData(res);
      } catch (err: any) {
        console.error('Search query error:', err);
        setErrorMessage("We couldn't complete your search. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&category=${activeTab}`);
    }
  };

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

  async function handleDismissRecommendation(profileId: string) {
    setActiveMenuId(null);
    setRecommendations((prev) => prev.filter((p: DiscoverProfile) => p.id !== profileId));
    try {
      await dismissRecommendationAction('profile', profileId, 'not_interested');
    } catch {
      // ignore
    }
  }

  async function handleBlock(userId: string) {
    setActiveMenuId(null);
    if (searchData) {
      setSearchData({
        ...searchData,
        profilesData: searchData.profilesData.filter((p: DiscoverProfile) => p.id !== userId),
      });
    }
    setRecommendations((prev) => prev.filter((p: DiscoverProfile) => p.id !== userId));
    try {
      await blockUserAction(userId);
    } catch {
      // ignore
    }
  }

  const profiles = searchData?.profilesData || [];
  const businesses = searchData?.businessesData || [];
  const communities = searchData?.communitiesData || [];
  const events = searchData?.eventsData || [];
  const products = searchData?.productsData || [];
  const posts = searchData?.postsData || [];

  const creators = profiles.filter((p: DiscoverProfile) => p.account_type === 'creator');
  const peopleMembers = profiles.filter((p: DiscoverProfile) => p.account_type !== 'creator');

  const totalHits =
    profiles.length +
    businesses.length +
    communities.length +
    events.length +
    products.length +
    posts.length;

  const hasResults = totalHits > 0;

  const entityTabs = [
    { id: 'all', label: 'All Results', count: totalHits },
    { id: 'people', label: 'People & Members', count: peopleMembers.length, icon: <User className="w-3.5 h-3.5" /> },
    { id: 'creators', label: 'Creators', count: creators.length, icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'businesses', label: 'Businesses', count: businesses.length, icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'products', label: 'Merchants & Stores', count: products.length, icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: 'communities', label: 'Communities / Hubs', count: communities.length, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'events', label: 'Events', count: events.length, icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'posts', label: 'Posts', count: posts.length, icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. SEARCH INPUT BAR                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-brand-caribbeanSea pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, @usernames, Caribbean businesses, merchants, events, hubs..."
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
      </form>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. CATEGORIZED TABS                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none" role="tablist">
        {entityTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 whitespace-nowrap text-xs sm:text-sm font-bold transition-all relative px-2.5 flex items-center gap-1.5 ${
                isActive ? 'text-brand-caribbeanSea' : 'text-brand-sandstone/60 hover:text-slate-200'
              }`}
            >
              {tab.icon}
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
          <span>Searching TUKUBI universal index...</span>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-center space-y-2">
          <p className="text-xs text-rose-300 font-semibold">{errorMessage}</p>
          <button
            type="button"
            onClick={() => setQuery(query)}
            className="text-xs font-bold px-3 py-1 rounded-xl bg-brand-dusk text-brand-sandstone border border-slate-700 hover:bg-slate-800"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. EMPTY QUERY: RECOMMENDED FOR YOU CAROUSEL / GRID        */}
      {/* ────────────────────────────────────────────────────────── */}
      {!query.trim() && !isLoading && (
        <div className="space-y-6">
          <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-caribbeanSea/10 text-brand-caribbeanSea border border-brand-caribbeanSea/30 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">Universal Caribbean Search</h3>
            <p className="text-xs text-brand-sandstone/60 max-w-md mx-auto leading-relaxed">
              Search by full name, @username, business, merchant store, cultural event, diaspora hub, or trending topic.
            </p>
          </div>

          {/* Recommended Caribbean Members Strip */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Recommended For You
                </h3>
                <Link
                  href="/members"
                  className="text-[11px] font-bold text-brand-caribbeanSea hover:underline"
                >
                  Explore All Members
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.map((person: DiscoverProfile) => {
                  const fStatus = friendshipStatusMap[person.id] || person.relationship?.friendshipStatus || 'none';
                  const isFollowing = !!followingMap[person.id];
                  const isSelf = currentUserId === person.id;

                  return (
                    <div
                      key={person.id}
                      className="glass rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-brand-caribbeanSea/30 transition-all group relative"
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
                            <p className="text-[10px] text-brand-sandstone/60 truncate">@{person.username}</p>
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
                            className="p-1 text-brand-sandstone/40 hover:text-brand-sandstone"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === person.id && (
                            <div className="absolute right-0 top-7 w-40 bg-brand-dusk border border-slate-700 rounded-xl p-1 shadow-2xl z-30 space-y-1 text-xs">
                              <button
                                type="button"
                                onClick={() => handleDismissRecommendation(person.id)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-brand-sandstone/80 flex items-center gap-2"
                              >
                                <EyeOff className="w-3.5 h-3.5" /> Not interested
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBlock(person.id)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 flex items-center gap-2"
                              >
                                <Shield className="w-3.5 h-3.5" /> Block
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {!isSelf && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          {fStatus === 'accepted' ? (
                            <span className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-xl bg-brand-dusk text-brand-caribbeanSea border border-brand-caribbeanSea/30 flex items-center justify-center gap-1">
                              <UserCheck className="w-3 h-3" /> Friends
                            </span>
                          ) : fStatus === 'pending_sent' ? (
                            <span className="flex-1 text-center text-[10px] font-bold py-1.5 rounded-xl bg-brand-dusk text-slate-400 border border-slate-700">
                              Sent
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={pendingActionId === person.id}
                              onClick={() => handleSendFriendRequest(person.id)}
                              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-xl bg-brand-caribbeanSea text-slate-950 hover:bg-emerald-400"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Add Friend
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={pendingActionId === person.id}
                            onClick={() => handleToggleFollow(person.id)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl ${
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
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. NO RESULTS STATE WITH CROSS-CATEGORY SUGGESTIONS        */}
      {/* ────────────────────────────────────────────────────────── */}
      {query.trim() && !isLoading && !hasResults && (
        <div className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto">
          <Search className="w-10 h-10 text-brand-sandstone/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">No results found for &quot;{query}&quot;</h3>
            <p className="text-xs text-brand-sandstone/60">
              Check your spelling or try searching across different categories.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link
              href="/members"
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700"
            >
              Browse Members
            </Link>
            <Link
              href="/communities"
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700"
            >
              Diaspora Hubs
            </Link>
            <Link
              href="/marketplace"
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700"
            >
              Marketplace
            </Link>
            <Link
              href="/events"
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700"
            >
              Cultural Events
            </Link>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. CATEGORIZED SEARCH RESULTS                              */}
      {/* ────────────────────────────────────────────────────────── */}
      {query.trim() && !isLoading && hasResults && (
        <div className="space-y-8">
          {/* 5A. PEOPLE & MEMBERS SECTION */}
          {(activeTab === 'all' || activeTab === 'people') && peopleMembers.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> People & Members ({peopleMembers.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {peopleMembers.map((person: DiscoverProfile) => {
                  const fStatus = friendshipStatusMap[person.id] || person.relationship?.friendshipStatus || 'none';
                  const isFollowing = !!followingMap[person.id];
                  const isSelf = currentUserId === person.id;

                  return (
                    <div
                      key={person.id}
                      className="glass rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-brand-caribbeanSea/40 transition-all group relative"
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
                          <h4 className="text-xs sm:text-sm font-extrabold text-brand-sandstone truncate group-hover:text-brand-caribbeanSea transition-colors flex items-center gap-1.5">
                            {person.display_name}
                            {person.is_verified && (
                              <Check className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                            )}
                          </h4>
                          <p className="text-[11px] text-brand-sandstone/60 truncate">@{person.username}</p>
                          {person.country_name && (
                            <span className="text-[10px] text-brand-sunriseCoral flex items-center gap-0.5 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" /> {person.country_name}
                            </span>
                          )}
                        </div>
                      </Link>

                      {!isSelf && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {fStatus === 'accepted' ? (
                            <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-brand-dusk text-brand-caribbeanSea border border-brand-caribbeanSea/30">
                              Friends
                            </span>
                          ) : fStatus === 'pending_sent' ? (
                            <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-brand-dusk text-slate-400 border border-slate-700">
                              Sent
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={pendingActionId === person.id}
                              onClick={() => handleSendFriendRequest(person.id)}
                              className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-brand-caribbeanSea text-slate-950 hover:bg-emerald-400"
                            >
                              + Friend
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={pendingActionId === person.id}
                            onClick={() => handleToggleFollow(person.id)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl ${
                              isFollowing
                                ? 'bg-brand-dusk text-slate-300 border border-slate-700 hover:bg-rose-500/20 hover:text-rose-400'
                                : 'bg-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-sunriseCoral/20'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>

                          {/* Message Button */}
                          <Link
                            href={`/messages?u=${encodeURIComponent(person.username)}`}
                            className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-brand-dusk text-brand-sandstone border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3 text-brand-caribbeanSea" /> Msg
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5B. CREATORS SECTION */}
          {(activeTab === 'all' || activeTab === 'creators') && creators.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Caribbean Creators ({creators.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {creators.map((creator: DiscoverProfile) => {
                  const isFollowing = !!followingMap[creator.id];
                  const isSelf = currentUserId === creator.id;

                  return (
                    <div
                      key={creator.id}
                      className="glass rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-brand-goldenHour/40 transition-all group"
                    >
                      <Link
                        href={`/profile/${creator.username}`}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <UserAvatar
                          src={creator.avatar_url}
                          name={creator.display_name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-extrabold text-brand-sandstone truncate group-hover:text-brand-goldenHour transition-colors flex items-center gap-1.5">
                            {creator.display_name}
                            <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour shrink-0" />
                          </h4>
                          <p className="text-[11px] text-brand-sandstone/60 truncate">@{creator.username}</p>
                          {creator.bio && (
                            <p className="text-[10px] text-brand-sandstone/70 line-clamp-1 mt-0.5">{creator.bio}</p>
                          )}
                        </div>
                      </Link>

                      {!isSelf && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            href={`/messages?u=${encodeURIComponent(creator.username)}`}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-brand-dusk text-brand-sandstone border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Msg
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleFollow(creator.id)}
                            className={`text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-all ${
                              isFollowing
                                ? 'bg-brand-dusk text-slate-300 border border-slate-700'
                                : 'bg-brand-goldenHour text-slate-950 shadow-md shadow-brand-goldenHour/20'
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

          {/* 5C. BUSINESSES SECTION */}
          {(activeTab === 'all' || activeTab === 'businesses') && businesses.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Caribbean Businesses ({businesses.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {businesses.map((biz: DiscoverBusiness) => (
                  <div
                    key={biz.id}
                    className="glass rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-brand-sunriseCoral/40 transition-all group"
                  >
                    <Link
                      href={`/pages/${biz.slug}`}
                      className="flex items-center gap-3.5 min-w-0 flex-1"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-brand-twilight border border-slate-700 flex items-center justify-center text-lg shrink-0">
                        🏢
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-brand-sandstone truncate group-hover:text-brand-sunriseCoral transition-colors flex items-center gap-1.5">
                          {biz.name}
                          {biz.is_verified && (
                            <Check className="w-3.5 h-3.5 text-brand-sunriseCoral shrink-0" />
                          )}
                        </h4>
                        <p className="text-[11px] text-brand-sandstone/60 truncate">{biz.category}</p>
                        {biz.description && (
                          <p className="text-[10px] text-brand-sandstone/70 line-clamp-1 mt-0.5">{biz.description}</p>
                        )}
                      </div>
                    </Link>

                    <Link
                      href={`/pages/${biz.slug}`}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-brand-dusk hover:bg-slate-800 text-brand-sandstone border border-slate-700 transition-colors"
                    >
                      Visit
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5D. MERCHANTS & STORE PRODUCTS */}
          {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> Marketplace & Stores ({products.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((prod: DiscoverProduct) => (
                  <Link
                    key={prod.id}
                    href={`/marketplace/${prod.id}`}
                    className="glass rounded-2xl p-4 flex flex-col justify-between space-y-2 hover:border-orange-500/40 transition-all group"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-brand-sandstone group-hover:text-orange-300 truncate">
                        {prod.title}
                      </h4>
                      {prod.description && (
                        <p className="text-[11px] text-brand-sandstone/60 line-clamp-2 mt-1">{prod.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-xs font-extrabold text-brand-sunriseCoral">
                        ${(prod.price_minor / 100).toFixed(2)} {prod.currency}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-brand-sandstone/50">{prod.product_kind}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 5E. COMMUNITIES / DIASPORA HUBS */}
          {(activeTab === 'all' || activeTab === 'communities') && communities.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Diaspora Hubs ({communities.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {communities.map((comm: DiscoverCommunity) => (
                  <Link
                    key={comm.id}
                    href={`/communities/${comm.slug}`}
                    className="glass rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-all group"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-brand-sandstone group-hover:text-cyan-300 truncate">
                        {comm.name}
                      </h4>
                      <p className="text-[11px] text-brand-sandstone/60 line-clamp-1 mt-0.5">
                        {comm.description || 'Caribbean diaspora community hub.'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-brand-dusk text-cyan-400 border border-slate-800 shrink-0">
                      {comm.member_count} members
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 5F. EVENTS */}
          {(activeTab === 'all' || activeTab === 'events') && events.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Cultural Events ({events.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {events.map((evt: DiscoverEvent) => (
                  <Link
                    key={evt.id}
                    href={`/events/${evt.id}`}
                    className="glass rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-yellow-500/40 transition-all group"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-brand-sandstone group-hover:text-yellow-300 truncate">
                        {evt.title}
                      </h4>
                      <p className="text-[11px] text-brand-sandstone/60 truncate mt-0.5">
                        {evt.venue || evt.city_name || 'Caribbean'} • {new Date(evt.starts_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-brand-dusk text-yellow-400 border border-slate-800 shrink-0">
                      {evt.event_kind}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 5G. POSTS */}
          {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Posts ({posts.length})
                </h3>
              </div>

              <div className="space-y-3">
                {posts.map((post: DiscoverPost) => (
                  <article
                    key={post.id}
                    className="glass rounded-2xl p-4 hover:border-purple-500/30 transition-colors space-y-2.5"
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
                          <p className="text-xs font-bold text-brand-sandstone group-hover:text-purple-300">
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
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
