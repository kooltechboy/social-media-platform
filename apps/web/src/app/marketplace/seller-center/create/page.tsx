import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Store, ShieldCheck } from 'lucide-react';
import { getCurrentUser } from '../../../../lib/supabase/server';
import CreateListingWizard from '../../../../components/marketplace/create-listing-wizard';

export const dynamic = 'force-dynamic';

export default async function CreateListingPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6 animate-fadeIn">
        <div className="surface-card border border-white/15 rounded-3xl p-8 text-center max-w-sm space-y-4 shadow-2xl">
          <Store className="w-12 h-12 text-orange-400 mx-auto" />
          <h1 className="text-xl font-black text-white">Create Marketplace Listing</h1>
          <p className="text-xs text-brand-sandstone/70">
            Sign in with your verified TUKUBI account to list merchandise and reach buyers across the islands and diaspora.
          </p>
          <Link
            href="/login?next=/marketplace/seller-center/create"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
          >
            Sign In to Sell
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Link
          href="/marketplace/seller-center"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-sandstone/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Seller Center
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-brand-sandstone/60">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>TUKUBI Verified Merchant Rules Apply</span>
        </div>
      </div>

      <CreateListingWizard />
    </div>
  );
}
