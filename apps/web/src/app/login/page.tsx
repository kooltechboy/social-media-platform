'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, Globe, User, Mail, Lock, AtSign, ChevronDown } from 'lucide-react';
import { signInAction, signUpAction, type AuthFormState } from '../../lib/auth/actions';

// ─── Caribbean-first country list with ISO-3 codes ────────────────────────────
const COUNTRIES_CARIBBEAN: { iso: string; name: string; flag: string }[] = [
  { iso: 'JAM', name: 'Jamaica', flag: '🇯🇲' },
  { iso: 'TTO', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { iso: 'DOM', name: 'Dominican Republic', flag: '🇩🇴' },
  { iso: 'BRB', name: 'Barbados', flag: '🇧🇧' },
  { iso: 'HTI', name: 'Haiti', flag: '🇭🇹' },
  { iso: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
  { iso: 'CUB', name: 'Cuba', flag: '🇨🇺' },
  { iso: 'PRI', name: 'Puerto Rico', flag: '🇵🇷' },
  { iso: 'GUY', name: 'Guyana', flag: '🇬🇾' },
  { iso: 'SUR', name: 'Suriname', flag: '🇸🇷' },
  { iso: 'BLZ', name: 'Belize', flag: '🇧🇿' },
  { iso: 'GRD', name: 'Grenada', flag: '🇬🇩' },
  { iso: 'LCA', name: 'Saint Lucia', flag: '🇱🇨' },
  { iso: 'ATG', name: 'Antigua & Barbuda', flag: '🇦🇬' },
  { iso: 'DMA', name: 'Dominica', flag: '🇩🇲' },
  { iso: 'VCT', name: 'St. Vincent & Grenadines', flag: '🇻🇨' },
  { iso: 'KNA', name: 'Saint Kitts & Nevis', flag: '🇰🇳' },
  { iso: 'TCA', name: 'Turks & Caicos', flag: '🇹🇨' },
  { iso: 'CYM', name: 'Cayman Islands', flag: '🇰🇾' },
  { iso: 'VIR', name: 'US Virgin Islands', flag: '🇻🇮' },
  { iso: 'MSR', name: 'Montserrat', flag: '🇲🇸' },
  { iso: 'ABW', name: 'Aruba', flag: '🇦🇼' },
  { iso: 'CUW', name: 'Curaçao', flag: '🇨🇼' },
];

const COUNTRIES_DIASPORA: { iso: string; name: string; flag: string }[] = [
  { iso: 'USA', name: 'United States', flag: '🇺🇸' },
  { iso: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { iso: 'GBR', name: 'United Kingdom', flag: '🇬🇧' },
  { iso: 'NLD', name: 'Netherlands', flag: '🇳🇱' },
  { iso: 'FRA', name: 'France', flag: '🇫🇷' },
  { iso: 'DEU', name: 'Germany', flag: '🇩🇪' },
  { iso: 'ESP', name: 'Spain', flag: '🇪🇸' },
  { iso: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  { iso: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  { iso: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { iso: 'PAN', name: 'Panama', flag: '🇵🇦' },
  { iso: 'NGA', name: 'Nigeria', flag: '🇳🇬' },
  { iso: 'GHA', name: 'Ghana', flag: '🇬🇭' },
  { iso: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { iso: 'NZL', name: 'New Zealand', flag: '🇳🇿' },
];

// ─── Password strength ────────────────────────────────────────────────────────
function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const s = Math.min(score, 4);
  const map: Record<number, { label: string; color: string }> = {
    0: { label: '', color: '' },
    1: { label: 'Weak', color: 'bg-rose-500' },
    2: { label: 'Fair', color: 'bg-amber-400' },
    3: { label: 'Good', color: 'bg-sky-400' },
    4: { label: 'Strong', color: 'bg-emerald-400' },
  };
  return { score: s, ...map[s] };
}

const INPUT_BASE =
  'w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-all';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [state, setState] = useState<AuthFormState>({ error: null, info: null });
  const [pending, startTransition] = useTransition();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [username, setUsername] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const usernameValid = username.length === 0 || /^[a-zA-Z0-9_.]{3,30}$/.test(username);

  const switchMode = useCallback((next: 'signin' | 'signup') => {
    setMode(next);
    setState({ error: null, info: null });
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setTermsAccepted(false);
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'signup' && !termsAccepted) {
      setState({ error: 'You must accept the Terms of Service to create an account.', info: null });
      return;
    }
    const formData = new FormData(event.currentTarget);
    if (mode === 'signup') {
      formData.set('password', password);
      formData.set('confirmPassword', confirmPassword);
      formData.set('username', username);
    }
    startTransition(() => {
      const action = mode === 'signin' ? signInAction : signUpAction;
      void action(state, formData).then((next) => setState(next));
    });
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            ANTILIA
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            The digital home of the Caribbean and its global diaspora.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5 backdrop-blur-xl shadow-2xl">
          {/* Mode Tabs */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="grid grid-cols-2 gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1"
          >
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                  mode === m ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {/* ── Sign-Up Only Fields ───────────────────────── */}
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    name="displayName"
                    type="text"
                    placeholder="Full name"
                    autoComplete="name"
                    maxLength={100}
                    className={`${INPUT_BASE} pl-10 pr-4`}
                  />
                </div>

                {/* @Username */}
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <AtSign className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      name="username"
                      type="text"
                      placeholder="Username (e.g. danieljwilliams)"
                      autoComplete="username"
                      minLength={3}
                      maxLength={30}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                      aria-invalid={!usernameValid}
                      className={`${INPUT_BASE} pl-10 pr-10 ${
                        username.length > 0
                          ? usernameValid
                            ? 'border-emerald-500/60 focus:border-emerald-500'
                            : 'border-rose-500/60 focus:border-rose-500'
                          : ''
                      }`}
                    />
                    {username.length > 0 && (
                      <span className="absolute right-3 pointer-events-none">
                        {usernameValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </span>
                    )}
                  </div>
                  {!usernameValid && username.length > 0 && (
                    <p className="text-[11px] text-rose-400 pl-1">
                      3–30 characters: letters, numbers, underscores, dots only.
                    </p>
                  )}
                </div>

                {/* Nationality */}
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none z-10" />
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none z-10" />
                  <select
                    name="nationality"
                    defaultValue=""
                    className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-all"
                  >
                    <option value="" disabled>
                      Nationality (optional)
                    </option>
                    <optgroup label="Caribbean Nations">
                      {COUNTRIES_CARIBBEAN.map((c) => (
                        <option key={c.iso} value={c.iso}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Diaspora Hubs">
                      {COUNTRIES_DIASPORA.map((c) => (
                        <option key={c.iso} value={c.iso}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </>
            )}

            {/* ── Shared Fields ──────────────────────────────── */}
            {/* Email */}
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                name="email"
                type="email"
                required
                placeholder="Email address"
                autoComplete={mode === 'signin' ? 'email' : 'new-email'}
                className={`${INPUT_BASE} pl-10 pr-4`}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT_BASE} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter */}
              {mode === 'signup' && password.length > 0 && (
                <div aria-live="polite" className="space-y-1 px-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          seg <= strength.score ? strength.color : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-[11px] text-slate-400">
                      Strength:{' '}
                      <span
                        className={
                          strength.score >= 3
                            ? 'text-emerald-400'
                            : strength.score === 2
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {strength.label}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            {mode === 'signup' && (
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={!passwordsMatch}
                  className={`${INPUT_BASE} pl-10 pr-20 ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-500/60'
                        : 'border-rose-500/60'
                      : ''
                  }`}
                />
                {confirmPassword.length > 0 && (
                  <span className="absolute right-11 pointer-events-none">
                    {passwordsMatch ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide' : 'Show'}
                  className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Terms Checkbox */}
            {mode === 'signup' && (
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-sky-500 flex-shrink-0"
                />
                <span className="text-[11px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                  I agree to the{' '}
                  <a href="/terms" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
                    Privacy Policy
                  </a>
                  . Caribbean identity is optional and private by default.
                </span>
              </label>
            )}

            {/* Forgot Password */}
            {mode === 'signin' && (
              <div className="text-right">
                <a
                  href="/auth/forgot-password"
                  className="text-[11px] text-slate-500 hover:text-sky-400 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            )}

            {/* Feedback */}
            {state.error && (
              <p
                role="alert"
                className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2"
              >
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {state.error}
              </p>
            )}
            {state.info && (
              <p
                role="status"
                className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                {state.info}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending || (mode === 'signup' && (!passwordsMatch || !usernameValid))}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-3 rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Please wait…
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center pt-1">
            Caribbean identity is optional and private by default. You control what is visible.
          </p>
        </div>
      </div>
    </div>
  );
}


