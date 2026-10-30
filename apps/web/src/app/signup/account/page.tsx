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
  Calendar,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { GatewayShell } from '../../../components/gateway/GatewayShell';
import { StepProgress } from '../../../components/gateway/signup/StepProgress';
import { TukubiCulturalPassport } from '../../../components/gateway/TukubiCulturalPassport';
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

function calculateAgeFromDob(dobString: string): number | null {
  if (!dobString) return null;
  const parts = dobString.split('-');
  if (parts.length !== 3) return null;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  const birthDate = new Date(birthYear, birthMonth, birthDay);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
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
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

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
    if (s.dateOfBirth) setDateOfBirth(s.dateOfBirth);
    if (typeof s.marketingConsent === 'boolean') setMarketingConsent(s.marketingConsent);
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
  const userAge = calculateAgeFromDob(dateOfBirth);
  const isUnder13 = userAge !== null && userAge < 13;
  const isMinor13To17 = userAge !== null && userAge >= 13 && userAge < 18;
  const isAdult18Plus = userAge !== null && userAge >= 18;

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    username.trim() &&
    usernameAvailable === true &&
    email.trim() &&
    password.length >= 8 &&
    passwordsMatch &&
    dateOfBirth.trim() &&
    !isUnder13 &&
    agreeTerms;

  // Max date is today
  const todayDateString = new Date().toISOString().split('T')[0];

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
      dateOfBirth: dateOfBirth.trim(),
      marketingConsent,
      termsVersion: '2026.1',
      privacyVersion: '2026.1',
    });

    router.push('/signup/interests');
  };

  return (
    <GatewayShell activeIslandIso={session.originCountryIso}>
      <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

        <StepProgress currentStep={3} totalSteps={5} backHref="/signup/caribbean" />

        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Your Identity
          </h2>
          <p className="text-xs sm:text-sm text-brand-sandstone/60 mt-1">
            Your credentials generate your official Tukubi Cultural Passport.
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-3.5" noValidate>
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="first-name" className="block text-[11px] font-semibold text-brand-sandstone/80">
                First name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-3.5 h-3.5 text-brand-sandstone/40 pointer-events-none" />
                <input
                  id="first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Daniel"
                  className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="last-name" className="block text-[11px] font-semibold text-brand-sandstone/80">
                Last name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-3.5 h-3.5 text-brand-sandstone/40 pointer-events-none" />
                <input
                  id="last-name"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Williams"
                  className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                />
              </div>
            </div>
          </div>

          {/* Live @Username Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="username" className="block text-[11px] font-semibold text-brand-sandstone/80">
                Tukubi Handle (@username)
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
              <AtSign className="absolute left-3 w-3.5 h-3.5 text-brand-sandstone/40 pointer-events-none" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                placeholder="danieljwilliams"
                className={`w-full bg-[#080D18] border rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none transition-all ${
                  usernameAvailable === true
                    ? 'border-emerald-500/50 focus:border-emerald-400'
                    : usernameAvailable === false
                    ? 'border-rose-500/50 focus:border-rose-400'
                    : 'border-white/10 focus:border-brand-caribbeanSea'
                }`}
              />
              <div className="absolute right-3 pointer-events-none">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-[11px] font-semibold text-brand-sandstone/80">
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-3.5 h-3.5 text-brand-sandstone/40 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="block text-[11px] font-semibold text-brand-sandstone/80">
                Phone (optional)
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 w-3.5 h-3.5 text-brand-sandstone/40 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (876) 555-0199"
                  className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                />
              </div>
            </div>
          </div>

          {/* Date of Birth (Statutory Child Safety & Law 136-03 Compliance) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="dob" className="block text-[11px] font-semibold text-brand-sandstone/80">
                Date of Birth
              </label>
              {userAge !== null && (
                <span className="text-[10px] font-bold">
                  {isUnder13 ? (
                    <span className="text-rose-400">Under 13 ({userAge} yrs)</span>
                  ) : isMinor13To17 ? (
                    <span className="text-brand-goldenHour">Adolescent (13–17 yrs)</span>
                  ) : (
                    <span className="text-emerald-400">Adult (18+ yrs)</span>
                  )}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-3.5 h-3.5 text-brand-sandstone/40 pointer-events-none" />
              <input
                id="dob"
                type="date"
                required
                max={todayDateString}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
              />
            </div>

            {/* Child Safety Feedback */}
            {isUnder13 && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  Under Dominican Republic Law 136-03 and Child Protection standards, users under 13 require verified parental or guardian authorization. Please ask a parent or legal guardian to create an account first.
                </span>
              </div>
            )}

            {isMinor13To17 && (
              <div className="p-2 rounded-xl bg-brand-goldenHour/10 border border-brand-goldenHour/30 text-brand-goldenHour text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Adolescent account: Minor protection defaults will be applied automatically (restricted direct messaging and safe content filters).
                </span>
              </div>
            )}
          </div>

          {/* Password & Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="password" className="block text-[11px] font-semibold text-brand-sandstone/80">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-3.5 h-3.5 text-brand-sandstone/40 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  className="w-full bg-[#080D18] border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-brand-caribbeanSea transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-brand-sandstone/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="confirm-pass" className="block text-[11px] font-semibold text-brand-sandstone/80">
                Confirm password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-3.5 h-3.5 text-brand-sandstone/40 pointer-events-none" />
                <input
                  id="confirm-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className={`w-full bg-[#080D18] border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-brand-sandstone/30 focus:outline-none transition-all ${
                    !passwordsMatch ? 'border-rose-500/50' : 'border-white/10 focus:border-brand-caribbeanSea'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <div className="flex gap-1">
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

          {/* Live Passport Card Preview */}
          {(firstName || username) && (
            <div className="pt-2 animate-fadeIn">
              <p className="text-[10px] font-bold text-brand-goldenHour uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-sunriseCoral" />
                Live Tukubi Passport Preview
              </p>
              <TukubiCulturalPassport
                displayName={firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Daniel Williams'}
                username={username || 'username'}
                originCountryName={session.originCountryName || 'Caribbean'}
                originCountryIso={session.originCountryIso || 'TKB'}
                originFlag={session.originFlag || '🌴'}
                diasporaCountryName={session.diasporaCountryName || (session.isDiaspora ? 'Global Diaspora' : 'Caribbean Basin')}
                diasporaFlag={session.diasporaFlag || '🌎'}
                accountType={session.intent ? `${session.intent.toUpperCase()} MEMBER` : 'MEMBER'}
              />
            </div>
          )}

          {/* 1. Mandatory Legal Terms & Community Standards Agreement */}
          <div className="pt-2 space-y-2 border-t border-white/5">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-[#080D18] text-brand-caribbeanSea focus:ring-brand-caribbeanSea shrink-0"
              />
              <span className="text-[11px] text-brand-sandstone/70 leading-relaxed group-hover:text-white transition-colors">
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="text-brand-caribbeanSea underline underline-offset-2">
                  Terms of Service
                </Link>
                {', '}
                <Link href="/privacy" target="_blank" className="text-brand-caribbeanSea underline underline-offset-2">
                  Privacy Policy
                </Link>
                {', and '}
                <Link href="/help" target="_blank" className="text-brand-caribbeanSea underline underline-offset-2">
                  Community Standards
                </Link>
                . Caribbean identity is optional &amp; private by default.
              </span>
            </label>

            {/* 2. Optional, Unbundled Marketing & Cultural Communications Consent */}
            <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-[#080D18] text-brand-goldenHour focus:ring-brand-goldenHour shrink-0"
              />
              <span className="text-[11px] text-brand-sandstone/60 leading-relaxed group-hover:text-brand-sandstone/90 transition-colors">
                Keep me updated with Caribbean cultural highlights, creator spotlights, and community news via email (Optional).
              </span>
            </label>
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-white/10">
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-brand-caribbeanSea/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>NEXT: CHOOSE CULTURAL VIBES</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </GatewayShell>
  );
}
