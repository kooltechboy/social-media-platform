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
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="surface-header p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
              Double-Entry Ledger Verified
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              TUKUBI Financial Center
            </h1>
            <p className="text-sm sm:text-base text-brand-sandstone/80 leading-relaxed">
              Universal payment methods, connected regional Caribbean payment gateways, immutable double-entry ledger audits, and creator/merchant payout controls.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <FinancialNav />
          </div>
          <div className="lg:col-span-3 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

