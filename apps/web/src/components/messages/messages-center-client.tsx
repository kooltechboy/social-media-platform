'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';
import {
  MessageSquare,
  Users,
  Plus,
  Search,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Radio,
  Compass,
  X,
  MessageCircle,
  Clock,
  UserCheck,
  UserX,
  ShieldAlert,
  Archive,
  Inbox,
  Store,
  Briefcase,
  Bot,
  Filter,
  CheckCircle2,
  Trash2,
  MoreVertical,
  ChevronDown,
  Loader2,
  BadgeCheck,
  PanelRightClose,
  PanelRightOpen,
  UserPlus,
} from 'lucide-react';
import MessageThread, { type ThreadMessage } from '../message-thread';
import NewMessageModal, { type NewMessageMember } from './new-message-modal';
import ConversationDetailsPanel from './conversation-details-panel';
import UserAvatar from '../user-avatar';
import {
  handleMessageRequestAction,
  getOrCreateDirectConversationAction,
  markConversationReadAction,
} from '../../lib/messaging/actions';
import { Button } from '@caribbean/ui';

export interface ConversationSummary {
  id: string;
  kind: 'direct' | 'group';
  category?: 'personal' | 'business' | 'marketplace' | 'creator' | 'event' | 'community' | 'support';
  title: string | null;
  last_message_at: string | null;
  displayName: string;
  partnerId?: string | null;
  partnerUsername?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
  preview: string;
  unreadCount?: number;
  status?: 'active' | 'pending_request' | 'archived' | 'rejected' | 'blocked';
}

export interface PendingRequest {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar?: string | null;
  createdAt: string;
}

interface MessagesCenterClientProps {
  conversations: ConversationSummary[];
  selectedId: string | null;
  threadMessages: ThreadMessage[];
  currentUserId: string;
  friends?: NewMessageMember[];
  onlineMembers?: NewMessageMember[];
  pendingRequests?: PendingRequest[];
  initialCompose?: boolean;
  conversationError?: string | null;
  initialPeerProfile?: { id: string; displayName: string; username: string; avatarUrl: string | null } | null;
}

export default function MessagesCenterClient({
  conversations,
  selectedId,
  threadMessages,
  currentUserId,
  friends,
  onlineMembers,
  pendingRequests = [],
  initialCompose = false,
  conversationError = null,
  initialPeerProfile = null,
}: MessagesCenterClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'group' | 'business' | 'marketplace' | 'requests' | 'archived'>('all');
  const [isComposeOpen, setIsComposeOpen] = useState(initialCompose);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>(selectedId ? 'thread' : 'list');
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);
  const [startingChatWithId, setStartingChatWithId] = useState<string | null>(null);

  // Authenticated real-time presence tracking
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Use provided friends list or fallback to onlineMembers if friends not passed
  const rawFriendsList = useMemo(() => {
    return friends && friends.length > 0 ? friends : (onlineMembers || []);
  }, [friends, onlineMembers]);

  // People search state (searching registered users in real time)
  const [searchedPeople, setSearchedPeople] = useState<NewMessageMember[]>([]);
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);

  // Friends search in welcome hub
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const [showOfflineFriends, setShowOfflineFriends] = useState(false);

  // Local state to hold conversations and requests so we can update them in real-time
  const [localConversations, setLocalConversations] = useState<ConversationSummary[]>(conversations);
  const [localPendingRequests, setLocalPendingRequests] = useState<PendingRequest[]>(pendingRequests);

  // Sync with props if they change
  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    setLocalPendingRequests(pendingRequests);
  }, [pendingRequests]);

  useEffect(() => {
    if (selectedId) {
      setMobileView('thread');
      // Mark read in local state
      setLocalConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c))
      );
      void markConversationReadAction(selectedId);
    }
  }, [selectedId]);

  // 1. Authoritative Supabase Realtime Presence Channel
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || !currentUserId) return;

    const presenceChannel = supabase.channel('tukubi:presence', {
      config: { presence: { key: currentUserId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.userId) onlineIds.add(p.userId);
          });
        });
        setOnlineUserIds(onlineIds);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED' && currentUserId) {
          await presenceChannel.track({
            userId: currentUserId,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUserId]);

  // Derive friends with live presence states
  const friendsWithPresence = useMemo(() => {
    return rawFriendsList.map((f) => ({
      ...f,
      isOnline: onlineUserIds.has(f.id),
      isFriend: true,
    }));
  }, [rawFriendsList, onlineUserIds]);

  const onlineFriends = useMemo(() => {
    return friendsWithPresence.filter((f) => f.isOnline);
  }, [friendsWithPresence]);

  const offlineFriends = useMemo(() => {
    return friendsWithPresence.filter((f) => !f.isOnline);
  }, [friendsWithPresence]);

  // Realtime search for people from `profiles`
  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setSearchedPeople([]);
      setIsSearchingPeople(false);
      return;
    }

    setIsSearchingPeople(true);
    const timer = setTimeout(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;

        const clean = query.replace(/^@/, '');
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, is_verified, bio')
          .or(`display_name.ilike.%${clean}%,username.ilike.%${clean}%`)
          .neq('id', currentUserId)
          .limit(8);

        if (!error && data) {
          setSearchedPeople(
            data.map((p) => ({
              id: p.id,
              name: p.display_name || p.username || 'Caribbean Member',
              username: p.username || p.id.slice(0, 8),
              avatarUrl: p.avatar_url,
              isVerified: !!p.is_verified,
              isOnline: onlineUserIds.has(p.id),
              bio: p.bio,
            }))
          );
        }
      } catch (err) {
        console.error('[MessagesCenterClient] People search error:', err);
      } finally {
        setIsSearchingPeople(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, currentUserId, onlineUserIds]);

  // Realtime subscriptions for conversation members, requests, and notifications
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    // 1. Subscribe to conversation_members changes
    const convMembersChannel = supabase
      .channel(`public:conversation_members:profile_id=eq.${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          filter: `profile_id=eq.${currentUserId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    // 2. Subscribe to message_requests
    const msgRequestsChannel = supabase
      .channel(`public:message_requests:receiver_id=eq.${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_requests',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    // 3. Subscribe to real-time message notifications for the current user
    const messageNotifsChannel = supabase
      .channel(`user_messages_notifs:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (newNotif?.kind !== 'message') return;
          // Never increment unread count if the current user sent the message
          if (newNotif.actor_id === currentUserId) return;

          const convId = newNotif.payload?.conversation_id || newNotif.entity_id;
          if (!convId) return;

          setLocalConversations((prev) => {
            const exists = prev.find((c) => c.id === convId);
            if (!exists) {
              router.refresh();
              return prev;
            }
            return prev
              .map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      unreadCount: c.id === selectedId ? 0 : (c.unreadCount || 0) + 1,
                      preview: newNotif.payload?.preview || 'New message',
                      last_message_at: newNotif.created_at,
                    }
                  : c
              )
              .sort((a, b) => {
                const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return timeB - timeA;
              });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convMembersChannel);
      supabase.removeChannel(msgRequestsChannel);
      supabase.removeChannel(messageNotifsChannel);
    };
  }, [currentUserId, router, selectedId]);

  // Open direct chat with selected friend or person
  const handleStartChatWithUser = async (person: NewMessageMember) => {
    setStartingChatWithId(person.id);
    try {
      const res = await getOrCreateDirectConversationAction(person.id);
      if (res.conversationId) {
        setSearch('');
        // Eagerly clear unread
        setLocalConversations((prev) =>
          prev.map((c) => (c.id === res.conversationId ? { ...c, unreadCount: 0 } : c))
        );
        router.push(`/messages?c=${res.conversationId}`);
        setMobileView('thread');
      } else {
        router.push(`/messages?u=${encodeURIComponent(person.username)}`);
        setMobileView('thread');
      }
    } catch {
      router.push(`/messages?u=${encodeURIComponent(person.username)}`);
      setMobileView('thread');
    } finally {
      setStartingChatWithId(null);
    }
  };

  // Called when current user successfully sends a message
  const handleMessageSent = useCallback((convId: string, previewText: string) => {
    setLocalConversations((prev) =>
      prev
        .map((c) =>
          c.id === convId
            ? {
                ...c,
                preview: `You: ${previewText}`,
                unreadCount: 0,
                last_message_at: new Date().toISOString(),
              }
            : c
        )
        .sort((a, b) => {
          const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return timeB - timeA;
        })
    );
  }, []);

  async function handleRequestResponse(convId: string, action: 'accept' | 'decline' | 'block') {
    setRequestActionLoading(convId);
    try {
      await handleMessageRequestAction(convId, action);
      router.refresh();
    } finally {
      setRequestActionLoading(null);
    }
  }

  // Filter conversations with real-time online presence integration
  const filteredConversations = useMemo(() => {
    let list = localConversations.map((c) => ({
      ...c,
      isOnline: c.partnerId ? onlineUserIds.has(c.partnerId) : false,
    }));

    if (filter === 'direct') {
      list = list.filter((c) => c.kind === 'direct' && c.status !== 'archived');
    } else if (filter === 'group') {
      list = list.filter((c) => c.kind === 'group' && c.status !== 'archived');
    } else if (filter === 'business') {
      list = list.filter((c) => (c.category === 'business' || c.category === 'support') && c.status !== 'archived');
    } else if (filter === 'marketplace') {
      list = list.filter((c) => c.category === 'marketplace' && c.status !== 'archived');
    } else if (filter === 'archived') {
      list = list.filter((c) => c.status === 'archived');
    } else if (filter === 'all') {
      list = list.filter((c) => c.status !== 'archived' && c.status !== 'pending_request');
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q)
      );
    }
    return list;
  }, [localConversations, filter, search, onlineUserIds]);

  const activeConversation = useMemo(
    () => localConversations.find((c) => c.id === selectedId),
    [localConversations, selectedId]
  );

  const totalUnreadCount = useMemo(() => {
    return localConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [localConversations]);

  function formatConversationTime(timestamp: string | null) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const resolvedPeerName =
    activeConversation?.displayName ||
    initialPeerProfile?.displayName ||
    'Caribbean Member';

  const resolvedPeerAvatar =
    activeConversation?.avatarUrl ||
    initialPeerProfile?.avatarUrl ||
    null;

  const partnerIsOnline = activeConversation?.partnerId
    ? onlineUserIds.has(activeConversation.partnerId)
    : false;

  // Filter friends in Welcome Hub
  const filteredFriendsInHub = useMemo(() => {
    const q = friendsSearchQuery.toLowerCase().trim();
    if (!q) return friendsWithPresence;
    return friendsWithPresence.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q)
    );
  }, [friendsWithPresence, friendsSearchQuery]);

  return (
    <div className="h-full w-full flex bg-[#0A0612] text-white overflow-hidden relative">
      {/* ========================================================================= */}
      {/* COLUMN 1: Inbox & Navigation (Left Sidebar)                               */}
      {/* ========================================================================= */}
      <aside
        className={`w-full md:w-80 lg:w-84 xl:w-96 flex-shrink-0 flex flex-col h-full border-r border-white/10 bg-[#0D0816]/95 z-10 ${
          mobileView === 'thread' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-brand-caribbeanSea" /> Chats
            </h2>
            {totalUnreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-sunriseCoral text-slate-950 text-[10px] font-black animate-pulse">
                {totalUnreadCount}
              </span>
            )}
          </div>

          <button
            onClick={() => setIsComposeOpen(true)}
            aria-label="Start new chat"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:opacity-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-brand-caribbeanSea/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Error Notice */}
        {conversationError && (
          <div className="mx-4 mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{conversationError}</span>
          </div>
        )}

        {/* Search Input */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people or conversations…"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-caribbeanSea/60 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Online Friends Story Bar (Authentic Live Presence) */}
        {!search && (
          <div className="px-4 py-2.5 border-b border-white/5 flex-shrink-0 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className={`w-3 h-3 ${onlineFriends.length > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>Online now ({onlineFriends.length})</span>
              </span>
              <Link href="/friends" className="text-[10px] font-bold text-brand-caribbeanSea hover:underline">
                Friends
              </Link>
            </div>

            {onlineFriends.length > 0 ? (
              <div className="flex items-center gap-3 overflow-x-auto pb-1.5 no-scrollbar">
                {onlineFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => handleStartChatWithUser(friend)}
                    className="flex flex-col items-center gap-1 min-w-[52px] group cursor-pointer focus:outline-none"
                    title={`Start chat with ${friend.name}`}
                  >
                    <div className="relative">
                      <UserAvatar name={friend.name} avatarUrl={friend.avatarUrl} size="md" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0D0816]" />
                    </div>
                    <span className="text-[10px] text-slate-300 font-bold group-hover:text-brand-caribbeanSea truncate max-w-[52px]">
                      {friend.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-1 text-[11px] text-slate-400 flex items-center justify-between">
                <span>No members currently online</span>
                <Link href="/friends" className="text-brand-caribbeanSea font-bold hover:underline">
                  Find Caribbean friends to message →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        {!search && (
          <div className="px-4 py-2 flex items-center gap-1.5 border-b border-white/5 overflow-x-auto no-scrollbar flex-shrink-0">
            {(['all', 'direct', 'group', 'business', 'marketplace', 'requests', 'archived'] as const).map((tab) => {
              const isActive = filter === tab;
              const requestCount = tab === 'requests' ? localPendingRequests.length : 0;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{tab}</span>
                  {requestCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                      {requestCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Conversation List / Search Results */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
          {search.trim() ? (
            /* Search View */
            <div className="divide-y divide-white/5">
              {/* People Search Results */}
              <div className="p-2 space-y-1">
                <div className="px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-1">
                    <Users className="w-3 h-3" /> People
                  </span>
                  {isSearchingPeople && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
                </div>

                {searchedPeople.length === 0 && !isSearchingPeople ? (
                  <p className="px-3 py-2 text-xs text-slate-500">No members match &quot;{search}&quot;</p>
                ) : (
                  searchedPeople.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handleStartChatWithUser(person)}
                      disabled={startingChatWithId === person.id}
                      className="w-full p-2.5 rounded-2xl hover:bg-white/[0.06] text-left flex items-center gap-3 transition-all cursor-pointer group"
                    >
                      <div className="relative flex-shrink-0">
                        <UserAvatar name={person.name} avatarUrl={person.avatarUrl} size="sm" />
                        {person.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0D0816]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-brand-caribbeanSea transition-colors">
                            {person.name}
                          </h4>
                          {person.isVerified && <BadgeCheck className="w-3 h-3 text-brand-caribbeanSea shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">@{person.username}</p>
                      </div>
                      {startingChatWithId === person.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-brand-caribbeanSea animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Matched Conversations */}
              <div className="p-2 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Existing Conversations
                </div>
                {filteredConversations.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">No matching conversations</p>
                ) : (
                  filteredConversations.map((c) => {
                    const isSelected = c.id === selectedId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setLocalConversations((prev) =>
                            prev.map((item) => (item.id === c.id ? { ...item, unreadCount: 0 } : item))
                          );
                          void markConversationReadAction(c.id);
                          router.push(`/messages?c=${c.id}`);
                          setMobileView('thread');
                        }}
                        className={`w-full p-2.5 rounded-2xl text-left flex items-start gap-3 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-gradient-to-r from-brand-caribbeanSea/15 via-white/[0.05] to-transparent border-l-2 border-brand-caribbeanSea'
                            : 'hover:bg-white/[0.04]'
                        }`}
                      >
                        <UserAvatar name={c.displayName} avatarUrl={c.avatarUrl} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="text-xs font-bold text-white truncate">{c.displayName}</h3>
                            <span className="text-[10px] text-slate-400">{formatConversationTime(c.last_message_at)}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 truncate">{c.preview}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : filter === 'requests' ? (
            /* Message Requests View */
            localPendingRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <UserCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">No Pending Requests</p>
                <p className="text-[11px] text-slate-400">Incoming messages from new contacts will appear here.</p>
              </div>
            ) : (
              localPendingRequests.map((req) => (
                <div key={req.id} className="p-4 bg-white/[0.02] hover:bg-white/[0.04] space-y-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={req.senderName} avatarUrl={req.senderAvatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{req.senderName}</h4>
                      <p className="text-[11px] text-slate-400 truncate">@{req.senderUsername}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleRequestResponse(req.conversationId, 'accept')}
                      disabled={requestActionLoading === req.conversationId}
                      className="flex-1 py-1.5 rounded-xl bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea/30 text-brand-caribbeanSea text-xs font-bold border border-brand-caribbeanSea/30 transition-all flex items-center justify-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" /> Accept
                    </button>
                    <button
                      onClick={() => handleRequestResponse(req.conversationId, 'decline')}
                      disabled={requestActionLoading === req.conversationId}
                      className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-1"
                    >
                      <UserX className="w-3 h-3" /> Decline
                    </button>
                    <button
                      onClick={() => handleRequestResponse(req.conversationId, 'block')}
                      disabled={requestActionLoading === req.conversationId}
                      title="Block Sender"
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : filteredConversations.length === 0 ? (
            /* Empty State */
            <div className="p-8 text-center text-slate-400 text-xs space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">
                {filter === 'all' ? 'No conversations yet' : `No ${filter} conversations`}
              </p>
              <p className="text-[11px] text-slate-400">
                {filter === 'all'
                  ? 'Start a private chat with friends and creators across the Caribbean diaspora.'
                  : `You don't have any conversations in the ${filter} folder.`}
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-md shadow-brand-caribbeanSea/20 hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> New Conversation
                </button>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[11px] transition-all cursor-pointer"
                  >
                    View All Chats
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Standard Conversation Items */
            filteredConversations.map((c) => {
              const isSelected = c.id === selectedId;
              const hasUnread = (c.unreadCount ?? 0) > 0;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setLocalConversations((prev) =>
                      prev.map((item) => (item.id === c.id ? { ...item, unreadCount: 0 } : item))
                    );
                    void markConversationReadAction(c.id);
                    router.push(`/messages?c=${c.id}`);
                    setMobileView('thread');
                  }}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-brand-caribbeanSea/15 via-white/[0.05] to-transparent border-l-2 border-brand-caribbeanSea'
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <UserAvatar
                      name={c.displayName}
                      avatarUrl={c.avatarUrl}
                      size="md"
                    />
                    {c.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0D0816]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="text-xs font-black text-white truncate flex items-center gap-1.5">
                        <span>{c.displayName}</span>
                        {c.kind === 'group' && (
                          <span className="px-1.5 py-0.2 rounded bg-brand-twilight text-[9px] text-brand-caribbeanSea font-bold uppercase">
                            Group
                          </span>
                        )}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                        {formatConversationTime(c.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[11px] truncate ${hasUnread ? 'text-white font-bold' : 'text-slate-300 font-normal'}`}>
                        {c.preview}
                      </p>
                      {hasUnread && (
                        <span className="px-1.5 py-0.5 rounded-full bg-brand-sunriseCoral text-slate-950 font-black text-[9px] flex-shrink-0 shadow-sm animate-pulse">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* COLUMN 2: Main Conversation Workspace                                     */}
      {/* ========================================================================= */}
      <section
        className={`flex-1 min-w-0 flex flex-col h-full bg-[#0E0919] relative ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedId ? (
          <MessageThread
            conversationId={selectedId}
            initialMessages={threadMessages}
            currentUserId={currentUserId}
            peerName={resolvedPeerName}
            peerAvatarUrl={resolvedPeerAvatar}
            isOnline={partnerIsOnline}
            onBack={() => {
              setMobileView('list');
              router.push('/messages');
            }}
            onToggleDetails={() => setIsDetailsOpen((prev) => !prev)}
            isDetailsOpen={isDetailsOpen}
            onMessageSent={handleMessageSent}
          />
        ) : (
          /* ======================================================================= */
          /* WELCOME MESSAGING HUB (When no conversation is selected)                */
          /* ======================================================================= */
          <div className="h-full overflow-y-auto p-6 lg:p-10 flex flex-col items-center justify-center text-center space-y-8 custom-scrollbar">
            {/* Hero Header */}
            <div className="max-w-md space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-caribbeanSea via-teal-400 to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center shadow-2xl shadow-brand-caribbeanSea/25 mx-auto">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                TUKUBI Direct Messaging Hub
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect with Caribbean friends, diaspora entrepreneurs, creators, and communities with end-to-end encrypted messaging, voice notes, and calls.
              </p>
            </div>

            {/* Contextual Friends & Presence Experience */}
            <div className="w-full max-w-xl bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 text-left shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-caribbeanSea" />
                  <span className="text-sm font-black text-white">
                    Your Caribbean Friends
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-slate-300">
                    {friendsWithPresence.length} total · {onlineFriends.length} online
                  </span>
                </div>
                <Link
                  href="/friends"
                  className="text-xs font-bold text-brand-caribbeanSea hover:underline flex items-center gap-1"
                >
                  Manage Friends <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Friends Search Input */}
              {friendsWithPresence.length > 0 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={friendsSearchQuery}
                    onChange={(e) => setFriendsSearchQuery(e.target.value)}
                    placeholder="Search your friends to message…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-caribbeanSea/50"
                  />
                </div>
              )}

              {/* Friends Grid / List */}
              {friendsWithPresence.length === 0 ? (
                /* Authentic Empty State when User has no friends */
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                    <UserPlus className="w-6 h-6 text-brand-caribbeanSea" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">No Friends Connected Yet</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Build your Caribbean social circle. Send friend requests to discover who is online and start private conversations.
                    </p>
                  </div>
                  <Link
                    href="/friends"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs shadow-md hover:brightness-105 transition-all"
                  >
                    <Users className="w-3.5 h-3.5" /> Find & Add Caribbean Friends
                  </Link>
                </div>
              ) : filteredFriendsInHub.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">
                  No friends matched &quot;{friendsSearchQuery}&quot;
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Online Friends Sub-section */}
                  {onlineFriends.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Online Now ({onlineFriends.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {onlineFriends.slice(0, 6).map((friend) => (
                          <div
                            key={friend.id}
                            className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 flex items-center justify-between gap-2.5 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative flex-shrink-0">
                                <UserAvatar name={friend.name} avatarUrl={friend.avatarUrl} size="sm" />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#140C22]" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white truncate">{friend.name}</h5>
                                <p className="text-[10px] text-emerald-400 font-medium">Online</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleStartChatWithUser(friend)}
                              disabled={startingChatWithId === friend.id}
                              className="px-2.5 py-1.5 rounded-xl bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea/30 text-brand-caribbeanSea border border-brand-caribbeanSea/30 text-[11px] font-bold flex items-center gap-1 transition-all flex-shrink-0 cursor-pointer"
                            >
                              {startingChatWithId === friend.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <MessageCircle className="w-3 h-3" />
                                  <span>Chat</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offline Friends Section */}
                  {offlineFriends.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Offline Friends ({offlineFriends.length})
                        </span>
                        <button
                          onClick={() => setShowOfflineFriends((prev) => !prev)}
                          className="text-[11px] text-brand-caribbeanSea hover:underline cursor-pointer"
                        >
                          {showOfflineFriends ? 'Hide' : 'Show All'}
                        </button>
                      </div>

                      {showOfflineFriends && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {offlineFriends.map((friend) => (
                            <div
                              key={friend.id}
                              className="p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex items-center justify-between gap-2.5 transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <UserAvatar name={friend.name} avatarUrl={friend.avatarUrl} size="sm" />
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-slate-200 truncate">{friend.name}</h5>
                                  <p className="text-[10px] text-slate-500">Offline</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleStartChatWithUser(friend)}
                                disabled={startingChatWithId === friend.id}
                                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-all flex-shrink-0 cursor-pointer"
                              >
                                {startingChatWithId === friend.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <span>Message</span>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsComposeOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-brand-caribbeanSea/25 hover:brightness-105 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Start New Conversation
              </button>
              <Link
                href="/friends"
                className="px-5 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold text-xs flex items-center gap-2 transition-all"
              >
                <Users className="w-4 h-4 text-brand-caribbeanSea" /> Manage Friends
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* COLUMN 3: Contextual Details Panel (Collapsible Desktop Right Column)     */}
      {/* ========================================================================= */}
      {selectedId && activeConversation && isDetailsOpen && (
        <div className="w-72 xl:w-80 2xl:w-88 flex-shrink-0 flex flex-col h-full z-20 transition-all duration-300">
          <ConversationDetailsPanel
            conversation={activeConversation}
            messages={threadMessages}
            currentUserId={currentUserId}
            isOnline={partnerIsOnline}
            onClose={() => setIsDetailsOpen(false)}
            onStartCall={(mode) => {
              // Trigger call mode via child components
            }}
          />
        </div>
      )}

      {/* New Message / New Group Modal */}
      {isComposeOpen && (
        <NewMessageModal
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          onlineFriends={friendsWithPresence}
          onlineMembers={friendsWithPresence}
          currentUserId={currentUserId}
          onConversationCreated={(convId) => {
            setIsComposeOpen(false);
            setLocalConversations((prev) =>
              prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
            );
            void markConversationReadAction(convId);
            router.push(`/messages?c=${convId}`);
            setMobileView('thread');
          }}
        />
      )}
    </div>
  );
}
