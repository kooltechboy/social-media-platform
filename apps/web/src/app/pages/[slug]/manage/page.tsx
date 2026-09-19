import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, createSupabaseServerClient } from '../../../../lib/supabase/server';
import { fetchBusinessPageAction } from '../../../../lib/business/actions';
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

  const { business, products } = await fetchBusinessPageAction(slug);

  if (!business) {
    notFound();
  }

  // Security authorization: Only the owner can access this management console
  if (business.owner_id !== user.id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl font-bold">
          🛡️
        </div>
        <h1 className="text-xl font-black">Access Denied</h1>
        <p className="text-xs text-brand-sandstone/70 max-w-sm">
          You do not have administrative ownership of this Page.
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

  // Fetch follower count
  let followerCount = 0;
  const supabase = await createSupabaseServerClient();
  if (supabase && business.owner_id) {
    const { data: countRow } = await supabase
      .from('profile_counts')
      .select('followers_count')
      .eq('id', business.owner_id)
      .maybeSingle();
    followerCount = countRow?.followers_count || 0;
  }

  return (
    <PageManagementClient
      business={business}
      products={products || []}
      followerCount={followerCount}
      currentUser={user}
    />
  );
}
