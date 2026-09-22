import React from 'react';
import { Skeleton } from '@caribbean/ui';

export default function ReelsLoading() {
  return (
    <div className="h-[calc(100vh-80px)] flex items-center justify-center p-2 sm:p-4 animate-pulse">
      <div className="relative w-full max-w-[420px] h-[calc(100vh-100px)] max-h-[820px] rounded-3xl bg-brand-dusk/90 border border-slate-800 overflow-hidden flex flex-col justify-end p-6">
        {/* Right Action Rail */}
        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5">
          <Skeleton className="w-11 h-11 rounded-full" />
          <div className="space-y-1 flex flex-col items-center">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-6 h-3 rounded" />
          </div>
          <div className="space-y-1 flex flex-col items-center">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-6 h-3 rounded" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full mt-2" />
        </div>

        {/* Bottom Metadata */}
        <div className="space-y-3 w-4/5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <Skeleton className="w-28 h-4 rounded" />
            <Skeleton className="w-16 h-6 rounded-full" />
          </div>
          <Skeleton className="w-full h-4 rounded" />
          <Skeleton className="w-3/4 h-4 rounded" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-40 h-3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
