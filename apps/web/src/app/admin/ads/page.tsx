import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Megaphone, ArrowLeft, ShieldCheck } from 'lucide-react';
import { getAuthorizedUser } from '../../../lib/supabase/server';
import AccessDenied from '../../../components/access-denied';
import AdminAdsClient from './admin-ads-client';
import { fetchPendingCampaignsForAdminAction } from '../../../lib/advertising/actions';

export const dynamic = 'force-dynamic';

export default async function AdminAdsPage() {
  const auth = await getAuthorizedUser(['admin', 'management', 'superadmin', 'super_admin', 'moderator']);
  if (!auth.isLoggedIn) {
    redirect('/login?next=/admin/ads');
  }
  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="moderator"
        currentRole={auth.role}
        resourceName="the TUKUBI Advertising Moderation Console"
      />
    );
  }

  const { campaigns, error } = await fetchPendingCampaignsForAdminAction();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/admin"
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </Link>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-brand-sunriseCoral" />
            <span>Ads Moderation & Safety</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review, verify, and approve advertiser campaigns before feed distribution across the Caribbean.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role: {auth.role}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm font-semibold">
          Error loading pending campaigns: {error}
        </div>
      )}

      {/* Interactive Client Moderation View */}
      <AdminAdsClient initialCampaigns={campaigns || []} />
    </div>
  );
}
