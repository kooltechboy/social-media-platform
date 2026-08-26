'use client';

import React, { useState, useTransition } from 'react';
import { CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

interface Props {
  caseId: string;
}

export default function ModAppealPanel({ caseId }: Props) {
  const [rationale, setRationale] = useState('');
  const [done, setDone] = useState<'upheld' | 'overturned' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDecision = (decision: 'upheld' | 'overturned') => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/moderation/appeal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId, decision, rationale: rationale.trim() || null }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((body as { error?: string }).error ?? 'Appeal decision failed.');
        } else {
          setDone(decision);
          setError(null);
        }
      } catch {
        setError('Network error. Try again.');
      }
    });
  };

  if (done) {
    return (
      <div className="bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 rounded-xl p-3 text-center space-y-1">
        <p className="text-xs font-bold text-brand-sunriseCoral capitalize">
          Appeal {done === 'overturned' ? 'Overturned (Content Restored)' : 'Upheld (Restriction Maintained)'}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-3 border-t border-slate-800">
      <input
        type="text"
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        placeholder="Appeal resolution rationale..."
        maxLength={300}
        className="w-full bg-brand-twilight border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-caribbeanSea"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handleDecision('upheld')}
          disabled={pending}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <XCircle className="w-3.5 h-3.5" /> Uphold Decision
        </button>
        <button
          onClick={() => handleDecision('overturned')}
          disabled={pending}
          className="flex-1 bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Overturn &amp; Restore
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}
