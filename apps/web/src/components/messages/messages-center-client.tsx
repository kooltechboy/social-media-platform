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
} from 'lucide-react';
import MessageThread, { type ThreadMessage } from '../message-thread';
import NewMessageModal, { type NewMessageMember } from './new-message-modal';
import UserAvatar from '../user-avatar';

export interface ConversationSummary {
  id: string;
  kind: 'direct' | 'group';
  title: string | null;
  last_message_at: string | null;
  displayName: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  preview: string;
}

interface MessagesCenterClientProps {
  conversations: ConversationSummary[];
  selectedId: string | null;
  threadMessages: ThreadMessage[];
  currentUserId: string;
  onlineMembers: NewMessageMember[];
  initialCompose?: boolean;
}

export default function MessagesCenterClient({
  conversations,
  selectedId,
  threadMessages,
  currentUserId,
  onlineMembers,
  initialCompose = false,
}: MessagesCenterClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'group'>('all');
  const [isComposeOpen, setIsComposeOpen] = useState(initialCompose);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>(selectedId ? 'thread' : 'list');

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (filter === 'direct') {
      list = list.filter((c) => c.kind === 'direct');
    } else if (filter === 'group') {
      list = list.filter((c) => c.kind === 'group');
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

  return (
    <div className="bg-[#120B1E]/95 backdrop-blur-3xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Specular Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Main Grid: Left Conversation List, Right Active Thread or Welcome Hub */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[78vh]">
        {/* LEFT COLUMN: Conversation List */}
        <aside
          className={`md:col-span-4 lg:col-span-4 border-r border-white/10 flex flex-col ${
            mobileView === 'thread' && selectedId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Compose Action */}
          <div className="p-4 border-b border-white/10 space-y-3 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 flex items-center justify-center text-brand-caribbeanSea">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h2 className="font-black text-base text-white">Conversations</h2>
                {conversations.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {conversations.length}
                  </span>
                )}
              </div>

              {/* Compose New Message Button */}
              <button
                type="button"
                onClick={() => setIsComposeOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:from-cyan-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-brand-caribbeanSea/20 transition-all cursor-pointer"
                title="Start a new message"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats or messages..."
                className="w-full bg-[#1B1129] border border-white/15 rounded-xl pl-9 pr-7 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/40 transition-all font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filter === 'all'
                    ? 'bg-brand-caribbeanSea text-slate-950 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('direct')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filter === 'direct'
                    ? 'bg-brand-caribbeanSea text-slate-950 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Direct
              </button>
              <button
                type="button"
                onClick={() => setFilter('group')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filter === 'group'
                    ? 'bg-brand-caribbeanSea text-slate-950 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Groups
              </button>
            </div>
          </div>

          {/* Conversation List / Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
            {conversations.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white/[0.03] border border-dashed border-white/15 space-y-3.5 my-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea/20 to-brand-sunriseCoral/20 border border-brand-caribbeanSea/30 flex items-center justify-center text-brand-caribbeanSea mx-auto shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white">No Conversations Yet</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Connect with Caribbean creators, businesses, and friends across the diaspora.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black text-xs shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Start a Conversation
                </button>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((summary) => {
                const isSelected = summary.id === selectedId;
                return (
                  <Link
                    key={summary.id}
                    href={`/messages?c=${summary.id}`}
                    onClick={() => setMobileView('thread')}
                    className={`block w-full text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-white/[0.10] border-brand-caribbeanSea/60 shadow-lg'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                          {summary.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        {summary.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#120B1E] shadow-sm" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-white truncate flex items-center gap-1">
                            {summary.kind === 'group' && (
                              <Users className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
                            )}
                            {summary.displayName}
                          </span>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {formatConversationTime(summary.last_message_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 truncate mt-0.5 font-medium">
                          {summary.preview}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No chats matching &quot;{search}&quot;
              </div>
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
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Connect, collaborate, and chat securely with Caribbean creators, entrepreneurs, and the diaspora across the globe.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea via-teal-400 to-brand-sunriseCoral hover:opacity-95 text-slate-950 font-black text-xs shadow-xl shadow-brand-caribbeanSea/30 transition-all transform hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" /> Start a New Conversation
                  </button>
                </div>
              </div>

              {/* Guarantees & Features Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg text-[11px] text-slate-300 font-bold">
                <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Safe & Encrypted
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Realtime Presence
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" /> Pan-Caribbean Network
                </span>
              </div>

              {/* Quick Message Recommendations */}
              {onlineMembers.length > 0 && (
                <div className="w-full max-w-xl pt-4 border-t border-white/10 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Quick Chat with Members
                    </h4>
                    <Link
                      href="/members"
                      className="text-[11px] font-bold text-brand-caribbeanSea hover:underline"
                    >
                      Browse Directory &rarr;
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {onlineMembers.slice(0, 4).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all group"
                      >
                        <Link
                          href={`/profile/${member.username}`}
                          className="flex items-center gap-2.5 min-w-0 pr-2"
                        >
                          <div className="relative flex-shrink-0">
                            <UserAvatar
                              src={member.avatarUrl}
                              name={member.name}
                              size="sm"
                            />
                            {member.isOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#120B1E]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white group-hover:text-brand-caribbeanSea transition-colors truncate">
                              {member.name}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-300 truncate">
                              @{member.username}
                            </p>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            router.push(`/messages?u=${encodeURIComponent(member.username)}`);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea text-brand-caribbeanSea hover:text-slate-950 font-black text-[11px] border border-brand-caribbeanSea/40 transition-all flex items-center gap-1 flex-shrink-0"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Chat</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Interactive New Message Modal */}
      <NewMessageModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onlineFriends={onlineMembers}
        currentUserId={currentUserId}
      />
    </div>
  );
}
