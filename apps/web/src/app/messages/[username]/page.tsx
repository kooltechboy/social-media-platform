import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username || '').trim();
  redirect(`/messages?u=${encodeURIComponent(decoded)}`);
}
