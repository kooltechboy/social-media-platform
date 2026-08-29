import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, Compass, LogIn } from 'lucide-react';
import type { SessionUser } from '../lib/supabase/server';

interface AccessDeniedProps {
  user?: SessionUser | null;
  requiredRole?: string;
  currentRole?: string;
  resourceName?: string;
}

export default function AccessDenied({
  user,
  requiredRole = 'moderator',
  currentRole = 'user',
  resourceName = 'this command console',
}: AccessDeniedProps) {
  const displayRole = (user?.role || currentRole || 'user').toUpperCase();
  const displayRequired = requiredRole.toUpperCase();

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex flex-col justify-between selection:bg-brand-sunriseCoral/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-brand-sandstone text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Tukubi
        </Link>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300">
          HTTP 403 · FORBIDDEN
        </span>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center items-center text-center">
        {/* Glow & Shield Icon */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-rose-500/20 via-brand-goldenHour/20 to-brand-caribbeanSea/20 rounded-full blur-xl opacity-70 animate-pulse" />
          <div className="relative bg-brand-dusk border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <ShieldAlert className="w-16 h-16 text-rose-400 mx-auto" />
          </div>
        </div>

        {/* Heading & Subtext */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-sandstone tracking-tight">
          Role Clearance Required
        </h1>
        <p className="mt-3 text-sm text-brand-sandstone/70 max-w-lg leading-relaxed">
          You are signed in, but your account lacks the necessary permissions to access {resourceName}.
        </p>

        {/* Account & Role Metadata Card */}
        <div className="mt-8 w-full bg-brand-dusk/70 border border-slate-800 rounded-2xl p-5 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-medium text-brand-sandstone/60">Signed-in Identity</span>
            <div className="text-right">
              <p className="text-xs font-bold text-brand-sandstone">
                {user?.displayName || 'Active Member'}
              </p>
              <p className="text-[11px] font-mono text-brand-sandstone/50">
                @{user?.username || 'member'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-brand-sandstone/50 uppercase tracking-wider block mb-1">
                Your Current Role
              </span>
              <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {displayRole}
              </span>
            </div>

            <div className="bg-[#0F172A] border border-rose-500/20 rounded-xl p-3">
              <span className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider block mb-1">
                Required Clearance
              </span>
              <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                {displayRequired}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-caribbeanSea hover:opacity-95 transition-all shadow-lg"
          >
            <Home className="w-4 h-4" /> Return to Home Feed
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-brand-sandstone bg-brand-dusk border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <Compass className="w-4 h-4" /> Explore Tukubi
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-brand-sandstone transition-colors"
          >
            <LogIn className="w-4 h-4" /> Switch Account
          </Link>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-brand-sandstone/40">
        TUKUBI Trust &amp; Safety · Every access attempt and administrative action is audited.
      </footer>
    </div>
  );
}
