import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function NotificationsLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <Skeleton className="w-48 h-8 rounded-2xl" />
          <Skeleton className="w-32 h-4 rounded-lg" />
        </div>
        <Skeleton className="w-28 h-8 rounded-xl" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 pb-2 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-24 h-9 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Notifications List */}
      <div className="rounded-3xl bg-brand-dusk/60 border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="p-4 flex items-start gap-4">
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="w-3/4 h-4 rounded" />
              <Skeleton className="w-1/2 h-3 rounded" />
            </div>
            <Skeleton className="w-2 h-2 rounded-full shrink-0 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
