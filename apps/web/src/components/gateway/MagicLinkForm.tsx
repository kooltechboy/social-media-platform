'use client';

import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

interface MagicLinkFormProps {
  onBackToPassword: () => void;
}

export function MagicLinkForm({ onBackToPassword }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase client failed to load');

      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (magicLinkError) {
        setError(magicLinkError.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-full bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/40 flex items-center justify-center mx-auto text-brand-sunriseCoral">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Check your inbox</h3>
          <p className="text-xs text-brand-sandstone/70 max-w-xs mx-auto">
            We sent a secure login link to <span className="text-brand-caribbeanSea font-semibold">{email}</span>. Click the link in the email to instantly sign in.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-xs text-brand-sandstone/60 hover:text-white underline underline-offset-2 transition-colors"
          >
            Use a different email address
          </button>
          <button
            type="button"
            onClick={onBackToPassword}
            className="text-xs text-brand-caribbeanSea hover:text-brand-goldenHour transition-colors font-semibold"
          >
            ← Back to password sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendMagicLink} className="space-y-4 animate-fadeIn" noValidate>
      <div className="space-y-1">
        <label htmlFor="magic-email" className="block text-xs font-semibold text-brand-sandstone/80">
          Email address
        </label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
          <input
            id="magic-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#0C1322] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/30 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-brand-caribbeanSea/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Send Magic Link</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onBackToPassword}
          className="text-xs text-brand-sandstone/60 hover:text-white transition-colors"
        >
          Sign in with password instead
        </button>
      </div>
    </form>
  );
}
