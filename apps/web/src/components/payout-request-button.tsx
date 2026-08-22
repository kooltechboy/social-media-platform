'use client';

import React, { useState, useTransition } from 'react';
import { DollarSign, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { requestPayoutAction, type PayoutActionState } from '../lib/creator/actions';

interface PayoutRequestButtonProps {
  eligible: boolean;
  ineligibleReason?: string;
  netMinor: number;
}

export function PayoutRequestButton({
  eligible,
  ineligibleReason,
  netMinor,
}: PayoutRequestButtonProps) {
  const [state, setState] = useState<PayoutActionState>({ error: null });
  const [pending, startTransition] = useTransition();

  const handlePayout = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    startTransition(() => {
      void requestPayoutAction(state, formData).then(setState);
    });
  };

  return (
    <div className="space-y-3">
      {state.error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state.success && (
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 font-bold">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{state.message}</span>
        </div>
      )}

      {!state.success && (
        <form onSubmit={handlePayout} className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!eligible || pending}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" /> Request Payout ($
                {(netMinor / 100).toFixed(2)})
              </>
            )}
          </button>
          {!eligible && (
            <span className="text-[11px] text-slate-400">
              {ineligibleReason || 'Minimum $50.00 balance & verified KYC required'}
            </span>
          )}
        </form>
      )}
    </div>
  );
}
