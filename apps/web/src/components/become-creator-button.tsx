'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

export default function BecomeCreatorClientButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handle = () => {
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { router.push('/login'); return; }
        
        const { error: insertError } = await supabase.from('creator_accounts').insert({
          profile_id: user.id,
          kyc_status: 'unverified',
          payout_threshold_minor: 5000,
        });

        if (insertError) {
          console.error('Insert error:', insertError);
          setError(insertError.message || 'Failed to set up creator account');
          return;
        }

        // Force a full router navigation to ensure Next.js clears the cache
        router.push('/creator-studio');
        router.refresh();
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
        className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        {pending ? 'Setting up…' : 'Set Up Creator Studio'}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>
      )}
    </div>
  );
}
