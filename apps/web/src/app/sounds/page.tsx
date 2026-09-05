import React, { Suspense } from 'react';
import { getCurrentUser } from '../../lib/supabase/server';
import SoundsDirectoryClient from '../../components/sounds/sounds-directory-client';

export const dynamic = 'force-dynamic';

export default async function SoundsPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; search?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto">
      <Suspense
        fallback={
          <div className="w-full flex items-center justify-center p-20">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SoundsDirectoryClient
          initialTrackId={resolvedParams.id}
          initialQuery={resolvedParams.search}
          user={
            user
              ? {
                  id: user.id,
                  displayName: user.displayName,
                  username: user.username,
                }
              : null
          }
        />
      </Suspense>
    </div>
  );
}
