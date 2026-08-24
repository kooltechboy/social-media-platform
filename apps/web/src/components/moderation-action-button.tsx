'use client';

import React, { useState, useTransition } from 'react';
import { submitModerationActionAction, type ModerationActionState, type ModerationAction } from '../lib/moderation/actions';

interface Props {
  caseId: string;
  action: ModerationAction;
}

const INITIAL: ModerationActionState = { error: null, success: null };

const ACTION_STYLES: Record<ModerationAction, string> = {
  remove: 'bg-rose-500 hover:bg-rose-400 text-slate-950',
  restrict: 'bg-brand-goldenHour hover:bg-brand-goldenHour text-slate-950',
  allow: 'bg-brand-sunriseCoral hover:bg-brand-sunriseCoral text-slate-950',
  escalate: 'bg-brand-dusk hover:bg-slate-700 text-slate-200',
};

const ACTION_LABELS: Record<ModerationAction, string> = {
  remove: 'Remove',
  restrict: 'Restrict',
  allow: 'Allow',
  escalate: 'Escalate',
};

export default function ModerationActionButton({ caseId, action }: Props) {
  const [state, setState] = useState<ModerationActionState>(INITIAL);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <span className="text-[11px] text-brand-sunriseCoral font-semibold px-3 py-1.5 rounded-xl bg-brand-sunriseCoral/10 border border-brand-sunriseCoral/20">
        {ACTION_LABELS[action]} recorded
      </span>
    );
  }

  const handle = () => {
    const formData = new FormData();
    formData.set('caseId', caseId);
    formData.set('action', action);
    startTransition(() => {
      void submitModerationActionAction(INITIAL, formData).then((result) => {
        setState(result);
        if (!result.error) setDone(true);
      });
    });
  };

  return (
    <button
      onClick={handle}
      disabled={pending}
      className={`font-bold text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50 ${ACTION_STYLES[action]}`}
      aria-label={`${ACTION_LABELS[action]} case`}
    >
      {pending ? '…' : ACTION_LABELS[action]}
    </button>
  );
}
