'use client';

import React, { useTransition, useState } from 'react';
import { setupCreatorAccountAction } from '../lib/creator/actions';

export default function BecomeCreatorClientButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handle = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await setupCreatorAccountAction();
        if (result?.error) {
          setError(result.error);
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setError(err.message || 'An unexpected error occurred');
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handle}
        disabled={pending}
        className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        {pending ? 'Setting up…' : 'Set Up Creator Studio'}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>
      )}
    </div>
  );
}
