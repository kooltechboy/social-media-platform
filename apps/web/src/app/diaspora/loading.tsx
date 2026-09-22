import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function DiasporaLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <Skeleton className="w-48 h-6 rounded-full mx-auto" />
        <Skeleton className="w-80 h-10 rounded-2xl mx-auto" />
        <Skeleton className="w-full h-4 rounded-lg" />
      </div>

      {/* Diaspora Metro Hubs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-3xl bg-brand-dusk/60 border border-slate-800 space-y-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-24 h-5 rounded-lg" />
            <Skeleton className="w-32 h-3 rounded" />
          </div>
        ))}
      </div>

      {/* Combinations Grid */}
      <div className="space-y-4">
        <Skeleton className="w-48 h-6 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="w-full h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
