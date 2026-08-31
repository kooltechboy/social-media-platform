import React, { Suspense } from 'react';
import { getCurrentUser } from '../../../lib/supabase/server';
import SoundsDirectoryClient from '../../../components/sounds/sounds-directory-client';

export const dynamic = 'force-dynamic';

export default async function SoundTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-6xl mx-auto">
      <Suspense
        fallback={
          <div className="w-full flex items-center justify-center p-20">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SoundsDirectoryClient
          initialTrackId={id}
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
