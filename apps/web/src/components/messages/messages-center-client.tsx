'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import MessageThread, { type ThreadMessage } from '../message-thread';
import NewMessageModal, { type NewMessageMember } from './new-message-modal';
import UserAvatar from '../user-avatar';
import { handleMessageRequestAction } from '../../lib/messaging/actions';

export interface ConversationSummary {
  id: string;
  kind: 'direct' | 'group';
  category?: 'personal' | 'business' | 'marketplace' | 'creator' | 'event' | 'community' | 'support';
  title: string | null;
  last_message_at: string | null;
  displayName: string;
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
  onlineMembers: NewMessageMember[];
  pendingRequests?: PendingRequest[];
  initialCompose?: boolean;
}

export default function MessagesCenterClient({
  conversations,
  selectedId,
  threadMessages,
  currentUserId,
  onlineMembers,
  pendingRequests = [],
  initialCompose = false,
}: MessagesCenterClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'group' | 'business' | 'marketplace' | 'requests' | 'archived'>('all');
  const [isComposeOpen, setIsComposeOpen] = useState(initialCompose);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>(selectedId ? 'thread' : 'list');
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    let list = conversations;
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
  }, [conversations, filter, search]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId]
  );

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

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

  async function handleRequestResponse(convId: string, action: 'accept' | 'decline' | 'block') {
    setRequestActionLoading(convId);
    try {
      await handleMessageRequestAction(convId, action);
      router.refresh();
    } finally {
      setRequestActionLoading(null);
    }
  }

  return (
    <div className="bg-[#120B1E]/95 backdrop-blur-3xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Specular Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Main Grid: Left Conversation List, Right Active Thread or Welcome Hub */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[78vh]">
        {/* LEFT COLUMN: Navigation, Search, Tabs & Conversations List */}
        <aside
          className={`md:col-span-4 lg:col-span-4 border-r border-white/10 flex flex-col bg-[#0D0816]/70 ${
            mobileView === 'thread' && selectedId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & New Chat Action */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
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
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:opacity-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-brand-caribbeanSea/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations & people…"
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

          {/* Filter Tabs */}
          <div className="px-4 py-2 flex items-center gap-1.5 border-b border-white/5 overflow-x-auto no-scrollbar">
            {(['all', 'direct', 'group', 'business', 'marketplace', 'requests', 'archived'] as const).map((tab) => {
              const isActive = filter === tab;
              const requestCount = tab === 'requests' ? pendingRequests.length : 0;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap flex items-center gap-1.5 ${
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

          {/* List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filter === 'requests' ? (
              /* Message Requests View */
              pendingRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <UserCheck className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">No Pending Requests</p>
                  <p className="text-[11px] text-slate-400">Incoming messages from new contacts will appear here.</p>
                </div>
              ) : (
                pendingRequests.map((req) => (
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
              <div className="p-8 text-center text-slate-400 text-xs space-y-3">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">
                  {search ? 'No matching conversations' : 'No conversations yet'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Start a private chat or group with members of the Caribbean diaspora.
                </p>
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-caribbeanSea" /> New Conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      router.push(`/messages?c=${c.id}`);
                      setMobileView('thread');
                    }}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-all relative ${
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
                        <p className="text-[11px] text-slate-300 truncate font-medium">
                          {c.preview}
                        </p>
                        {(c.unreadCount ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-brand-sunriseCoral text-slate-950 font-black text-[9px] flex-shrink-0">
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

        {/* RIGHT COLUMN: Active Thread or Caribbean Messaging Welcome Hub */}
        <section
          className={`md:col-span-8 lg:col-span-8 flex flex-col bg-slate-950/40 ${
            mobileView === 'list' && !selectedId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedId ? (
            <MessageThread
              conversationId={selectedId}
              initialMessages={threadMessages}
              currentUserId={currentUserId}
              peerName={activeConversation?.displayName || 'Caribbean Member'}
              peerAvatarUrl={activeConversation?.avatarUrl}
              onBack={() => setMobileView('list')}
            />
          ) : (
            /* WELCOME MESSAGING HUB (When no chat is selected) */
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-6">
              <div className="max-w-md space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-caribbeanSea via-teal-400 to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center shadow-xl shadow-brand-caribbeanSea/20 mx-auto">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  TUKUBI Direct Messaging
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  End-to-end encrypted direct chats, diaspora voice notes, WebRTC audio/video calls, and group channels.
                </p>
              </div>

              {/* Online Community Members Strip */}
              <div className="w-full max-w-lg bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Active Members
                  </span>
                  <Link href="/friends" className="text-[11px] font-bold text-brand-caribbeanSea hover:underline">
                    View All
                  </Link>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {onlineMembers.slice(0, 8).map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        router.push(`/messages?u=${encodeURIComponent(member.username)}`);
                        setMobileView('thread');
                      }}
                      className="flex flex-col items-center gap-1 min-w-[56px] group cursor-pointer"
                    >
                      <div className="relative">
                        <UserAvatar name={member.name} avatarUrl={member.avatarUrl} size="md" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#120B1E]" />
                      </div>
                      <span className="text-[10px] text-slate-300 font-bold group-hover:text-brand-caribbeanSea truncate max-w-[56px]">
                        {member.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setIsComposeOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea via-brand-sunriseCoral to-brand-goldenHour text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-brand-caribbeanSea/20 hover:opacity-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Start a New Chat
              </button>
            </div>
          )}
        </section>
      </div>

      {/* New Message / New Group Modal */}
      {isComposeOpen && (
        <NewMessageModal
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          onlineMembers={onlineMembers}
          currentUserId={currentUserId}
          onConversationCreated={(convId) => {
            setIsComposeOpen(false);
            router.push(`/messages?c=${convId}`);
            setMobileView('thread');
          }}
        />
      )}
    </div>
  );
}
