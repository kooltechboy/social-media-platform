import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/supabase/server';
import FinancialNav from '../../components/financial-center/financial-nav';

export const dynamic = 'force-dynamic';

export default async function FinancialCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?next=/financial-center');
  }

  return (
    <div className="min-h-screen bg-brand-twilight text-brand-sandstone p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              TUKUBI Financial Center
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Universal payment methods, connected providers, double-entry ledger records, and payout controls.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <FinancialNav />
          </div>
          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
