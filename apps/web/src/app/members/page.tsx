import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    country?: string;
    category?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const params = new URLSearchParams();

  params.set('tab', 'discover');
  if (resolvedParams.country) params.set('country', resolvedParams.country);
  if (resolvedParams.category) params.set('category', resolvedParams.category);
  if (resolvedParams.q) params.set('q', resolvedParams.q);
  if (resolvedParams.page) params.set('page', resolvedParams.page);

  redirect(`/friends?${params.toString()}`);
}
