'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@caribbean/ui';
import * as Sentry from '@sentry/nextjs';

export default function RootError({
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

  const eventId = Sentry.lastEventId();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-brand-sandstone">
      <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-brand-sandstone">Something went wrong</h2>
        <p className="text-xs text-brand-sandstone/60 leading-relaxed">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        {eventId && (
          <p className="text-[10px] text-brand-sandstone/40 font-mono mt-2" data-sentry-event-id={eventId}>
            Error ID: {eventId}
          </p>
        )}
        <div className="pt-2 flex justify-center">
          <Button variant="primary" onClick={() => reset()} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
