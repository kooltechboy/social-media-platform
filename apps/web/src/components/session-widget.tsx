import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '../lib/supabase/server';
import { signOutAction } from '../lib/auth/actions';

export default async function SessionWidget() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-full transition-colors"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-amber-500 p-0.5">
          <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold">
            {user.displayName.slice(0, 2).toUpperCase()}
          </div>
        </div>
        <span className="hidden md:block text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
          {user.displayName}
        </span>
      </Link>
      <form action={signOutAction}>
        <button type="submit" className="text-[11px] font-semibold text-slate-500 hover:text-rose-400 transition-colors">
          Sign out
        </button>
      </form>
    </div>
  );
}
