import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function ExploreLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start w-full animate-pulse">
      <div className="flex-1 min-w-0 space-y-6 w-full max-w-[820px] xl:max-w-[860px] mx-auto lg:mx-0 p-4 sm:p-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <Skeleton className="w-48 h-8 rounded-2xl" />
          <Skeleton className="w-72 h-4 rounded-xl" />
        </div>

        {/* Territory Tags Scroll Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="w-24 h-9 rounded-xl flex-shrink-0" />
          ))}
        </div>

        {/* Content Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-full h-52 rounded-3xl" />
          ))}
        </div>
      </div>

      {/* Right Rail Skeleton (desktop) */}
      <div className="hidden lg:block w-80 space-y-6 p-4">
        <Skeleton className="w-full h-48 rounded-3xl" />
        <Skeleton className="w-full h-64 rounded-3xl" />
      </div>
    </div>
  );
}
