import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/supabase/server';
import { AntiliaMasterGateway } from '../../components/gateway/AntiliaMasterGateway';
import { sanitizeRedirectUrl } from '../../lib/auth/redirect-utils';

export const metadata: Metadata = {
  title: 'TUKUBI — One Caribbean. One Community. One Digital Home.',
  description:
    'Sign in to TUKUBI — The premier digital platform connecting 59M+ Caribbean people, businesses, creators, music, and the global diaspora.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string; redirect?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (user) {
    const rawNext = params?.next || params?.redirect;
    const safeNext = sanitizeRedirectUrl(rawNext);
    redirect(safeNext);
  }

  return <AntiliaMasterGateway />;
}
