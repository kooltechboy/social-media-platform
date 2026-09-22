import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function FinancialCenterLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6 w-full">
      {/* Top Banner Skeleton */}
      <div className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-56 h-6 rounded-xl" />
          <Skeleton className="w-24 h-6 rounded-full" />
        </div>
        <Skeleton className="w-96 h-4 rounded-lg" />
      </div>

      {/* Balance Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-3xl bg-brand-dusk/60 border border-slate-800 space-y-3">
            <Skeleton className="w-28 h-4 rounded-md" />
            <Skeleton className="w-40 h-8 rounded-xl" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="w-20 h-7 rounded-lg" />
              <Skeleton className="w-20 h-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Transactions & Ledger History Skeleton */}
      <div className="rounded-3xl bg-brand-dusk/60 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <Skeleton className="w-48 h-6 rounded-xl" />
          <Skeleton className="w-32 h-8 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800/40">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="w-48 h-4 rounded" />
                  <Skeleton className="w-32 h-3 rounded" />
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <Skeleton className="w-24 h-5 rounded ml-auto" />
                <Skeleton className="w-16 h-3 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
