import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/supabase/server';
import { AntiliaMasterGateway } from '../../components/gateway/AntiliaMasterGateway';

export const metadata: Metadata = {
  title: 'ANTILIA — One Caribbean. One Community. One Digital Home.',
  description:
    'Sign in to ANTILIA — The premier digital platform connecting 59M+ Caribbean people, businesses, creators, music, and the global diaspora.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (user) {
    const rawNext = params?.next;
    const safeNext = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
    redirect(safeNext);
  }

  return <AntiliaMasterGateway />;
}
