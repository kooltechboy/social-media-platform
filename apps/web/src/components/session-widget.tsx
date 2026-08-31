'use client';

import React from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useAuth } from './auth-provider';
import UserAvatar from './user-avatar';

export default function SessionWidget() {
  const { user, loading, signOut } = useAuth();

  if (loading && !user) {
    return <div className="w-16 h-7 rounded-full bg-white/5 animate-pulse" aria-hidden="true" />;
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

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/profile"
        className="flex items-center gap-2 group"
        aria-label={`View profile for @${user.username}`}
      >
        <UserAvatar
          src={user.avatarUrl}
          name={user.displayName || user.username}
          size="sm"
        />
        <span className="hidden md:block text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
          @{user.username}
        </span>
      </Link>

      {/* Sign out — visible on all screen sizes with icon and text */}
      <button
        type="button"
        onClick={() => void signOut()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all min-h-[32px] cursor-pointer"
        aria-label="Sign out of your TUKUBI account"
      >
        <LogOut className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
