import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserPlus, Shield, ArrowLeft } from 'lucide-react';
import { getAuthorizedUser } from '../../../../lib/supabase/server';
import AccessDenied from '../../../../components/access-denied';
import StaffCreateForm from '../../../../components/admin/staff-create-form';

export const dynamic = 'force-dynamic';

export default async function CreateAdministratorPage() {
  const auth = await getAuthorizedUser(['super_admin', 'superadmin', 'management', 'admin']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/admin/administrators/new');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="admin"
        currentRole={auth.role}
        resourceName="Create Administrator / Staff"
      />
    );
  }

  const isSuperAdmin =
    auth.role === 'super_admin' || auth.role === 'superadmin' || auth.role === 'management';

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/administrators"
              className="text-brand-sandstone/50 hover:text-brand-sandstone transition-colors p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-extrabold text-brand-sandstone flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-brand-caribbeanSea" /> Create Administrator / Staff
            </h1>
          </div>
          <p className="text-xs text-brand-sandstone/60 mt-1 ml-7">
            Provision real Supabase Auth accounts and enforce server-side RBAC authorization.
          </p>
        </div>

        <Link
          href="/admin/administrators"
          className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone"
        >
          ← Back to Staff Directory
        </Link>
      </div>

      <StaffCreateForm isCallerSuperAdmin={isSuperAdmin} />
    </div>
  );
}
