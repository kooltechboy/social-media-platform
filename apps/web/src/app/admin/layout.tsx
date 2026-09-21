import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser, getAuthorizedUser } from '../../lib/supabase/server';
import { AdminFooter } from '../../components/admin/admin-footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TUKUBI — Admin Console',
  description: 'Cryptographically audited administrative command center for the TUKUBI Caribbean Ecosystem.',
};

/**
 * Defense-in-depth: Admin layout enforces both authentication and role-based authorization
 * at the layout level. Non-staff users are denied access before chrome renders.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';
  if (pathname === '/admin/bootstrap' || pathname.startsWith('/admin/bootstrap/')) {
    return <>{children}</>;
  }

  const auth = await getAuthorizedUser(['admin', 'management', 'superadmin', 'super_admin']);
  if (!auth.isLoggedIn || !auth.user) {
    redirect('/login?next=/admin');
  }
  if (!auth.isAuthorized) {
    redirect('/?error=unauthorized_admin');
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone flex flex-col justify-between selection:bg-[#FF7A59]/30">
      <div className="flex-1">
        {children}
      </div>
      <AdminFooter systemRole="Administrator" />
    </div>
  );
}
