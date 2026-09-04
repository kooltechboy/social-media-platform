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
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import UserAvatar from '../user-avatar';
import { getOrCreateDirectConversationAction } from '../../lib/messaging/actions';

export interface NewMessageMember {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  isOnline?: boolean;
  bio?: string | null;
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
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<NewMessageMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const membersList = onlineMembers || onlineFriends || [];

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
          const clean = search.trim();
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
            const mapped: NewMessageMember[] = data.map((p) => ({
              id: p.id,
              name: p.display_name || p.username || 'Caribbean Member',
              username: p.username || p.id.slice(0, 8),
              avatarUrl: p.avatar_url,
              isVerified: !!p.is_verified,
              bio: p.bio,
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
  }, [search, currentUserId, supabase]);

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#140C22] border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/60 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center shadow-md">
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
                {searchResults.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelectUser(member)}
                    disabled={startingChatWith === member.id}
                    className="w-full text-left flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-brand-caribbeanSea/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <UserAvatar
                        src={member.avatarUrl}
                        name={member.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white truncate">
                            {member.name}
                          </span>
                          {member.isVerified && (
                            <BadgeCheck className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-mono">
                          @{member.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-brand-caribbeanSea opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Chat</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
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
              {membersList.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelectUser(member)}
                  disabled={startingChatWith === member.id}
                  className="w-full text-left flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-brand-caribbeanSea/40 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <UserAvatar
                      src={member.avatarUrl}
                      name={member.name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white truncate">
                          {member.name}
                        </span>
                        {member.isVerified && (
                          <BadgeCheck className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        @{member.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-brand-caribbeanSea opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
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
      </div>
    </div>
  );
}
