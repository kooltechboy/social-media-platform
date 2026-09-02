import React from 'react';
import Link from 'next/link';
import { LogOut, BadgeCheck } from 'lucide-react';
import { useAuth } from './auth-provider';
import UserAvatar from './user-avatar';
import OfficialBadge from './official/official-badge';

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

  const isOfficial = user.isOfficial || user.username.toLowerCase() === 'tukubi';

  return (
    <div className="flex items-center gap-3">
      <Link
        href={isOfficial ? '/profile/tukubi' : '/profile'}
        className="flex items-center gap-2.5 group"
        aria-label={`View profile for @${user.username}`}
      >
        <div className="relative">
          <UserAvatar
            src={user.avatarUrl}
            name={user.displayName || user.username}
            size="sm"
            className={isOfficial ? 'ring-2 ring-brand-caribbeanSea/60 shadow-md' : ''}
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0F172A]" />
        </div>

        <div className="hidden md:flex flex-col items-start leading-tight">
          <div className="flex items-center gap-1">
            <span className="text-xs font-black text-brand-sandstone group-hover:text-brand-caribbeanSea transition-colors">
              {user.displayName || user.username}
            </span>
            {isOfficial ? (
              <BadgeCheck className="w-3.5 h-3.5 text-[#0EA5E9] fill-[#0EA5E9]/20" />
            ) : user.isVerified ? (
              <BadgeCheck className="w-3.5 h-3.5 text-brand-caribbeanSea" />
            ) : null}
          </div>

          <span className="text-[10px] text-brand-sandstone/50 group-hover:text-brand-sandstone/80 transition-colors">
            @{user.username}
          </span>

          {isOfficial && (
            <div className="mt-0.5">
              <OfficialBadge size="xs" showLabel={true} label="Official TUKUBI" />
            </div>
          )}
        </div>
      </Link>

      {/* Sign out */}
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
