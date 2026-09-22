import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function ProfileLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse p-4 sm:p-6">
      {/* Cover Image Skeleton */}
      <Skeleton className="w-full h-48 sm:h-64 rounded-3xl" />

      {/* Profile Header Info */}
      <div className="relative px-4 sm:px-8 space-y-4">
        {/* Avatar */}
        <div className="-mt-16 sm:-mt-20 flex justify-between items-end">
          <Skeleton className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-brand-twilight shadow-2xl shrink-0" />
          <div className="flex gap-2">
            <Skeleton className="w-28 h-10 rounded-2xl" />
            <Skeleton className="w-10 h-10 rounded-2xl" />
          </div>
        </div>

        {/* Identity Details */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-48 h-7 rounded-xl" />
            <Skeleton className="w-20 h-5 rounded-full" />
          </div>
          <Skeleton className="w-32 h-4 rounded-lg" />
          <Skeleton className="w-full max-w-lg h-12 rounded-xl" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-24 h-4 rounded" />
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex gap-2 pb-2 overflow-x-auto border-b border-slate-800">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-24 h-10 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Profile Posts Feed */}
      <div className="space-y-4 max-w-2xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="w-36 h-4 rounded" />
                <Skeleton className="w-20 h-3 rounded" />
              </div>
            </div>
            <Skeleton className="w-full h-16 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
