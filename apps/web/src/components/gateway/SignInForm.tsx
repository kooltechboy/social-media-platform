'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { SocialAuthButtons } from './SocialAuthButtons';
import { MagicLinkForm } from './MagicLinkForm';
import { signInAction } from '../../lib/auth/actions';

export function SignInForm() {
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<'password' | 'magic_link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    const formData = new FormData();
    formData.set('email', email.trim());
    formData.set('password', password);
    formData.set('rememberMe', rememberMe ? 'true' : 'false');
    formData.set('redirectTo', searchParams.get('next') || '/');

    startTransition(async () => {
      try {
        const result = await signInAction({ error: null, info: null }, formData);
        if (result?.error) {
          setErrorMessage(result.error);
        }
      } catch (err: any) {
        // In Next.js redirect throws, so if error is not a NEXT_REDIRECT, show it
        if (err?.digest?.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrorMessage(err?.message || 'Authentication failed. Please verify your credentials.');
      }
    });
  };

  return (
    <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
      {/* Top subtle glow edge */}
      <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

      {/* Heading */}
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs sm:text-sm text-brand-sandstone/70 mt-1">
          Sign in to TUKUBI — The Caribbean Connected.
        </p>
      </div>

      {authMode === 'magic_link' ? (
        <MagicLinkForm onBackToPassword={() => setAuthMode('password')} />
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate aria-describedby={errorMessage ? 'signin-error-banner' : undefined}>
          {/* Email / Phone Field */}
          <div className="space-y-1">
            <label htmlFor="signin-email" className="block text-xs font-semibold text-brand-sandstone/90">
              Email or phone
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-brand-sandstone/50 pointer-events-none" />
              <input
                id="signin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="you@example.com"
                aria-invalid={errorMessage ? 'true' : 'false'}
                className="w-full bg-[#080D18] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea focus:ring-2 focus:ring-brand-caribbeanSea/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="signin-password" className="block text-xs font-semibold text-brand-sandstone/90">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-brand-caribbeanSea hover:text-brand-goldenHour transition-colors font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea rounded-md px-1"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-brand-sandstone/50 pointer-events-none" />
              <input
                id="signin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••••••"
                aria-invalid={errorMessage ? 'true' : 'false'}
                className="w-full bg-[#080D18] border border-white/15 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea focus:ring-2 focus:ring-brand-caribbeanSea/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 text-brand-sandstone/50 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea rounded-lg p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Magic Link Switcher */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-[#080D18] text-brand-caribbeanSea focus:ring-brand-caribbeanSea/50"
              />
              <span className="text-xs text-brand-sandstone/80 group-hover:text-white transition-colors">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={() => setAuthMode('magic_link')}
              className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea rounded-md px-1"
            >
              Email magic link
            </button>
          </div>

          {/* Error Message with WCAG live region */}
          {errorMessage && (
            <div
              id="signin-error-banner"
              role="alert"
              aria-live="polite"
              className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Sign In CTA Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <span>SIGN IN</span>
            )}
          </button>
        </form>
      )}

      {/* ── Social Logins Divider ── */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0C1322] px-3 text-brand-sandstone/50 font-semibold tracking-wider">
            or
          </span>
        </div>
      </div>

      {/* ── Social OAuth Buttons ── */}
      <SocialAuthButtons onError={(err) => setErrorMessage(err)} />

      {/* ── Create Account & Explore First Links ── */}
      <div className="mt-6 pt-5 border-t border-white/10 space-y-3 text-center">
        <p className="text-xs text-brand-sandstone/80">
          New to Tukubi?{' '}
          <Link
            href="/signup"
            className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-caribbeanSea rounded-md px-1"
          >
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
