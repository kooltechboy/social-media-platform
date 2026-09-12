import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/supabase/server';
import CreateHubClient from '../../components/create-hub-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TUKUBI Create Hub — Universal Caribbean Content Creation',
  description: 'Publish stories, videos, podcasts, and broadcast live across the Caribbean ecosystem.',
};

export default async function CreateHubPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?next=/create');
  }

  return (
    <div className="w-full space-y-8 animate-fadeIn">
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

