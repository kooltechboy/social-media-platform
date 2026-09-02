'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  LogOut,
  BadgeCheck,
  User,
  Settings,
  CreditCard,
  Sparkles,
  Store,
  ShoppingBag,
  Users,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from './auth-provider';
import UserAvatar from './user-avatar';
import OfficialBadge from './official/official-badge';

export default function SessionWidget() {
  const { user, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (loading && !user) {
    return <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="bg-gradient-to-r from-brand-goldenHour via-brand-caribbeanSea to-brand-sunriseCoral hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs px-4 py-2 rounded-full shadow-lg shadow-brand-goldenHour/20 transition-all hover:scale-105"
      >
        Sign In
      </Link>
    );
  }

  const isOfficial = user.isOfficial || user.username?.toLowerCase() === 'tukubi';
  const profileHref = isOfficial ? '/profile/tukubi' : `/profile/${user.username || ''}`;

  return (
    <div className="relative" ref={menuRef}>
      {/* ── AVATAR-FIRST PRIMARY HEADER BUTTON ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${user.displayName || user.username}`}
        className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-caribbeanSea/50 transition-all group cursor-pointer"
      >
        <div className="relative">
          <UserAvatar
            src={user.avatarUrl}
            name={user.displayName || user.username}
            size="sm"
            className={
              isOfficial
                ? 'ring-2 ring-brand-caribbeanSea/80 shadow-md shadow-brand-caribbeanSea/20'
                : 'ring-1 ring-white/20 group-hover:ring-brand-caribbeanSea/60 transition-all'
            }
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0F172A]" />
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-white/50 group-hover:text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-caribbeanSea' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* ── ACCOUNT DROPDOWN MENU ── */}
      {isOpen && (
        <div
          role="menu"
          aria-label="User Account Menu"
          className="absolute right-0 top-12 w-72 bg-[#0C1226]/95 backdrop-blur-3xl border border-white/15 rounded-3xl p-3 shadow-2xl z-50 animate-fadeIn space-y-2 text-brand-sandstone"
        >
          {/* Identity Header */}
          <Link
            href={profileHref}
            onClick={() => setIsOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <UserAvatar
              src={user.avatarUrl}
              name={user.displayName || user.username}
              size="md"
              className={isOfficial ? 'ring-2 ring-brand-caribbeanSea/80' : ''}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-white truncate group-hover:text-brand-caribbeanSea transition-colors">
                  {user.displayName || user.username}
                </span>
                {isOfficial ? (
                  <BadgeCheck className="w-3.5 h-3.5 text-[#0EA5E9] fill-[#0EA5E9]/20 flex-shrink-0" />
                ) : user.isVerified ? (
                  <BadgeCheck className="w-3.5 h-3.5 text-brand-caribbeanSea flex-shrink-0" />
                ) : null}
              </div>
              <p className="text-[11px] text-white/50 truncate">@{user.username}</p>
              {isOfficial && (
                <div className="mt-1">
                  <OfficialBadge size="xs" showLabel={true} label="Official Platform" />
                </div>
              )}
            </div>
          </Link>

          <div className="h-px bg-white/10 my-1" />

          {/* Navigation Links */}
          <div className="space-y-0.5 text-xs font-bold">
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <User className="w-4 h-4 text-brand-caribbeanSea" />
              <span>View Profile</span>
            </Link>

            <Link
              href="/financial-center"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-brand-sunriseCoral" />
              <span>Financial Center & Wallet</span>
            </Link>

            <Link
              href="/creator-studio"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-brand-goldenHour" />
              <span>Creator Studio</span>
            </Link>

            <Link
              href="/merchant"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Merchant & Stores</span>
            </Link>

            <Link
              href="/marketplace"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>Marketplace</span>
            </Link>

            <Link
              href="/communities"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Communities & Hubs</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Settings & Privacy</span>
            </Link>

            {/* Admin console link if authorized or official */}
            {isOfficial && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-brand-goldenHour hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-brand-goldenHour" />
                <span>Administration Console</span>
              </Link>
            )}
          </div>

          <div className="h-px bg-white/10 my-1" />

          {/* Sign out Action */}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setIsOpen(false);
              await signOut();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
            aria-label="Sign out of your TUKUBI account"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

