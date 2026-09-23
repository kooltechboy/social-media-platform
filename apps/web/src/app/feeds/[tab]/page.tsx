import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FeedsTabRouteProps {
  params: Promise<{ tab: string }>;
  searchParams?: Promise<{ cursor?: string }>;
}

/**
 * FeedsTabRoute — Canonical Home Consolidation.
 * Directs /feeds/[tab] traffic to the canonical Home stream filter /?tab=[tab].
 */
export default async function FeedsTabRoute(props: FeedsTabRouteProps) {
  const { tab } = await props.params;

  if (tab && tab !== 'for-you' && tab !== 'for_you' && tab !== 'foryou') {
    const slug = tab.toLowerCase().replace(/_/g, '-');
    redirect(`/?tab=${encodeURIComponent(slug)}`);
  }

  redirect('/');
}
