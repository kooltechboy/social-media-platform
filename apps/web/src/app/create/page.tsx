import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/supabase/server';
import CreateHubClient from '../../components/create-hub-client';

export const dynamic = 'force-dynamic';

export default async function CreateHubPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?next=/create');
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto">
      <CreateHubClient
        user={
          user
            ? {
                id: user.id,
                displayName: user.displayName,
                username: user.username,
                avatarUrl: user.avatarUrl,
              }
            : null
        }
      />
    </div>
  );
}

