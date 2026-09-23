import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FeedsPageProps {
  searchParams?: Promise<{ mode?: string; filter?: string; tab?: string; cursor?: string }>;
}

/**
 * FeedsPage — Canonical Home Consolidation.
 * Home (/) is the single canonical social feed destination in TUKUBI.
 * Legacy /feeds route redirects permanently to Home with appropriate tab filter.
 */
export default async function FeedsPage(props: FeedsPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const rawMode = searchParams?.tab || searchParams?.filter || searchParams?.mode;

  if (rawMode && rawMode !== 'for_you' && rawMode !== 'for-you' && rawMode !== 'foryou') {
    const slug = rawMode.toLowerCase().replace(/_/g, '-');
    redirect(`/?tab=${encodeURIComponent(slug)}`);
  }

  redirect('/');
}
