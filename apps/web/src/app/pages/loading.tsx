import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function PagesLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <Skeleton className="w-64 h-8 rounded-2xl" />
          <Skeleton className="w-80 h-4 rounded-xl" />
        </div>
        <Skeleton className="w-36 h-10 rounded-2xl" />
      </div>

      {/* Categories chips skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-28 h-9 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Pages Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="w-full h-56 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
