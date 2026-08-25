'use client';

import React, { useState } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

interface SocialAuthButtonsProps {
  redirectTo?: string;
  onError?: (error: string) => void;
}

export function SocialAuthButtons({ redirectTo = '/', onError }: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoadingProvider(provider);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        onError?.(error.message);
        setLoadingProvider(null);
      }
    } catch (err: any) {
      onError?.(err?.message || `Failed to initiate sign in with ${provider}`);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* ── Google Button ── */}
      <button
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuthSignIn('google')}
        aria-label="Continue with Google"
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'google' ? (
          <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      {/* ── Apple Button ── */}
      <button
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuthSignIn('apple')}
        aria-label="Continue with Apple"
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm bg-black hover:bg-neutral-900 text-white border border-neutral-800 transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'apple' ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 flex-shrink-0 fill-current" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.7-11.72-13.98-6.19-9.58-11.05-20.66-14.58-33.24-3.53-12.58-5.3-24.16-5.3-34.73 0-14.47 3.52-26.68 10.55-36.63 7.03-9.95 16.03-15.06 27.02-15.34 5.3 0 11.08 1.48 17.34 4.45 6.25 2.97 10.15 4.51 11.69 4.62 1.34 0 5.48-1.63 12.44-4.89 6.95-3.26 12.82-4.66 17.6-4.22 13.68.87 24.32 5.92 31.92 15.15-12.06 7.28-17.96 17.32-17.7 30.13.25 10.09 4.09 18.52 11.52 25.29 7.42 6.77 16.32 10.53 26.69 11.28-2.39 7.39-5.43 14.88-9.12 22.47zM119.22 31.84c0-7.29 2.62-14.15 7.85-20.59 5.23-6.44 11.83-10.45 19.8-12.04.22 1.52.33 2.93.33 4.24 0 7.39-2.76 14.48-8.28 21.26-5.52 6.78-12.21 10.74-20.07 11.88-.22-1.41-.33-2.67-.33-3.75z" />
          </svg>
        )}
        <span>Continue with Apple</span>
      </button>

      {/* ── Facebook Button ── */}
      <button
        type="button"
        disabled={!!loadingProvider}
        onClick={() => handleOAuthSignIn('facebook')}
        aria-label="Continue with Facebook"
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm bg-[#1877F2] hover:bg-[#166FE5] text-white border border-[#1877F2]/50 transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'facebook' ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 flex-shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        <span>Continue with Facebook</span>
      </button>
    </div>
  );
}
