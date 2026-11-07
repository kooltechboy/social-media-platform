'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  MessageSquare,
  Users,
  BadgeCheck,
  Sparkles,
  Loader2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import UserAvatar from '../user-avatar';
import {
  getOrCreateDirectConversationAction,
  createGroupConversationAction,
} from '../../lib/messaging/actions';

export interface NewMessageMember {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  isOnline?: boolean;
  bio?: string | null;
  isFriend?: boolean;
}

export interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineFriends?: NewMessageMember[];
  onlineMembers?: NewMessageMember[];
  currentUserId?: string;
  onConversationCreated?: (convId: string) => void;
}

export default function NewMessageModal({
  isOpen,
  onClose,
  onlineFriends,
  onlineMembers,
  currentUserId,
  onConversationCreated,
}: NewMessageModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<NewMessageMember[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<NewMessageMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const membersList = useMemo(() => {
    if (onlineFriends && onlineFriends.length > 0) {
      return onlineFriends.map((f) => ({ ...f, isFriend: true }));
    }
    return (onlineMembers || []).map((m) => ({ ...m, isFriend: false }));
  }, [onlineFriends, onlineMembers]);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      ),
    []
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search for members
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      startTransition(async () => {
        try {
          const clean = search.replace(/^@/, '').trim();
          let query = supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, is_verified, bio')
            .eq('is_private', false)
            .or(`display_name.ilike.%${clean}%,username.ilike.%${clean}%`)
            .limit(10);

          if (currentUserId) {
            query = query.neq('id', currentUserId);
          }

          const { data, error } = await query;
          if (error) throw error;

          if (data) {
            const friendSet = new Set((onlineFriends || []).map((f) => f.id));
            const mapped: NewMessageMember[] = data.map((p) => ({
              id: p.id,
              name: p.display_name || p.username || 'Caribbean Member',
              username: p.username || p.id.slice(0, 8),
              avatarUrl: p.avatar_url,
              isVerified: !!p.is_verified,
              bio: p.bio,
              isFriend: friendSet.has(p.id),
            }));
            setSearchResults(mapped);
          }
        } catch (err) {
          console.error('[NewMessageModal] Search error:', err);
        } finally {
          setLoading(false);
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [search, currentUserId, supabase, onlineFriends]);

  if (!isOpen) return null;

  const handleSelectUser = async (member: NewMessageMember) => {
    setStartingChatWith(member.id);
    onClose();
    if (onConversationCreated) {
      try {
        const result = await getOrCreateDirectConversationAction(member.id);
        if (result.conversationId) {
          onConversationCreated(result.conversationId);
          return;
        }
      } catch (err) {
        console.warn('Direct conversation fallback to query param:', err);
      }
    }
    router.push(`/messages?u=${encodeURIComponent(member.username)}`);
  };

  const handleToggleMember = (member: NewMessageMember) => {
    setGroupError(null);
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.id === member.id);
      if (exists) {
        return prev.filter((m) => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      setGroupError('Please enter a group title.');
      return;
    }
    if (selectedMembers.length === 0) {
      setGroupError('Please select at least one member to join.');
      return;
    }

    setIsCreatingGroup(true);
    setGroupError(null);
    try {
      const res = await createGroupConversationAction({
        title: groupTitle.trim(),
        memberIds: selectedMembers.map((m) => m.id),
      });

      if (res.error) {
        setGroupError(res.error);
        return;
      }

      if (res.conversationId) {
        onClose();
        if (onConversationCreated) {
          onConversationCreated(res.conversationId);
        } else {
          router.push(`/messages?c=${res.conversationId}`);
        }
      }
    } catch (err: any) {
      setGroupError(err?.message || 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0B1424] border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/60 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-caribbeanTeal to-brand-caribbeanSea text-slate-950 font-black flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Start a Conversation</h2>
              <p className="text-[11px] text-slate-300">
                Message friends, creators, and Caribbean community members.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode('direct');
              setGroupError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'direct'
                ? 'bg-brand-caribbeanSea text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Direct Message</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('group');
              setGroupError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'group'
                ? 'bg-brand-caribbeanSea text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
        </div>

        {/* Group Name & Selected Members in Group Mode */}
        {mode === 'group' && (
          <div className="space-y-2.5">
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Group Name (e.g. Trinidad Carnival Crew 2026)…"
              className="w-full bg-[#1E142D] border border-white/15 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-caribbeanSea transition-all"
            />

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-white/5 rounded-2xl border border-white/10 max-h-24 overflow-y-auto">
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-caribbeanSea/20 border border-brand-caribbeanSea/40 text-brand-caribbeanSea text-xs font-bold"
                  >
                    {m.name}
                    <button
                      type="button"
                      onClick={() => setSelectedMembers((prev) => prev.filter((x) => x.id !== m.id))}
                      className="hover:text-white cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or @username..."
            className="w-full bg-[#1E142D] border border-white/15 rounded-2xl pl-10 pr-9 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* List Results or Suggested Friends */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {loading ? (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-caribbeanSea mx-auto" />
              <p className="text-xs text-slate-400">Searching diaspora members...</p>
            </div>
          ) : search.trim().length > 0 ? (
            searchResults.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
                  Search Results ({searchResults.length})
                </p>
                {searchResults.map((member) => {
                  const isSelected = selectedMembers.some((m) => m.id === member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        if (mode === 'group') {
                          handleToggleMember(member);
                        } else {
                          handleSelectUser(member);
                        }
                      }}
                      disabled={startingChatWith === member.id}
                      className={`w-full text-left flex items-center justify-between p-3 rounded-2xl transition-all group cursor-pointer ${
                        isSelected
                          ? 'bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/50'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-brand-caribbeanSea/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <UserAvatar
                          src={member.avatarUrl}
                          name={member.name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-white truncate">
                              {member.name}
                            </span>
                            {member.isVerified && (
                              <BadgeCheck className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
                            )}
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                                member.isFriend
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-white/5 text-slate-400 border-white/10'
                              }`}
                            >
                              {member.isFriend ? 'Friend' : 'Member'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate font-mono">
                            @{member.username}
                          </p>
                        </div>
                      </div>
                      {mode === 'group' ? (
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-brand-caribbeanSea border-brand-caribbeanSea text-slate-950 font-bold'
                              : 'border-white/30 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-brand-caribbeanSea opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Chat</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center space-y-1.5">
                <p className="text-xs font-bold text-slate-300">No members found</p>
                <p className="text-[11px] text-slate-500">
                  Try searching with a different name or @handle.
                </p>
              </div>
            )
          ) : membersList.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Suggested Connections
              </p>
              {membersList.map((member) => {
                const isSelected = selectedMembers.some((m) => m.id === member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      if (mode === 'group') {
                        handleToggleMember(member);
                      } else {
                        handleSelectUser(member);
                      }
                    }}
                    disabled={startingChatWith === member.id}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-2xl transition-all group cursor-pointer ${
                      isSelected
                        ? 'bg-brand-caribbeanSea/15 border border-brand-caribbeanSea/50'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-brand-caribbeanSea/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <UserAvatar
                        src={member.avatarUrl}
                        name={member.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white truncate">
                            {member.name}
                          </span>
                          {member.isVerified && (
                            <BadgeCheck className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
                          )}
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                              member.isFriend
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                          >
                            {member.isFriend ? 'Friend' : 'Member'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-mono">
                          @{member.username}
                        </p>
                      </div>
                    </div>
                    {mode === 'group' ? (
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-brand-caribbeanSea border-brand-caribbeanSea text-slate-950 font-bold'
                            : 'border-white/30 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-bold text-brand-caribbeanSea opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Chat</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-300">Type a name to search</p>
              <p className="text-[11px] text-slate-500">
                Discover creators, friends, and Caribbean businesses.
              </p>
            </div>
          )}
        </div>

        {/* Create Group Action Dock in Group Mode */}
        {mode === 'group' && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            {groupError && (
              <p className="text-xs text-rose-400 font-semibold text-center">{groupError}</p>
            )}
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !groupTitle.trim() || selectedMembers.length === 0}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-caribbeanTeal to-brand-caribbeanSea text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-caribbeanSea/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              {isCreatingGroup ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              <span>Create Group ({selectedMembers.length} selected)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
