import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../../lib/supabase/server';
import LiveHostStudio from '../../../components/live/live-host-studio';

export const dynamic = 'force-dynamic';

export default async function LiveBroadcastPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/live/broadcast');
  }

  return (
    <LiveHostStudio
      user={{
        id: user.id,
        displayName: user.displayName,
        username: user.username,
      }}
    />
  );
}
