import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/supabase/server';
import { AdminFooter } from '../../components/admin/admin-footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TUKUBI — Admin Console',
  description: 'Cryptographically audited administrative command center for the TUKUBI Caribbean Ecosystem.',
};

/**
 * Defense-in-depth: Admin layout enforces authentication at the layout level.
 * Individual admin pages additionally enforce role-based authorization
 * via getAuthorizedUser(['admin', 'management', 'superadmin']).
 * This layout guard ensures the admin chrome never renders for unauthenticated visitors.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?next=/admin');
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
