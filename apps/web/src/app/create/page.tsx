import React from 'react';
import { getCurrentUser } from '../../lib/supabase/server';
import CreateHubClient from '../../components/create-hub-client';

export const dynamic = 'force-dynamic';

export default async function CreateHubPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-6xl mx-auto">
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

