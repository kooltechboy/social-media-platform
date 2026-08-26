import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/supabase/server';
import { AntiliaMasterGateway } from '../../components/gateway/AntiliaMasterGateway';

export const metadata: Metadata = {
  title: 'ANTILIA — One Caribbean. One Community. One Digital Home.',
  description:
    'Sign in to ANTILIA — The premier digital platform connecting 59M+ Caribbean people, businesses, creators, music, and the global diaspora.',
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }

  return <AntiliaMasterGateway />;
}
