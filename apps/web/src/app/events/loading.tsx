import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function EventsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-2">
          <Skeleton className="w-56 h-8 rounded-2xl" />
          <Skeleton className="w-80 h-4 rounded-xl" />
        </div>
        <Skeleton className="w-36 h-10 rounded-2xl" />
      </div>

      {/* Island / Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="w-28 h-9 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Featured Event Banner */}
      <Skeleton className="w-full h-64 sm:h-80 rounded-3xl" />

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-4 space-y-3">
            <Skeleton className="w-full h-44 rounded-2xl" />
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-5 rounded-md" />
              <Skeleton className="w-24 h-4 rounded" />
            </div>
            <Skeleton className="w-4/5 h-6 rounded-lg" />
            <Skeleton className="w-2/3 h-4 rounded" />
            <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
              <Skeleton className="w-20 h-4 rounded" />
              <Skeleton className="w-24 h-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
