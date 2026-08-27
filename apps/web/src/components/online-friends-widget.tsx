'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { Search, MessageCircle, BadgeCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface FriendMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen?: string;
}

export default function OnlineFriendsWidget() {
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState<FriendMember[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      ),
    []
  );

  // 1. Initial profile fetch and Realtime Presence setup
  useEffect(() => {
    let channel: any;

    async function loadMembersAndPresence() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase
          .from('profiles')
          .select('id, display_name, username, is_verified, avatar_path, updated_at')
          .order('updated_at', { ascending: false })
          .limit(12);

        if (user) {
          query = query.neq('id', user.id);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data) {
          const mapped: FriendMember[] = data.map((p) => ({
            id: p.id,
            name: p.display_name || p.username || 'Caribbean Member',
            username: p.username || p.id.slice(0, 8),
            avatar: (p.display_name || p.username || 'CM').slice(0, 2).toUpperCase(),
            isVerified: !!p.is_verified,
            isOnline: true,
          }));
          setFriends(mapped);
        }

        // 2. Track Realtime Presence
        channel = supabase.channel('antilia:presence', {
          config: { presence: { key: user?.id || `anon-${Math.random().toString(36).slice(2, 7)}` } },
        });

        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const onlineIds = new Set<string>();
            Object.values(state).forEach((presences: any) => {
              presences.forEach((p: any) => {
                if (p.userId) onlineIds.add(p.userId);
              });
            });
            setOnlineUserIds(onlineIds);
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED' && user) {
              await channel.track({
                userId: user.id,
                onlineAt: new Date().toISOString(),
              });
            }
          });
      } catch (err) {
        console.error('[OnlineFriendsWidget] Error fetching members:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMembersAndPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  // 3. Debounced live database search
  useEffect(() => {
    if (!search.trim()) return;

    const timer = setTimeout(async () => {
      startTransition(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const cleanQuery = search.trim();
          let query = supabase
            .from('profiles')
            .select('id, display_name, username, is_verified, avatar_path, updated_at')
            .or(`display_name.ilike.%${cleanQuery}%,username.ilike.%${cleanQuery}%`)
            .limit(10);

          if (user) {
            query = query.neq('id', user.id);
          }

          const { data } = await query;
          if (data) {
            const searchMapped: FriendMember[] = data.map((p) => ({
              id: p.id,
              name: p.display_name || p.username || 'Caribbean Member',
              username: p.username || p.id.slice(0, 8),
              avatar: (p.display_name || p.username || 'CM').slice(0, 2).toUpperCase(),
              isVerified: !!p.is_verified,
              isOnline: onlineUserIds.has(p.id) || true,
            }));
            setFriends(searchMapped);
          }
        } catch (err) {
          console.error('[OnlineFriendsWidget] Search error:', err);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [search, onlineUserIds, supabase]);

  const onlineCount = friends.filter((f) => onlineUserIds.has(f.id) || f.isOnline).length;

  return (
    <div className="bg-brand-dusk/80 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm text-brand-sandstone flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-caribbeanSea" />
          Friends & Members
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
          {onlineCount} ONLINE
        </span>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-brand-sandstone/40" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members by name or @..."
          className="w-full bg-brand-twilight/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/50 transition-all"
        />
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-1">
        {loading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-800/60" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-800/60 rounded w-24" />
                  <div className="h-2 bg-slate-800/40 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-brand-dusk/50 transition-colors group">
              <Link
                href={`/profile/${friend.username}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-twilight to-brand-dusk border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shadow-sm group-hover:border-brand-caribbeanSea/50 transition-colors">
                    {friend.avatar}
                  </div>
                  {friend.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-brand-sunriseCoral border-2 border-slate-900" title="Online" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-brand-sandstone transition-colors truncate">{friend.name}</p>
                    {friend.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-brand-sandstone/40 truncate">
                    @{friend.username}
                  </p>
                </div>
              </Link>
              
              <Link
                href={`/messages?u=${encodeURIComponent(friend.username)}`}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-slate-800 hover:bg-brand-caribbeanSea hover:text-slate-950 text-slate-300 transition-all shadow-sm"
                title={`Send direct message to ${friend.name}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="w-4 h-4" />
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-brand-sandstone/40">
            No members found matching &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
