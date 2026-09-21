import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function CommunitiesLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full animate-pulse p-4 sm:p-6">
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[820px] mx-auto lg:mx-0">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="space-y-2">
            <Skeleton className="w-56 h-8 rounded-2xl" />
            <Skeleton className="w-72 h-4 rounded-xl" />
          </div>
          <Skeleton className="w-32 h-10 rounded-2xl" />
        </div>

        {/* Filter tags skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-28 h-9 rounded-xl flex-shrink-0" />
          ))}
        </div>

        {/* Hub Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="w-full h-44 rounded-3xl" />
          ))}
        </div>
      </div>

      {/* Right rail skeleton */}
      <div className="hidden lg:block w-80 space-y-6">
        <Skeleton className="w-full h-56 rounded-3xl" />
      </div>
    </div>
  );
}
