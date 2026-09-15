import React, { Suspense } from 'react';
import { getCurrentUser } from '../../lib/supabase/server';
import SoundsDirectoryClient from '../../components/sounds/sounds-directory-client';
import { fetchSoundsAction } from '../../lib/sounds/actions';

export const dynamic = 'force-dynamic';

export default async function SoundsPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; search?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const [user, initialSounds] = await Promise.all([
    getCurrentUser(),
    fetchSoundsAction({ query: resolvedParams.search }),
  ]);

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      <Suspense
        fallback={
          <div className="w-full flex items-center justify-center p-20">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SoundsDirectoryClient
          initialSounds={initialSounds}
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
