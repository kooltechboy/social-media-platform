'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { GatewayShell } from '../../components/gateway/GatewayShell';
import { updatePasswordAction } from '../../lib/auth/recovery-actions';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updatePasswordAction(password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2500);
    }
  };

  return (
    <GatewayShell>
      <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

        {success ? (
          <div className="text-center space-y-4 py-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/40 flex items-center justify-center mx-auto text-brand-sunriseCoral">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Password updated</h2>
              <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto leading-relaxed">
                Your password has been changed successfully. Redirecting you to your Caribbean home…
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-caribbeanSea text-slate-950 hover:bg-brand-goldenHour transition-colors"
              >
                Go to Home Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 flex items-center justify-center text-brand-sunriseCoral mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Choose new password</h2>
              <p className="text-xs text-brand-sandstone/60 mt-1">
                Enter your new password below. Make sure it is at least 8 characters long.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1">
                <label htmlFor="new-password" className="block text-xs font-semibold text-brand-sandstone/80">
                  New password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea focus:ring-1 focus:ring-brand-caribbeanSea/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 text-brand-sandstone/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-brand-sandstone/80">
                  Confirm new password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
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
                disabled={loading || !password}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-brand-caribbeanSea/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>UPDATE PASSWORD</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </GatewayShell>
  );
}
