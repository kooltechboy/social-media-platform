'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Globe, AlertCircle } from 'lucide-react';
import { GatewayShell } from '../../../components/gateway/GatewayShell';
import { TukubiCulturalPassport } from '../../../components/gateway/TukubiCulturalPassport';
import { getSignupSession, clearSignupSession, type SignupState } from '../../../lib/auth/signup-session';
import { completeFullRegistrationAction } from '../../../lib/auth/actions';

interface TaskStatus {
  label: string;
  status: 'pending' | 'in-progress' | 'complete';
}

export default function SignupCompletePage() {
  const router = useRouter();
  const [session, setSession] = useState<SignupState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [setupTasks, setSetupTasks] = useState<TaskStatus[]>([
    { label: 'Minting cryptographic Tukubi Cultural Passport', status: 'in-progress' },
    { label: 'Connecting origin roots to global Caribbean diaspora graph', status: 'pending' },
    { label: 'Initializing SpotPay multi-currency ledger & zero-fee corridors', status: 'pending' },
    { label: 'Calibrating cultural Home Feed & CaribAI recommendation matrix', status: 'pending' },
  ]);

  useEffect(() => {
    const data = getSignupSession();
    if (!data.email || !data.password || !data.username) {
      router.replace('/signup');
      return;
    }
    setSession(data);

    async function executeRegistration() {
      try {
        const res = await completeFullRegistrationAction({
          email: data.email!,
          password: data.password!,
          username: data.username!,
          displayName: data.displayName || data.username!,
          accountType: (data.intent as any) || 'personal',
          originCountryIso: data.originCountryIso,
          isDiaspora: data.isDiaspora,
          diasporaCountryIso: data.diasporaCountryIso,
          interests: data.interests || [],
        });

        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }

        // Animate task progression smoothly
        setTimeout(() => {
          setSetupTasks((prev) => [
            { ...prev[0], status: 'complete' },
            { ...prev[1], status: 'in-progress' },
            prev[2],
            prev[3],
          ]);
        }, 500);

        setTimeout(() => {
          setSetupTasks((prev) => [
            prev[0],
            { ...prev[1], status: 'complete' },
            { ...prev[2], status: 'in-progress' },
            prev[3],
          ]);
        }, 1100);

        setTimeout(() => {
          setSetupTasks((prev) => [
            prev[0],
            prev[1],
            { ...prev[2], status: 'complete' },
            { ...prev[3], status: 'in-progress' },
          ]);
        }, 1700);

        setTimeout(() => {
          setSetupTasks((prev) => [
            prev[0],
            prev[1],
            prev[2],
            { ...prev[3], status: 'complete' },
          ]);
          setIsSuccess(true);
          setLoading(false);
          clearSignupSession();
        }, 2300);
      } catch (err: any) {
        setError(err?.message || 'Failed to complete registration');
        setLoading(false);
      }
    }

    executeRegistration();
  }, [router]);

  return (
    <GatewayShell activeIslandIso={session?.originCountryIso}>
      <div className="bg-[#0C1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden text-center">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-brand-caribbeanSea/40 to-transparent" />

        {error ? (
          <div className="space-y-4 py-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Registration Note</h2>
              <p className="text-xs text-rose-300 max-w-sm mx-auto leading-relaxed">{error}</p>
            </div>

            <div className="pt-3 flex flex-col gap-2">
              <Link
                href="/signup/account"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white transition-colors text-center"
              >
                Review Account Details
              </Link>
              <Link
                href="/login"
                className="text-xs text-brand-sandstone/60 hover:text-white transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {isSuccess ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                  <Sparkles className="w-3 h-3 text-brand-goldenHour" />
                  <span>Passport Issued & Activated</span>
                </div>

                {/* The Issued Cultural Passport */}
                <TukubiCulturalPassport
                  displayName={session?.displayName || `${session?.firstName} ${session?.lastName}`}
                  username={session?.username}
                  originCountryName={session?.originCountryName || 'Caribbean'}
                  originCountryIso={session?.originCountryIso || 'TKB'}
                  originFlag={session?.originFlag || '🌴'}
                  diasporaCountryName={session?.diasporaCountryName || (session?.isDiaspora ? 'Global Diaspora' : 'Caribbean Basin')}
                  diasporaFlag={session?.diasporaFlag || '🌎'}
                  accountType={session?.intent ? `${session.intent.toUpperCase()} MEMBER` : 'MEMBER'}
                  interestsCount={session?.interests?.length || 5}
                />

                <div className="space-y-1 pt-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Welcome to TUKUBI.
                  </h2>
                  <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto">
                    Your Caribbean is ready. One community, one culture, one digital home.
                  </p>
                </div>

                <div className="pt-3">
                  <Link
                    href="/"
                    className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wider bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-[#060A12] hover:opacity-95 active:scale-[0.99] transition-all shadow-xl shadow-brand-caribbeanSea/30 flex items-center justify-center gap-2"
                  >
                    <span>ENTER YOUR HOME FEED</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {/* Progress Animation */}
                <div className="relative w-20 h-20 mx-auto my-2">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral blur-xl opacity-75 animate-pulse" />
                  <div className="relative w-full h-full rounded-full bg-[#080D18] border-2 border-brand-caribbeanSea flex items-center justify-center shadow-inner">
                    <span className="text-3xl animate-spin">
                      ✨
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-brand-caribbeanSea/15 text-brand-caribbeanSea border border-brand-caribbeanSea/30 inline-block">
                    Fortune-100 Provisioning
                  </span>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    Personalizing your Tukubi…
                  </h2>
                  <p className="text-xs text-brand-sandstone/70 max-w-sm mx-auto">
                    Establishing your cultural graph, SpotPay wallet, and curated recommendations.
                  </p>
                </div>

                {/* Checklist items */}
                <div className="space-y-2.5 bg-[#080D18] border border-white/10 p-4 rounded-2xl text-left">
                  {setupTasks.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      {t.status === 'complete' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {t.status === 'in-progress' && (
                        <span className="w-4 h-4 border-2 border-brand-caribbeanSea border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      )}
                      {t.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                      )}
                      <span
                        className={`${
                          t.status === 'complete'
                            ? 'text-brand-sandstone font-medium'
                            : t.status === 'in-progress'
                            ? 'text-white font-bold'
                            : 'text-brand-sandstone/40'
                        }`}
                      >
                        {t.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GatewayShell>
  );
}
