'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Wallet, CreditCard, Bell, MessageSquare, User, CheckCircle, Users, Calendar, ShoppingBag, X } from 'lucide-react';
import SessionWidget from './session-widget';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { followAction, unfollowAction } from '../lib/social/profile-actions';
import UserAvatar from './user-avatar';
import { useTranslation } from '@caribbean/localization';
import { TukubiLogo } from './brand/tukubi-logo';
import { LanguageDropdown } from './gateway/LanguageDropdown';

interface SearchResultUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  flag?: string;
  bio?: string;
  origin_country_iso?: string;
  account_type?: string;
}

export default function AppHeader() {
  const router = useRouter();
  const { t } = useTranslation();
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

  // Fetch current user followings on mount
  useEffect(() => {
    async function loadFollowings() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        if (follows) {
          const map: Record<string, boolean> = {};
          follows.forEach((f) => (map[f.following_id] = true));
          setFollowingMap(map);
        }
      }
    }
    loadFollowings();
  }, []);

  async function handleSearchChange(val: string) {
    setQuery(val);
    if (!val.trim()) {
      setLivePeople([]);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    const sanitized = val.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
    if (!sanitized) {
      setLivePeople([]);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url, origin_country_iso, account_type')
          .eq('is_private', false)
          .or(`display_name.ilike.%${sanitized}%,username.ilike.%${sanitized}%`)
          .limit(6);

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

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
      className="sticky top-0 z-50 glass-aerospace border-b border-white/12 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 backdrop-blur-3xl shadow-xl shadow-black/30"
      role="banner"
    >
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. LEFT: PROMINENT TUKUBI BRAND & OFFICIAL TAGLINE         */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex items-center shrink-0">
        <TukubiLogo variant="horizontal" size="sm" href="/" priority />
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. CENTER: PROMINENT, STRUCTURALLY CENTERED SEARCH BAR     */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto px-4">
        <div ref={searchRef} className="relative w-full max-w-xl">
          <form onSubmit={handleFormSubmit} action="/search" method="GET" className="w-full relative">
            <Search className="absolute left-4 top-2.5 w-4 h-4 text-brand-caribbeanSea pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => query.trim() && setIsOpen(true)}
              placeholder={t('search.placeholder')}
              aria-label={t('a11y.search')}
              className="w-full bg-black/40 hover:bg-black/60 border border-white/12 hover:border-brand-caribbeanSea/50 rounded-full pl-11 pr-10 py-2 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-caribbeanSea focus:ring-2 focus:ring-brand-caribbeanSea/30 transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                }}
                className="absolute right-3.5 top-2.5 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Instant Live Dropdown */}
          {isOpen && (
            <div className="absolute top-12 left-0 right-0 bg-[#0C1226]/95 backdrop-blur-3xl border border-white/15 rounded-3xl p-3 shadow-2xl z-50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between px-2 pt-1 border-b border-white/10 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-caribbeanSea flex items-center gap-1">
                  <User className="w-3 h-3" /> {t('nav.people_creators')}
                </span>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] font-bold text-brand-goldenHour hover:underline"
                >
                  {t('nav.view_all_results')}
                </Link>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {livePeople.length === 0 ? (
                  <div className="p-3 text-center text-xs text-white/50">
                    No matching users found for &quot;{query}&quot;
                  </div>
                ) : (
                  livePeople.map((person) => (
                    <div
                      key={person.id}
                      className="p-2.5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-between gap-3 group"
                    >
                      <Link
                        href={`/profile/${person.username}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <UserAvatar
                          src={person.avatar_url}
                          name={person.display_name}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate flex items-center gap-1 group-hover:text-brand-caribbeanSea">
                            {person.display_name}
                            <CheckCircle className="w-3 h-3 text-brand-caribbeanSea" />
                          </h5>
                          <p className="text-[10px] text-white/50 truncate">@{person.username}</p>
                        </div>
                      </Link>

                      <button
                        type="button"
                        disabled={pendingFollowId === person.id}
                        onClick={() => toggleFollow(person.id)}
                        className={`text-[10px] font-black px-3.5 py-1 rounded-xl transition-all disabled:opacity-50 ${
                          followingMap[person.id]
                            ? 'bg-white/10 text-white border border-white/15 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                            : 'bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 shadow-md shadow-brand-caribbeanSea/20'
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

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/search"
          className="md:hidden p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label={t('a11y.search')}
        >
          <Search className="w-5 h-5" aria-hidden="true" />
        </Link>

        <LanguageDropdown variant="compact" />

        <Link
          href="/financial-center"
          className="flex items-center gap-1.5 bg-gradient-to-r from-brand-sunriseCoral/15 to-brand-goldenHour/15 hover:from-brand-sunriseCoral/25 hover:to-brand-goldenHour/25 text-brand-sunriseCoral px-3.5 py-1.5 rounded-full border border-brand-sunriseCoral/30 text-xs font-black transition-all shadow-md shadow-brand-sunriseCoral/10"
          aria-label={t('nav.financial_center')}
        >
          <CreditCard className="w-3.5 h-3.5 text-brand-sunriseCoral" aria-hidden="true" />
          <span className="hidden sm:inline">{t('nav.financial_center')}</span>
        </Link>

        <Link
          href="/notifications"
          className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 relative transition-colors"
          aria-label={t('nav.notifications')}
        >
          <Bell className="w-4.5 h-4.5" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-goldenHour rounded-full animate-pulse shadow-[0_0_8px_rgba(255,179,71,0.9)]" />
        </Link>

        <Link
          href="/messages"
          className="hidden md:flex p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label={t('nav.messages')}
        >
          <MessageSquare className="w-4.5 h-4.5" aria-hidden="true" />
        </Link>

        <SessionWidget />
      </div>
    </header>
  );
}
