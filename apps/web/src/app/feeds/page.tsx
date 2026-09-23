import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FeedsPageProps {
  searchParams?: Promise<{ mode?: string; filter?: string; tab?: string; cursor?: string }>;
}

/**
 * FeedsPage — Permanent Redirect to Canonical Home (/)
 *
 * HOME is TUKUBI's primary personalized feed destination.
 * Any legacy links, bookmarks, or API requests to /feeds are seamlessly
 * forwarded to the canonical Home feed stream, preserving tab filter context.
 */
export default async function FeedsPage(props: FeedsPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const rawMode = searchParams?.tab || searchParams?.filter || searchParams?.mode;

  if (rawMode && rawMode !== 'for_you' && rawMode !== 'for-you') {
    redirect(`/?tab=${encodeURIComponent(rawMode)}`);
  }

  redirect('/');
}
