'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-brand-sandstone">
      <div className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-brand-caribbeanSea/10 text-brand-caribbeanSea flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Messaging Disconnected</h2>
        <p className="text-xs text-brand-sandstone/70 leading-relaxed">
          {error.message || 'Unable to sync encrypted conversation threads. Your local message drafts remain intact.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-brand-sandstone transition-colors border border-white/10"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-caribbeanSea hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reconnect
          </button>
        </div>
      </div>
    </div>
  );
}
