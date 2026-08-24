'use client';

import React, { useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const supabase = url && anonKey ? createBrowserClient(url, anonKey) : null;

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        setError('Email and password are required.');
        setLoading(false);
        return;
      }

      if (!supabase) {
        setError('Supabase is not configured.');
        setLoading(false);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    },
    [email, password, supabase, router],
  );

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-400" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-extrabold text-white tracking-tight">
            ANTILIA
          </h1>
          <p className="text-sm font-semibold text-amber-300">
            Moderation Center
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-slate-400 mb-1.5"
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="moderator@caribbeanone.com"
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-400 mb-1.5"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50 transition-colors"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-xs text-rose-400 font-medium"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:opacity-60 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-[#090D16]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Restricted access notice */}
        <p className="text-center text-[11px] text-slate-600">
          Access restricted to authorized moderators.
          <br />
          Contact Trust & Safety if you need access.
        </p>
      </div>
    </div>
  );
}
