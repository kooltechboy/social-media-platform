'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Wallet, Bell, MessageSquare, User, CheckCircle, Users, Calendar, ShoppingBag, X } from 'lucide-react';
import SessionWidget from './session-widget';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

import { followAction, unfollowAction } from '../lib/social/profile-actions';

interface SearchResultUser {
  id: string;
  display_name: string;
  username: string;
  flag?: string;
  bio?: string;
  origin_country_iso?: string;
  account_type?: string;
}

export default function AppHeader() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [livePeople, setLivePeople] = useState<SearchResultUser[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSearchChange(val: string) {
    setQuery(val);
    if (!val.trim()) {
      setLivePeople([]);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, username, origin_country_iso, account_type')
          .or(`display_name.ilike.%${val}%,username.ilike.%${val}%`)
          .limit(5);

        if (data) {
          setLivePeople(data);
          return;
        }
      } catch {
        setLivePeople([]);
      }
    } else {
      setLivePeople([]);
    }
  }

  async function toggleFollow(userId: string) {
    const currentlyFollowing = !!followingMap[userId];
    setFollowingMap((prev) => ({ ...prev, [userId]: !currentlyFollowing }));
    setPendingFollowId(userId);

    try {
      if (currentlyFollowing) {
        const res = await unfollowAction(userId);
        if (res.error) {
          setFollowingMap((prev) => ({ ...prev, [userId]: currentlyFollowing }));
        }
      } else {
        const res = await followAction(userId);
        if (res.error) {
          setFollowingMap((prev) => ({ ...prev, [userId]: currentlyFollowing }));
        }
      }
    } catch {
      setFollowingMap((prev) => ({ ...prev, [userId]: currentlyFollowing }));
    } finally {
      setPendingFollowId(null);
    }
  }

  return (
    <header
      className="sticky top-0 z-50 glass border-b border-white/10 px-6 sm:px-6 py-4 flex items-center justify-between"
      role="banner"
    >
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-sandstone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea rounded-md"
          aria-label="TUKUBI — Home"
        >
          <span className="bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral bg-clip-text text-transparent tracking-wider">
            TUKUBI
          </span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-caribbeanSea/20 text-brand-caribbeanSea border border-brand-caribbeanSea/30">
            ECOSYSTEM
          </span>
        </Link>

        {/* ────────────────────────────────────────────────────────── */}
        {/* INSTANT REAL-TIME USER & PEOPLE SEARCH BAR                 */}
        {/* ────────────────────────────────────────────────────────── */}
        <div ref={searchRef} className="relative hidden md:flex items-center w-88">
          <form action="/search" method="GET" className="w-full relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-brand-caribbeanSea pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => query.trim() && setIsOpen(true)}
              placeholder="Search people, creators, events, culture..."
              aria-label="Search users and ecosystem"
              className="w-full bg-brand-twilight/90 border border-slate-700/80 hover:border-brand-caribbeanSea/60 rounded-full pl-10 pr-9 py-2 text-xs text-brand-sandstone placeholder-brand-sandstone/60 focus:outline-none focus:border-brand-caribbeanSea focus:ring-2 focus:ring-brand-caribbeanSea/30 transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                }}
                className="absolute right-3 top-2.5 text-brand-sandstone/40 hover:text-brand-sandstone"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Instant Live Dropdown */}
          {isOpen && (
            <div className="absolute top-12 left-0 right-0 bg-brand-dusk/95 backdrop-blur-2xl border border-brand-caribbeanSea/30 rounded-3xl p-3 shadow-2xl z-50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between px-2 pt-1 border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-caribbeanSea flex items-center gap-1">
                  <User className="w-3 h-3" /> People &amp; Creators
                </span>
                <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-[10px] font-bold text-brand-goldenHour hover:underline">
                  View All Results →
                </Link>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {livePeople.length === 0 ? (
                  <div className="p-3 text-center text-xs text-brand-sandstone/60">
                    No matching users found for &quot;{query}&quot;
                  </div>
                ) : (
                  livePeople.map((person) => (
                    <div
                      key={person.id}
                      className="p-2.5 rounded-2xl hover:bg-brand-dusk/80 transition-all flex items-center justify-between gap-3 group"
                    >
                      <Link
                        href={`/profile/${person.username}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral text-slate-950 font-black flex items-center justify-center text-xs shadow-md flex-shrink-0">
                          {person.display_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-brand-sandstone truncate flex items-center gap-1 group-hover:text-brand-caribbeanSea">
                            {person.display_name}
                            <CheckCircle className="w-3 h-3 text-brand-caribbeanSea" />
                          </h5>
                          <p className="text-[10px] text-brand-sandstone/60 truncate">@{person.username}</p>
                        </div>
                      </Link>

                      <button
                        type="button"
                        disabled={pendingFollowId === person.id}
                        onClick={() => toggleFollow(person.id)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-xl transition-all disabled:opacity-50 ${
                          followingMap[person.id]
                            ? 'bg-brand-dusk text-slate-300 border border-slate-700 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40'
                            : 'bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-sunriseCoral/20'
                        }`}
                      >
                        {pendingFollowId === person.id ? '…' : followingMap[person.id] ? 'Following' : '+ Follow'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <Link
          href="/spotpay"
          className="flex items-center gap-2 bg-brand-dusk/90 hover:bg-brand-dusk text-brand-sunriseCoral px-3.5 py-1.5 rounded-full border border-brand-sunriseCoral/30 text-xs font-extrabold transition-all shadow-md"
          aria-label="SpotPay Wallet balance"
        >
          <Wallet className="w-4 h-4 text-brand-sunriseCoral" aria-hidden="true" />
          <span>SpotPay</span>
        </Link>

        <Link
          href="/notifications"
          className="p-2 text-slate-300 hover:text-brand-sandstone rounded-full hover:bg-brand-dusk/80 relative transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-goldenHour rounded-full animate-pulse" />
        </Link>

        <Link
          href="/messages"
          className="hidden md:flex p-2 text-slate-300 hover:text-brand-sandstone rounded-full hover:bg-brand-dusk/80 transition-colors"
          aria-label="Messages"
        >
          <MessageSquare className="w-5 h-5" aria-hidden="true" />
        </Link>

        <SessionWidget />
      </div>
    </header>
  );
}



