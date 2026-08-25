'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  AtSign,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { getSignupSession, saveSignupSession, type SignupState } from '../../../lib/auth/signup-session';

function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

  const map: Record<number, { label: string; color: string }> = {
    1: { label: 'Weak', color: 'bg-rose-500' },
    2: { label: 'Fair', color: 'bg-brand-goldenHour' },
    3: { label: 'Good', color: 'bg-brand-caribbeanSea' },
    4: { label: 'Strong (Fortune-100 Grade)', color: 'bg-emerald-400' },
  };

  return { score, ...(map[score] || { label: '', color: '' }) };
}

export default function SignupAccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<SignupState>({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Username live check state
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const s = getSignupSession();
    setSession(s);
    if (s.firstName) setFirstName(s.firstName);
    if (s.lastName) setLastName(s.lastName);
    if (s.username) setUsername(s.username);
    if (s.email) setEmail(s.email);
    if (s.phone) setPhone(s.phone);
  }, []);

  // Debounced username check
  useEffect(() => {
    if (!username.trim() || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(null);
      setUsernameSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username.trim())}`);
        const data = await res.json();
        setUsernameChecking(false);
        if (data.available) {
          setUsernameAvailable(true);
          setUsernameError(null);
          setUsernameSuggestions([]);
        } else {
          setUsernameAvailable(false);
          setUsernameError(data.error || 'This username is already taken');
          setUsernameSuggestions(data.suggestions || []);
        }
      } catch {
        setUsernameChecking(false);
        setUsernameAvailable(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const strength = calculatePasswordStrength(password);
  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    username.trim() &&
    usernameAvailable === true &&
    email.trim() &&
    password.length >= 8 &&
    passwordsMatch &&
    agreeTerms;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    saveSignupSession({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: `${firstName.trim()} ${lastName.trim()}`,
      username: username.trim().toLowerCase(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
    });

    router.push('/signup/interests');
  };

  return (
    <div
      className="min-h-screen w-full bg-[#081020] flex flex-col text-brand-sandstone relative overflow-x-hidden selection:bg-[#FF7A59]/30"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(0, 180, 216, 0.12) 0%, transparent 60%), radial-gradient(circle, rgba(0, 180, 216, 0.06) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 32px 32px',
      }}
    >
      {/* Ambient glows */}
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[400px] bg-brand-sunriseCoral/12 blur-[160px] rounded-full pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[400px] bg-brand-caribbeanSea/15 blur-[150px] rounded-full pointer-events-none" />

      {/* Top brand bar */}
      <header className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-white/10 bg-[#081020]/60 backdrop-blur-xl relative z-20">
        <Link href="/login" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral p-[1px]">
            <div className="w-full h-full bg-[#0A1428] rounded-xl flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-brand-caribbeanSea to-brand-goldenHour text-sm">
              A
            </div>
          </div>
          <span className="font-black text-lg text-white font-serif tracking-tight">ANTILIA</span>
        </Link>
        <span className="text-xs text-brand-sandstone/50 font-semibold uppercase tracking-wider">
          Step 3 of 5
        </span>
      </header>

      {/* Centered content container */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 relative z-10">
        <div className="w-full max-w-xl">
          {/* Step progress bar */}
          <div className="flex items-center gap-1.5 mb-8">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`h-[3px] rounded-full transition-all duration-500 ${
                  n < 3
                    ? 'flex-1 bg-brand-caribbeanSea'
                    : n === 3
                    ? 'flex-[2] bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral'
                    : 'flex-1 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Main Card */}
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-sunriseCoral/40 to-transparent" />

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-sunriseCoral/15 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
                  <Sparkles className="w-3 h-3 text-brand-goldenHour" />
                  <span>Personal Identity</span>
                </div>
                <Link
                  href="/signup/caribbean"
                  className="text-xs text-brand-sandstone/50 hover:text-white transition-colors"
                >
                  ← Back
                </Link>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Create your identity
              </h1>
              <p className="text-sm text-brand-sandstone/70 mt-1.5 leading-relaxed">
                Your handle is permanent. Everything else can be updated anytime.
              </p>
            </div>

            <form onSubmit={handleContinue} className="space-y-4" noValidate>
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="first-name" className="block text-xs font-semibold text-brand-sandstone/60 uppercase tracking-wider">
                    First name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                    <input
                      id="first-name"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Daniel"
                      className="w-full bg-[#080D18] border border-white/10 rounded-2xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="last-name" className="block text-xs font-semibold text-brand-sandstone/60 uppercase tracking-wider">
                    Last name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                    <input
                      id="last-name"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Williams"
                      className="w-full bg-[#080D18] border border-white/10 rounded-2xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Live @Username Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="username" className="block text-xs font-semibold text-brand-sandstone/60 uppercase tracking-wider">
                    Antilia Handle (@username)
                  </label>
                  {usernameChecking && (
                    <span className="text-[10px] text-brand-sandstone/50 animate-pulse">Checking…</span>
                  )}
                  {!usernameChecking && usernameAvailable === true && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Available
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <AtSign className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                    placeholder="danieljwilliams"
                    className={`w-full bg-[#080D18] border rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none transition-all ${
                      usernameAvailable === true
                        ? 'border-emerald-500/50 focus:border-emerald-400'
                        : usernameAvailable === false
                        ? 'border-rose-500/50 focus:border-rose-400'
                        : 'border-white/10 focus:border-brand-caribbeanSea'
                    }`}
                  />
                  <div className="absolute right-3.5 pointer-events-none">
                    {usernameAvailable === true && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {usernameAvailable === false && <XCircle className="w-4 h-4 text-rose-400" />}
                  </div>
                </div>

                {/* Suggestions if taken */}
                {usernameAvailable === false && usernameSuggestions.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-brand-sandstone/50">Suggestions:</span>
                    {usernameSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setUsername(s)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 text-brand-caribbeanSea hover:bg-brand-caribbeanSea/20 transition-colors"
                      >
                        @{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold text-brand-sandstone/60 uppercase tracking-wider">
                    Email address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full bg-[#080D18] border border-white/10 rounded-2xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-xs font-semibold text-brand-sandstone/60 uppercase tracking-wider">
                    Phone (optional)
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (876) 555-0199"
                      className="w-full bg-[#080D18] border border-white/10 rounded-2xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-brand-sandstone/60 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      className="w-full bg-[#080D18] border border-white/10 rounded-2xl pl-10 pr-9 py-3 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-brand-sandstone/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-pass" className="block text-xs font-semibold text-brand-sandstone/60 uppercase tracking-wider">
                    Confirm password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-brand-sandstone/40 pointer-events-none" />
                    <input
                      id="confirm-pass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className={`w-full bg-[#080D18] border rounded-2xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none transition-all ${
                        !passwordsMatch ? 'border-rose-500/50' : 'border-white/10 focus:border-brand-caribbeanSea'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          seg <= strength.score ? strength.color : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-[10px] text-brand-sandstone/60">
                      Strength: <span className="font-semibold text-white">{strength.label}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Terms Agreement */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-[#080D18] text-brand-caribbeanSea focus:ring-brand-caribbeanSea"
                  />
                  <span className="text-[11px] text-brand-sandstone/70 leading-relaxed group-hover:text-white transition-colors">
                    I agree to the{' '}
                    <Link href="/terms" className="text-brand-caribbeanSea underline underline-offset-2">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-brand-caribbeanSea underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    . Caribbean identity is optional & private by default.
                  </span>
                </label>
              </div>

              {/* Primary Action Button */}
              <div className="pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-widest bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-xl shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                >
                  <span>NEXT: CHOOSE CULTURAL VIBES</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-brand-sandstone/40 mt-6">
            3 / 5 — Create your identity
          </p>
        </div>
      </div>
    </div>
  );
}
