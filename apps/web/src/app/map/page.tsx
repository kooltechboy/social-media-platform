import React, { Suspense } from 'react';
import InteractiveCaribbeanMap from '../../components/map/interactive-caribbean-map';

export const dynamic = 'force-dynamic';

export default function CaribbeanMapDiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-brand-caribbeanSea border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-brand-sandstone/60 font-semibold tracking-wider uppercase">
              Loading Caribbean Geospatial Discovery Map…
            </p>
          </div>
        </div>
      }
    >
      <InteractiveCaribbeanMap />
    </Suspense>
  );
}
