'use client';

import React, { useState, useTransition } from 'react';
import { toggleFeatureFlagAction, type FeatureFlagUpdateState } from '../lib/admin/actions';

interface Props {
  flagKey: string;
  enabled: boolean;
  description: string | null;
}

const INITIAL: FeatureFlagUpdateState = { error: null, success: null };

export default function FeatureFlagToggle({ flagKey, enabled: initialEnabled, description }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  const handle = () => {
    const next = !enabled;
    const formData = new FormData();
    formData.set('flagKey', flagKey);
    formData.set('enabled', String(next));
    startTransition(() => {
      void toggleFeatureFlagAction(INITIAL, formData).then((result) => {
        if (!result.error) setEnabled(next);
      });
    });
  };

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="flex items-center justify-between bg-brand-twilight border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 w-full text-left"
      aria-pressed={enabled}
      aria-label={`Toggle ${flagKey}`}
    >
      <div>
        <code className="text-xs text-slate-300">{flagKey}</code>
        {description && (
          <p className="text-[10px] text-brand-sandstone/40 mt-0.5">{description}</p>
        )}
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${
          enabled
            ? 'bg-brand-sunriseCoral/20 text-emerald-300 border-brand-sunriseCoral/30'
            : 'bg-brand-dusk text-brand-sandstone/60 border-slate-700'
        }`}
      >
        {pending ? '…' : enabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
