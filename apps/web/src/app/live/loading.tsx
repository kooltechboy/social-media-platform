import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function LiveLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-48 h-8 rounded-2xl" />
          </div>
          <Skeleton className="w-72 h-4 rounded-xl" />
        </div>
        <Skeleton className="w-36 h-10 rounded-2xl" />
      </div>

      {/* Hero Active Broadcast */}
      <Skeleton className="w-full h-72 sm:h-96 rounded-3xl" />

      {/* Grid of Broadcasts & Replays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-4 space-y-3">
            <Skeleton className="w-full h-48 rounded-2xl" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="w-3/4 h-4 rounded" />
                <Skeleton className="w-1/2 h-3 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
