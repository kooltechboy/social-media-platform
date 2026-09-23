import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface DiasporaPageProps {
  searchParams?: Promise<{ q?: string; hub?: string; combo?: string; tab?: string }>;
}

/**
 * DiasporaPortalPage — Redirect to Canonical Caribbean Platform (/caribbean)
 *
 * Forwards legacy diaspora bookmarks and URLs to the unified Caribbean portal.
 */
export default async function DiasporaPortalPage(props: DiasporaPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const params = new URLSearchParams();
  if (searchParams.tab) params.set('tab', searchParams.tab);
  else params.set('tab', 'gateways');
  if (searchParams.q) params.set('q', searchParams.q);
  if (searchParams.hub) params.set('geo', searchParams.hub);

  const query = params.toString();
  redirect(`/caribbean${query ? `?${query}` : ''}`);
}
