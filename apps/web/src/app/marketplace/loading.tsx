import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function MarketplaceLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <Skeleton className="w-60 h-8 rounded-2xl" />
          <Skeleton className="w-80 h-4 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-28 h-10 rounded-2xl" />
          <Skeleton className="w-32 h-10 rounded-2xl" />
        </div>
      </div>

      {/* Filter Category Bar Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="w-24 h-9 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Product Catalog Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-3 p-3 rounded-3xl bg-white/[0.03] border border-white/10">
            <Skeleton className="w-full aspect-square rounded-2xl" />
            <Skeleton className="w-3/4 h-4 rounded" />
            <Skeleton className="w-1/2 h-4 rounded" />
            <Skeleton className="w-full h-8 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
