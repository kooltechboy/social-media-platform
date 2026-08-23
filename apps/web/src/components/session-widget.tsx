'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { signOutAction } from '../lib/auth/actions';

export default function SessionWidget() {
  const [user, setUser] = useState<{ id: string; displayName: string } | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const name = data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'Member';
        setUser({ id: data.user.id, displayName: name });
      }
    });
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs px-4 py-2 rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-sky-400 to-emerald-400 p-0.5 shadow-md">
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-xs font-black text-white">
            {user.displayName.slice(0, 2).toUpperCase()}
          </div>
        </div>
        <span className="hidden md:block text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
          {user.displayName}
        </span>
      </Link>
      <form action={signOutAction}>
        <button type="submit" className="text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-colors">
          Sign out
        </button>
      </form>
    </div>
  );
}

