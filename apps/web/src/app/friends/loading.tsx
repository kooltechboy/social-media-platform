import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function FriendsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-slate-800">
        <Skeleton className="w-56 h-8 rounded-2xl" />
        <Skeleton className="w-80 h-4 rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 pb-2 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-32 h-10 rounded-2xl shrink-0" />
        ))}
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-14 h-14 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="w-3/4 h-4 rounded" />
                <Skeleton className="w-1/2 h-3 rounded" />
                <Skeleton className="w-1/3 h-3 rounded" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="w-full h-9 rounded-xl" />
              <Skeleton className="w-full h-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
