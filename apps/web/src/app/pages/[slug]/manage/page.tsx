import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '../../../../lib/supabase/server';
import { fetchPageDetailsAction } from '../../../../lib/pages/actions';
import PageManagementClient from './page-management-client';

export const dynamic = 'force-dynamic';

export default async function PageManageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/pages/${slug}/manage`);
  }

  const pageData = await fetchPageDetailsAction(slug);

  if (!pageData.page || pageData.error) {
    notFound();
  }

  // Security authorization: Only Owner or Admin can access management console
  if (!pageData.canManage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl font-bold">
          🛡️
        </div>
        <h1 className="text-xl font-black">Access Denied</h1>
        <p className="text-xs text-brand-sandstone/70 max-w-sm">
          You must be an Owner or Administrator of this Page to access the management dashboard.
        </p>
        <Link
          href={`/pages/${slug}`}
          className="bg-white/10 hover:bg-white/15 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-colors"
        >
          Return to Page
        </Link>
      </div>
    );
  }

  return (
    <PageManagementClient
      business={pageData.page}
      products={pageData.products || []}
      members={pageData.members || []}
      followerCount={pageData.followerCount}
      currentUserRole={pageData.currentUserRole || 'admin'}
      currentUser={user}
    />
  );
}
