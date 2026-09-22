import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-slate-800">
        <Skeleton className="w-48 h-8 rounded-2xl" />
        <Skeleton className="w-80 h-4 rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-28 h-10 rounded-2xl shrink-0" />
        ))}
      </div>

      {/* Settings Form Card */}
      <div className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="space-y-2 pb-4 border-b border-slate-800/60">
          <Skeleton className="w-40 h-6 rounded-xl" />
          <Skeleton className="w-64 h-3 rounded" />
        </div>

        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-slate-800/40">
            <div className="space-y-1">
              <Skeleton className="w-44 h-4 rounded" />
              <Skeleton className="w-64 h-3 rounded" />
            </div>
            <Skeleton className="w-32 sm:w-48 h-10 rounded-xl" />
          </div>
        ))}

        <div className="pt-4 flex justify-end">
          <Skeleton className="w-36 h-11 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
