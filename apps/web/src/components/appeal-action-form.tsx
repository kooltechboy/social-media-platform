'use client';

import React, { useActionState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { resolveAppealAction, ModerationActionState } from '../lib/moderation/actions';

const initialState: ModerationActionState = {
  error: null,
  success: null,
};

export default function AppealActionForm({ caseId }: { caseId: string }) {
  const [state, formAction, pending] = useActionState(resolveAppealAction, initialState);

  if (state.success) {
    return (
      <div className="bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 rounded-xl p-3 text-center">
        <p className="text-xs font-bold text-brand-sunriseCoral">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2 pt-3 border-t border-slate-800">
      <input type="hidden" name="caseId" value={caseId} />
      <input
        type="text"
        name="rationale"
        placeholder="Reason for appeal decision..."
        maxLength={300}
        className="w-full bg-brand-twilight border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          name="decision"
          value="upheld"
          disabled={pending}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <XCircle className="w-3.5 h-3.5" /> Uphold
        </button>
        <button
          type="submit"
          name="decision"
          value="overturned"
          disabled={pending}
          className="flex-1 bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Overturn &amp; Restore
        </button>
      </div>
      {state.error && <p className="text-[11px] text-rose-400">{state.error}</p>}
    </form>
  );
}
