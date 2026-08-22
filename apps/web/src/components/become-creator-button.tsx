'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

export default function BecomeCreatorClientButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handle = () => {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      await supabase.from('creator_accounts').insert({
        profile_id: user.id,
        kyc_status: 'unverified',
        payout_threshold_minor: 5000,
      });
      router.refresh();
    });
  };

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
    >
      {pending ? 'Setting up…' : 'Set Up Creator Studio'}
    </button>
  );
}
