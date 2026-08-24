'use client';

import React, { useState, useTransition } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

type ModerationAction = 'remove' | 'restrict' | 'allow' | 'escalate';

interface Props {
  caseId: string;
}

const ACTIONS: Array<{
  action: ModerationAction;
  label: string;
  style: string;
  icon: React.ReactNode;
}> = [
  {
    action: 'remove',
    label: 'Remove',
    style: 'bg-rose-500 hover:bg-rose-400 text-slate-950',
    icon: <XCircle className="w-4 h-4" />,
  },
  {
    action: 'restrict',
    label: 'Restrict',
    style: 'bg-brand-goldenHour hover:bg-brand-goldenHour text-slate-950',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    action: 'allow',
    label: 'Allow',
    style: 'bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  {
    action: 'escalate',
    label: 'Escalate',
    style: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    icon: <ArrowUpRight className="w-4 h-4" />,
  },
];

export default function ModActionPanel({ caseId }: Props) {
  const [rationale, setRationale] = useState('');
  const [done, setDone] = useState<ModerationAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleAction = (action: ModerationAction) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/moderation/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId, action, rationale: rationale.trim() || null }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((body as { error?: string }).error ?? 'Action failed.');
        } else {
          setDone(action);
          setError(null);
        }
      } catch {
        setError('Network error. Try again.');
      }
    });
  };

  if (done) {
    return (
      <div className="bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/30 rounded-2xl p-5 text-center space-y-1">
        <CheckCircle className="w-8 h-8 text-brand-sunriseCoral mx-auto" />
        <p className="text-sm font-bold text-brand-sunriseCoral capitalize">
          Action &ldquo;{done}&rdquo; recorded.
        </p>
        <p className="text-xs text-brand-sandstone/40">Next case will load on refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2 border-t border-slate-800">
      <div>
        <label htmlFor="rationale" className="text-[11px] font-semibold text-brand-sandstone/60 block mb-1">
          Rationale (optional but recommended)
        </label>
        <textarea
          id="rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Explain your decision for the audit log…"
          className="w-full bg-brand-twilight border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-caribbeanSea resize-none transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ action, label, style, icon }) => (
          <button
            key={action}
            onClick={() => handleAction(action)}
            disabled={pending}
            className={`flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50 ${style}`}
            aria-label={`${label} case`}
          >
            {icon}
            {pending ? '…' : label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
