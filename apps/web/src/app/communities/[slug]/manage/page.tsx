import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '../../../../lib/supabase/server';
import { fetchCommunityAction } from '../../../../lib/communities/actions';
import CommunityManagementClient from './community-management-client';

export const dynamic = 'force-dynamic';

export default async function ManageCommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || '').trim().toLowerCase();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/communities/${decodedSlug}/manage`);
  }

  const { community, userRole } = await fetchCommunityAction(decodedSlug);

  if (!community) {
    notFound();
  }

  // Creator or Admin only
  const isCreator = community.created_by === user.id;
  const isAdmin = userRole === 'admin';

  if (!isCreator && !isAdmin) {
    notFound();
  }

  return (
    <CommunityManagementClient
      community={community}
      currentUserId={user.id}
      isCreator={isCreator}
    />
  );
}
