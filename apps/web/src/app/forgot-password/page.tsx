'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { GatewayShell } from '../../components/gateway/GatewayShell';
import { requestPasswordResetAction } from '../../lib/auth/recovery-actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    const res = await requestPasswordResetAction(email);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSent(true);
    }
  };

  return (
    <GatewayShell>
      <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

        {sent ? (
          <div className="text-center space-y-4 py-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/40 flex items-center justify-center mx-auto text-brand-sunriseCoral">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Recovery email sent</h2>
              <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto leading-relaxed">
                If an account exists for <span className="text-brand-caribbeanSea font-semibold">{email}</span>, you will receive password reset instructions shortly.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white transition-colors text-center"
              >
                Return to sign in
              </Link>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-xs text-brand-sandstone/50 hover:text-brand-sandstone transition-colors"
              >
                Try another email
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 flex items-center justify-center text-brand-caribbeanSea mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Reset your password</h2>
              <p className="text-xs text-brand-sandstone/60 mt-1">
                Enter your verified email address and we&apos;ll send you a secure link to reset your account credentials.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1">
                <label htmlFor="recovery-email" className="block text-xs font-semibold text-brand-sandstone/80">
                  Email address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/40 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-brand-caribbeanSea/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>SEND RESET LINK</span>
                )}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-white/10">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-brand-sandstone/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </GatewayShell>
  );
}
