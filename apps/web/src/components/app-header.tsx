'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Wallet, Bell, MessageSquare, User, CheckCircle, Users, Calendar, ShoppingBag, X } from 'lucide-react';
import SessionWidget from './session-widget';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

interface SearchResultUser {
  id: string;
  display_name: string;
  username: string;
  origin_country_iso?: string;
  account_type?: string;
}

const SAMPLE_PEOPLE = [
  { id: 'u-1', display_name: 'Karene Reid', username: 'karenereid', flag: '🇯🇲', bio: 'Dub Sound Operator & Producer • Kingston' },
  { id: 'u-2', display_name: 'Carlos Santana-Mendez', username: 'carlos_rd', flag: '🇩🇴', bio: 'Fintech Founder & Tech Ambassador • Santo Domingo' },
  { id: 'u-3', display_name: 'Aaliyah Baptiste', username: 'aaliyah_soca', flag: '🇹🇹', bio: 'Soca Artist & Event Producer • Port of Spain' },
  { id: 'u-4', display_name: 'Devon Thorne', username: 'devon_barbados', flag: '🇧🇧', bio: 'Culinary Chef & Artisan • Bridgetown' },
  { id: 'u-5', display_name: 'Nathalie Jean-Baptiste', username: 'nathalie_haiti', flag: '🇭🇹', bio: 'Cultural Designer & Artist • Port-au-Prince' },
];

export default function AppHeader() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [livePeople, setLivePeople] = useState<SearchResultUser[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
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

        if (data && data.length > 0) {
          setLivePeople(data);
          return;
        }
      } catch {
        // Ignore fallback
      }
    }

    // Filter sample users if DB returns empty
    const filtered = SAMPLE_PEOPLE.filter(
      (p) =>
        p.display_name.toLowerCase().includes(val.toLowerCase()) ||
        p.username.toLowerCase().includes(val.toLowerCase())
    );
    setLivePeople(filtered);
  }

  function toggleFollow(userId: string) {
    setFollowingMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }

  return (
    <header
      className="sticky top-0 z-50 bg-[#060B14]/90 backdrop-blur-xl border-b border-sky-500/20 px-4 py-3 flex items-center justify-between"
      role="banner"
    >
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md"
          aria-label="CARIBBEAN ONE — Home"
        >
          <span className="bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
            CARIBBEAN ONE
          </span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            ECOSYSTEM
          </span>
        </Link>

        {/* ────────────────────────────────────────────────────────── */}
        {/* INSTANT REAL-TIME USER & PEOPLE SEARCH BAR                 */}
        {/* ────────────────────────────────────────────────────────── */}
        <div ref={searchRef} className="relative hidden md:flex items-center w-88">
          <form action="/search" method="GET" className="w-full relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-sky-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => query.trim() && setIsOpen(true)}
              placeholder="Search people, creators, events, culture..."
              aria-label="Search users and ecosystem"
              className="w-full bg-slate-950/90 border border-slate-700/80 hover:border-sky-500/60 rounded-full pl-10 pr-9 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                }}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Instant Live Dropdown */}
          {isOpen && (
            <div className="absolute top-12 left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border border-sky-500/30 rounded-3xl p-3 shadow-2xl z-50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between px-2 pt-1 border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> People &amp; Creators
                </span>
                <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-[10px] font-bold text-amber-400 hover:underline">
                  View All Results →
                </Link>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {livePeople.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No matching users found for &quot;{query}&quot;
                  </div>
                ) : (
                  livePeople.map((person) => (
                    <div
                      key={person.id}
                      className="p-2.5 rounded-2xl hover:bg-slate-800/80 transition-all flex items-center justify-between gap-3 group"
                    >
                      <Link
                        href={`/profile/${person.username}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md flex-shrink-0">
                          {person.display_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate flex items-center gap-1 group-hover:text-sky-300">
                            {person.display_name}
                            <CheckCircle className="w-3 h-3 text-sky-400" />
                          </h5>
                          <p className="text-[10px] text-slate-400 truncate">@{person.username}</p>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleFollow(person.id)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-xl transition-all ${
                          followingMap[person.id]
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        }`}
                      >
                        {followingMap[person.id] ? 'Following' : '+ Follow'}
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
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 px-3.5 py-1.5 rounded-full border border-emerald-500/30 text-xs font-extrabold transition-all shadow-md"
          aria-label="SpotPay Wallet balance"
        >
          <Wallet className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>SpotPay</span>
        </Link>

        <Link
          href="/notifications"
          className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800/80 relative transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        </Link>

        <Link
          href="/messages"
          className="hidden md:flex p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors"
          aria-label="Messages"
        >
          <MessageSquare className="w-5 h-5" aria-hidden="true" />
        </Link>

        <SessionWidget />
      </div>
    </header>
  );
}

