'use client';

import React, { useState, useTransition } from 'react';

interface Props {
  flagKey: string;
  enabled: boolean;
  description: string | null;
}

export default function AdminFlagToggle({ flagKey, enabled: initialEnabled, description }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handle = () => {
    const next = !enabled;
    startTransition(async () => {
      try {
        const res = await fetch('/api/flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: flagKey, enabled: next }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError((body as { error?: string }).error ?? 'Update failed.');
        } else {
          setEnabled(next);
          setError(null);
        }
      } catch {
        setError('Network error.');
      }
    });
  };

  return (
    <div className="bg-brand-dusk/70 border border-slate-800 hover:border-slate-700 rounded-2xl px-5 py-3 flex items-center justify-between gap-4 transition-colors">
      <div className="flex-1 min-w-0">
        <code className="text-sm text-slate-200">{flagKey}</code>
        {description && (
          <p className="text-[11px] text-brand-sandstone/40 mt-0.5 truncate">{description}</p>
        )}
        {error && <p className="text-[11px] text-rose-400 mt-0.5">{error}</p>}
      </div>
      <button
        onClick={handle}
        disabled={pending}
        aria-pressed={enabled}
        aria-label={`Toggle ${flagKey}`}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 flex-shrink-0 ${
          enabled ? 'bg-brand-sunriseCoral' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
