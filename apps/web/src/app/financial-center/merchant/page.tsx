import React from 'react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { Store, ShieldCheck, DollarSign, ArrowUpRight, TrendingUp, Sparkles, HelpCircle } from 'lucide-react';
import { SELLER_PLANS, Money, CommissionEngine } from '@caribbean/payments';

export const dynamic = 'force-dynamic';

export default async function MerchantFinancialPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [businessRes, subRes, snapshotsRes] = await Promise.all([
    supabase.from('businesses').select('id, name, slug, currency').eq('owner_id', user.id).maybeSingle(),
    supabase.from('business_subscriptions').select('plan_id, status, current_period_end').maybeSingle(),
    supabase.from('commission_snapshots').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(10),
  ]);

  const business = businessRes.data;
  const currentSub = subRes?.data;
  const snapshots = (snapshotsRes.data ?? []) as any[];

  const activePlanId = currentSub?.plan_id || 'business_free';
  const activePlan = SELLER_PLANS[activePlanId as keyof typeof SELLER_PLANS] || SELLER_PLANS.business_free;

  // Aggregate totals
  const totalGrossMinor = snapshots.reduce((sum, s) => sum + (s.gross_amount_minor || 0), 0);
  const totalCommissionMinor = snapshots.reduce((sum, s) => sum + (s.commission_amount_minor || 0), 0);
  const totalNetMinor = snapshots.reduce((sum, s) => sum + (s.seller_net_minor || 0), 0);

  const engine = new CommissionEngine();
  const sampleGrossMinor = 10000; // $100.00
  const sampleCalc = engine.calculate({
    grossMinor: sampleGrossMinor,
    currency: 'USD',
    sellerCategory: 'merchant',
    sellerTierCode: activePlanId === 'seller_pro' ? 'pro' : 'free',
    productType: 'physical',
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Store className="w-5 h-5 text-brand-sunriseCoral" /> Merchant Financial Center
        </h2>
        <p className="text-xs text-slate-400">
          Store sales volume, commission economics, transparent fee deductions, and net payouts.
        </p>
      </div>

      {!business ? (
        <div className="p-6 rounded-2xl bg-brand-dusk/60 border border-slate-800 text-center space-y-3">
          <h3 className="text-base font-bold text-white">Create a Caribbean Business Store</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Set up digital storefronts, accept payments in local Caribbean currencies, and manage multi-staff access.
          </p>
          <Link
            href="/pages/create"
            className="inline-block px-5 py-2.5 rounded-xl bg-brand-sunriseCoral text-slate-950 font-black text-xs hover:opacity-95"
          >
            Create Storefront →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Storefront & Plan Badge */}
          <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{business.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activePlan.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Currency: {business.currency || 'USD'} • Storefront Active</p>
            </div>
            <Link
              href="/financial-center/subscriptions"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-brand-sunriseCoral/10 hover:bg-brand-sunriseCoral/20 border border-brand-sunriseCoral/30 text-brand-sunriseCoral text-xs font-bold transition-colors"
            >
              Manage Subscription Plan
            </Link>
          </div>

          {/* Revenue & Commission Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Gross Store Sales</span>
              <div className="text-2xl font-black text-white">{new Money(totalGrossMinor, 'USD').format()}</div>
              <p className="text-[11px] text-slate-400">Total customer orders volume</p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-brand-sunriseCoral/30 space-y-1">
              <span className="text-[11px] font-bold uppercase text-brand-sunriseCoral tracking-wider">TUKUBI Commission</span>
              <div className="text-2xl font-black text-brand-sandstone">{new Money(totalCommissionMinor, 'USD').format()}</div>
              <p className="text-[11px] text-slate-400">Rate: {activePlan.commissionRateBps / 100}% on eligible items</p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-emerald-500/30 space-y-1">
              <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">Merchant Net Earnings</span>
              <div className="text-2xl font-black text-emerald-300">{new Money(totalNetMinor, 'USD').format()}</div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Double-entry ledger verified
              </p>
            </div>
          </div>

          {/* Transparent Unit Economics Illustration */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-brand-dusk to-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-goldenHour" />
                <h3 className="text-xs font-black uppercase text-brand-goldenHour tracking-wider">
                  Transparent Seller Economics (Per $100 Sale)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Current Plan: {activePlan.name}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Product Price</span>
                <span className="text-base font-black text-white">$100.00</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">TUKUBI Commission</span>
                <span className="text-base font-black text-brand-sunriseCoral">
                  -${(sampleCalc.commissionMinor / 100).toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 block">({sampleCalc.commissionRateBps / 100}%)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Payment Rail Fee</span>
                <span className="text-base font-black text-slate-300">
                  -${(sampleCalc.processingCostMinor / 100).toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 block">(2.9% + 30¢)</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-emerald-400 text-[10px] block font-bold">Seller Net Proceeds</span>
                <span className="text-base font-black text-emerald-300">
                  ${(sampleCalc.sellerNetMinor / 100).toFixed(2)}
                </span>
                <span className="text-[9px] text-emerald-400/80 block">Direct to merchant account</span>
              </div>
            </div>
            {activePlanId === 'business_free' && (
              <p className="text-[11px] text-slate-400">
                Tip: Upgrade to <strong className="text-white">Seller Pro</strong> to reduce platform sales commission to 0% and unlock unlimited listings.
              </p>
            )}
          </div>

          {/* Recent Orders with Commission Snapshots */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Recent Transactions &amp; Commission Snapshots</h3>
            {snapshots.length === 0 ? (
              <div className="p-6 rounded-2xl bg-brand-dusk/40 border border-slate-800 text-xs text-slate-400 text-center">
                No customer orders processed yet. Once customers purchase from your store, immutable commission breakdowns will appear here.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Tx ID</th>
                      <th className="p-3">Gross</th>
                      <th className="p-3">Commission</th>
                      <th className="p-3">Processing</th>
                      <th className="p-3">Seller Net</th>
                      <th className="p-3">Rule Version</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-brand-dusk/60">
                    {snapshots.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3 font-mono text-[10px] text-slate-400">{s.transaction_id.slice(0, 10)}…</td>
                        <td className="p-3 font-bold text-white">${(s.gross_amount_minor / 100).toFixed(2)}</td>
                        <td className="p-3 text-brand-sunriseCoral">-${(s.commission_amount_minor / 100).toFixed(2)}</td>
                        <td className="p-3 text-slate-400">-${(s.payment_processing_fee_minor / 100).toFixed(2)}</td>
                        <td className="p-3 font-bold text-emerald-300">${(s.seller_net_minor / 100).toFixed(2)}</td>
                        <td className="p-3 text-[10px] text-slate-400">v{s.commission_rule_version}</td>
                        <td className="p-3 text-slate-400">{new Date(s.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
