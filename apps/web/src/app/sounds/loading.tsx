import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function SoundsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-2">
          <Skeleton className="w-56 h-8 rounded-2xl" />
          <Skeleton className="w-80 h-4 rounded-xl" />
        </div>
        <Skeleton className="w-36 h-10 rounded-2xl" />
      </div>

      {/* Genre Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="w-24 h-9 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Sound Tracks List */}
      <div className="rounded-3xl bg-brand-dusk/60 border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <Skeleton className="w-48 h-4 rounded" />
                <Skeleton className="w-32 h-3 rounded" />
              </div>
            </div>
            <div className="hidden sm:block flex-1 max-w-xs mx-4">
              <Skeleton className="w-full h-6 rounded-lg" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="w-12 h-4 rounded" />
              <Skeleton className="w-28 h-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
