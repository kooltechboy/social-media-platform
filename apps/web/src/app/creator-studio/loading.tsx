import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function CreatorStudioLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Studio Header Skeleton */}
      <div className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-7 rounded-xl" />
            <Skeleton className="w-64 h-4 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-32 h-10 rounded-2xl" />
          <Skeleton className="w-32 h-10 rounded-2xl" />
        </div>
      </div>

      {/* Stats KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-3xl bg-brand-dusk/60 border border-slate-800 space-y-2">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-32 h-8 rounded-xl" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        ))}
      </div>

      {/* Studio Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-32 h-10 rounded-2xl shrink-0" />
        ))}
      </div>

      {/* Video & Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-4 space-y-3">
            <Skeleton className="w-full h-44 rounded-2xl" />
            <Skeleton className="w-3/4 h-5 rounded-lg" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="w-20 h-4 rounded" />
              <Skeleton className="w-16 h-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
