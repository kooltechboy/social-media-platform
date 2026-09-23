import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FeedsTabRouteProps {
  params: Promise<{ tab: string }>;
  searchParams?: Promise<{ cursor?: string }>;
}

/**
 * FeedsTabRoute — Permanent Redirect to Canonical Home with Filter (/?tab=[tab])
 *
 * Directs segmented feed tabs (e.g. /feeds/friends, /feeds/following,
 * /feeds/communities, /feeds/caribbean) to Home views.
 */
export default async function FeedsTabRoute(props: FeedsTabRouteProps) {
  const { tab } = await props.params;

  if (tab && tab !== 'for_you' && tab !== 'for-you') {
    redirect(`/?tab=${encodeURIComponent(tab)}`);
  }

  redirect('/');
}
