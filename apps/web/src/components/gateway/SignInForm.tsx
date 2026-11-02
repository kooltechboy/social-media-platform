'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { SocialAuthButtons } from './SocialAuthButtons';
import { MagicLinkForm } from './MagicLinkForm';
import { signInAction } from '../../lib/auth/actions';
import { useTranslation } from '@caribbean/localization';

export function SignInForm() {
  const { t } = useTranslation();
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
      setErrorMessage('Please provide both email/phone and password.');
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
        if (err?.digest?.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrorMessage(err?.message || 'Authentication failed. Please verify your credentials.');
      }
    });
  };

  return (
    <div className="bg-[#0A1728]/80 backdrop-blur-2xl border border-cyan-400/25 rounded-[28px] p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_40px_rgba(0,194,168,0.12)] relative overflow-hidden">
      {/* Top subtle cyan glow edge */}
      <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#00E5C9]/60 to-transparent" />

      {/* Heading */}
      <div className="mb-6 text-left">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {t('auth.welcome_back') || 'Welcome back'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300/80 mt-1.5 font-normal">
          Sign in to TUKUBI — The Caribbean Connected.
        </p>
      </div>

      {authMode === 'magic_link' ? (
        <MagicLinkForm onBackToPassword={() => setAuthMode('password')} />
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate aria-describedby={errorMessage ? 'signin-error-banner' : undefined}>
          {/* Email / Phone Field */}
          <div className="space-y-1.5">
            <label htmlFor="signin-email" className="block text-xs font-semibold text-slate-200">
              Email or phone
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="signin-email"
                name="email"
                type="text"
                required
                autoComplete="username email tel"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="danieljwilliams2401@gmail.com"
                aria-invalid={errorMessage ? 'true' : 'false'}
                className="w-full bg-[#07111E]/90 border border-white/15 focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400/70 transition-all focus:outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="signin-password" className="block text-xs font-semibold text-slate-200">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#00C2A8] hover:text-[#38BDF8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2A8] rounded-md px-1"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
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
                className="w-full bg-[#07111E]/90 border border-white/15 focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/30 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-400/70 tracking-widest transition-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2A8] rounded-lg p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Magic Link Switcher */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-[#07111E] text-[#00C2A8] accent-[#00C2A8] focus:ring-[#00C2A8]/40"
              />
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors font-medium">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={() => setAuthMode('magic_link')}
              className="text-xs text-slate-300 hover:text-[#00C2A8] transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2A8] rounded-md px-1"
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
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold tracking-wider text-[#06101E] bg-gradient-to-r from-[#00C2A8] via-[#00D2B8] to-[#00E5C9] hover:brightness-110 shadow-[0_0_25px_rgba(0,194,168,0.45)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer mt-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-[#06101E] border-t-transparent rounded-full animate-spin" />
                <span>SIGNING IN…</span>
              </>
            ) : (
              <>
                <span>SIGN IN</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
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
          <span className="bg-[#0A1728] px-3 text-slate-400 font-semibold tracking-widest text-[11px]">
            OR
          </span>
        </div>
      </div>

      {/* ── Social OAuth Buttons ── */}
      <SocialAuthButtons onError={(err) => setErrorMessage(err)} />

      {/* ── Create Account Link ── */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-300">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-bold text-[#00C2A8] hover:text-[#00E5C9] hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2A8] rounded-md px-1 transition-colors"
          >
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
