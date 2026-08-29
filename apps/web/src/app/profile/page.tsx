import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProfileRedirectPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(`/profile/${user.username}`);
  }
  redirect('/login?next=/profile');
}
