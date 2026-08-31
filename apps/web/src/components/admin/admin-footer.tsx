'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Lock, Activity, Globe } from 'lucide-react';

interface AdminFooterProps {
  systemRole?: string;
  showDetails?: boolean;
}

export function AdminFooter({ systemRole = 'Administrator', showDetails = true }: AdminFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0D0B14] border-t border-slate-800/80 text-brand-sandstone/70 mt-12 py-10 px-4 sm:px-8 select-none">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left: Official Dark Footer Logo (Image 2) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <Link href="/" className="inline-block transition-transform hover:scale-105" aria-label="TUKUBI Home">
            <div className="relative inline-flex items-center justify-center p-1.5 rounded-xl bg-[#2B2739]/60 border border-white/10 shadow-lg">
              <Image
                src="/brand/tukubi-footer-dark.png"
                alt="TUKUBI — The Caribbean Connected."
                width={160}
                height={64}
                className="object-contain"
              />
            </div>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-brand-sandstone">
              <ShieldCheck className="w-4 h-4 text-brand-caribbeanSea" />
              <span>TUKUBI Operations &amp; Trust Control Center</span>
            </div>
            <p className="text-[11px] text-brand-sandstone/50 max-w-sm">
              Secured under Caribbean digital governance. Double-entry financial audit &amp; RLS cryptographic isolation active.
            </p>
          </div>
        </div>

        {/* Center/Right: System Status & Links */}
        <div className="flex flex-col sm:flex-row items-center gap-6 text-xs text-brand-sandstone/60">
          <div className="flex items-center gap-4 text-[11.5px]">
            <Link href="/admin" className="hover:text-brand-caribbeanSea transition-colors">
              Admin Console
            </Link>
            <span>•</span>
            <Link href="/moderation" className="hover:text-brand-caribbeanSea transition-colors">
              Moderation
            </Link>
            <span>•</span>
            <Link href="/moderator/signup" className="hover:text-brand-goldenHour transition-colors font-medium">
              Moderator Portal
            </Link>
            <span>•</span>
            <Link href="/admin/audit-logs" className="hover:text-brand-caribbeanSea transition-colors">
              Audit Logs
            </Link>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Systems Normal</span>
          </div>
        </div>
      </div>

      {/* Bottom Sub-row */}
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-brand-sandstone/40">
        <p>&copy; {currentYear} TUKUBI Network Inc. All rights reserved. Restrictive access policy.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-brand-goldenHour" /> Role: {systemRole}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-brand-caribbeanSea" /> Caribbean Digital Ecosystem
          </span>
        </div>
      </div>
    </footer>
  );
}
