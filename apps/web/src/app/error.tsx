'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@caribbean/ui';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-slate-100">
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-white">Something went wrong</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <div className="pt-2 flex justify-center">
          <Button variant="primary" onClick={() => reset()} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
