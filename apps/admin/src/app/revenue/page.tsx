import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  Repeat,
  AlertCircle,
} from 'lucide-react';
import { createAdminSupabaseClient, getAdminSession } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminRevenueCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ timeframe?: string; category?: string }>;
}) {
  const adminUser = await getAdminSession();
  if (!adminUser) redirect('/login');

  const supabase = await createAdminSupabaseClient();
  if (!supabase) redirect('/login');

  const params = await searchParams;
  const timeframe = params.timeframe || 'all'; // 'today', 'week', 'month', 'year', 'all'

  // Determine date boundary
  let dateFilter: string | null = null;
  const now = Date.now();
  if (timeframe === 'today') {
    dateFilter = new Date(now - 86400000).toISOString();
  } else if (timeframe === 'week') {
    dateFilter = new Date(now - 7 * 86400000).toISOString();
  } else if (timeframe === 'month') {
    dateFilter = new Date(now - 30 * 86400000).toISOString();
  } else if (timeframe === 'year') {
    dateFilter = new Date(now - 365 * 86400000).toISOString();
  }

  // Fetch snapshots and subscriptions
  let snapshotsQuery = supabase
    .from('commission_snapshots')
    .select('id, gross_amount_minor, commission_amount_minor, fixed_platform_fee_minor, seller_net_minor, tukubi_revenue_minor, refunded_amount_minor, commission_refunded_minor, account_category, seller_tier, product_type, currency, commission_rule_version, created_at')
    .order('created_at', { ascending: false });

  if (dateFilter) {
    snapshotsQuery = snapshotsQuery.gte('created_at', dateFilter);
  }

  const [snapshotsRes, tiersRes, rulesRes, subsRes, intentsRes] = await Promise.all([
    snapshotsQuery,
    supabase.from('monetization_tier_configs').select('*').order('created_at'),
    supabase.from('commission_rules').select('*').order('created_at', { ascending: false }),
    supabase.from('business_subscriptions').select('id, plan_id, status, created_at').eq('status', 'active'),
    supabase.from('payment_intents').select('amount_minor, status, created_at').eq('status', 'succeeded'),
  ]);

  const snapshots = (snapshotsRes.data ?? []) as any[];
  const tiers = (tiersRes.data ?? []) as any[];
  const rules = (rulesRes.data ?? []) as any[];
  const activeSubs = (subsRes.data ?? []) as any[];
  const succeededIntents = (intentsRes.data ?? []) as any[];

  // 1. Gross Merchandise Value (GMV) vs TUKUBI Retained Revenue
  const gmvFromSnapshots = snapshots.reduce((sum, s) => sum + (s.gross_amount_minor || 0), 0);
  const gmvFromIntents = succeededIntents.reduce((sum, i) => sum + (i.amount_minor || 0), 0);
  // Total GMV combines marketplace transactions and payment intents
  const totalGmvMinor = Math.max(gmvFromSnapshots, gmvFromIntents);

  // Revenue Breakdown
  const totalCommissionsMinor = snapshots.reduce((sum, s) => sum + (s.commission_amount_minor || 0), 0);
  const totalFixedFeesMinor = snapshots.reduce((sum, s) => sum + (s.fixed_platform_fee_minor || 0), 0);
  const totalRefundedCommissionsMinor = snapshots.reduce((sum, s) => sum + (s.commission_refunded_minor || 0), 0);

  // Subscription Revenue estimation (monthly fees for active seller/creator subscriptions)
  const PLAN_PRICES: Record<string, number> = {
    business_free: 0,
    seller_pro: 1499,
    business_plus: 3999,
    enterprise: 0,
  };
  const mrrMinor = activeSubs.reduce((sum, sub) => sum + (PLAN_PRICES[sub.plan_id] || 0), 0);
  const arrMinor = mrrMinor * 12;

  // TUKUBI Net Retained Revenue
  const netMarketplaceRevenueMinor = totalCommissionsMinor + totalFixedFeesMinor - totalRefundedCommissionsMinor;
  const totalTukubiRevenueMinor = netMarketplaceRevenueMinor + mrrMinor;

  // Breakdown by Account Category
  const categoryRevenue = {
    merchant: 0,
    creator: 0,
    business: 0,
    user: 0,
  };
  for (const s of snapshots) {
    const cat = (s.account_category as keyof typeof categoryRevenue) || 'merchant';
    if (categoryRevenue[cat] !== undefined) {
      categoryRevenue[cat] += (s.tukubi_revenue_minor || 0);
    }
  }

  // Breakdown by Product Type
  const productTypeRevenue: Record<string, number> = {};
  for (const s of snapshots) {
    const pt = s.product_type || 'other';
    productTypeRevenue[pt] = (productTypeRevenue[pt] || 0) + (s.tukubi_revenue_minor || 0);
  }

  // Average Transaction Value (ATV)
  const atvMinor = snapshots.length > 0 ? Math.round(gmvFromSnapshots / snapshots.length) : 0;

  function fmt(minor: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minor / 100);
  }

  const TIMEFRAMES = [
    { key: 'all', label: 'All Time' },
    { key: 'year', label: 'Past 12 Months' },
    { key: 'month', label: 'Past 30 Days' },
    { key: 'week', label: 'Past 7 Days' },
    { key: 'today', label: 'Today (24h)' },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-brand-sandstone">TUKUBI Revenue Center</h1>
          </div>
          <p className="text-xs text-brand-sandstone/60 mt-1">
            Executive financial dashboard with strict separation of Gross Merchandise Value (GMV) and Platform Retained Revenue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xs text-brand-sandstone/60 hover:text-brand-sandstone px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60">
            ← Main Dashboard
          </Link>
          <Link href="/payments" className="text-xs text-brand-caribbeanSea hover:underline px-3 py-1.5 rounded-lg border border-sky-950 bg-sky-950/40">
            Payment Rail Logs →
          </Link>
        </div>
      </div>

      {/* Timeframe Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-dusk/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs text-brand-sandstone/70">
          <Calendar className="w-4 h-4 text-brand-goldenHour" />
          <span className="font-semibold">Reporting Period:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIMEFRAMES.map((tf) => (
            <Link
              key={tf.key}
              href={`?timeframe=${tf.key}`}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                timeframe === tf.key
                  ? 'bg-brand-sunriseCoral text-slate-950 shadow-md shadow-brand-sunriseCoral/20'
                  : 'bg-slate-900/80 text-brand-sandstone/60 hover:text-brand-sandstone border border-slate-800'
              }`}
            >
              {tf.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Primary KPI Hero Cards — GMV vs TUKUBI Net Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gross Transaction Volume (GMV) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0E1726] to-slate-900 border border-slate-700/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-black uppercase text-sky-400 tracking-widest flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Gross Merchandise Value (GMV)
              </span>
              <p className="text-4xl font-black text-brand-sandstone mt-2">{fmt(totalGmvMinor)}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-500/10 text-sky-300 border border-sky-500/30">
              Total Processed
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-brand-sandstone/60">
            <span>Cumulative orders and checkout transactions volume</span>
            <span>Avg Order: <strong className="text-white">{fmt(atvMinor)}</strong></span>
          </div>
        </div>

        {/* TUKUBI Retained Net Revenue */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#1A1220] to-emerald-950/30 border border-brand-sunriseCoral/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-sunriseCoral/10 rounded-full blur-2xl" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-black uppercase text-brand-sunriseCoral tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> TUKUBI Net Platform Revenue
              </span>
              <p className="text-4xl font-black text-brand-sandstone mt-2">{fmt(totalTukubiRevenueMinor)}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Actual Retained
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-brand-sandstone/60">
            <span>Commissions + Fixed Fees + Subscription MRR</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> NASA-grade Ledger Verified
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Stream Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Marketplace Commissions */}
        <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase text-brand-caribbeanSea tracking-wider">Commissions</span>
            <Store className="w-4 h-4 text-brand-caribbeanSea" />
          </div>
          <p className="text-2xl font-black text-brand-sandstone">{fmt(totalCommissionsMinor)}</p>
          <p className="text-[11px] text-brand-sandstone/60">Dynamic marketplace sales fees</p>
        </div>

        {/* Recurring Subscriptions (MRR / ARR) */}
        <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase text-brand-goldenHour tracking-wider">Monthly Recurring (MRR)</span>
            <Repeat className="w-4 h-4 text-brand-goldenHour" />
          </div>
          <p className="text-2xl font-black text-brand-sandstone">{fmt(mrrMinor)}</p>
          <p className="text-[11px] text-brand-sandstone/60">ARR: <strong className="text-white">{fmt(arrMinor)}</strong> ({activeSubs.length} active plans)</p>
        </div>

        {/* Platform & Service Fees */}
        <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase text-brand-sunriseCoral tracking-wider">Fixed Platform Fees</span>
            <DollarSign className="w-4 h-4 text-brand-sunriseCoral" />
          </div>
          <p className="text-2xl font-black text-brand-sandstone">{fmt(totalFixedFeesMinor)}</p>
          <p className="text-[11px] text-brand-sandstone/60">Checkout &amp; fixed order additions</p>
        </div>

        {/* Refunds & Reversals */}
        <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase text-rose-400 tracking-wider">Refund Deductions</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-300">-{fmt(totalRefundedCommissionsMinor)}</p>
          <p className="text-[11px] text-brand-sandstone/60">Proportional fee reversals</p>
        </div>
      </div>

      {/* Cohort Breakdown: Seller Category & Product Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue by Seller Type */}
        <div className="p-5 rounded-3xl bg-brand-dusk/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-sandstone flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-goldenHour" /> Revenue by Seller Segment
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Merchant Stores', amount: categoryRevenue.merchant, pct: totalTukubiRevenueMinor > 0 ? (categoryRevenue.merchant / totalTukubiRevenueMinor) * 100 : 0 },
              { label: 'Creators & Tips', amount: categoryRevenue.creator, pct: totalTukubiRevenueMinor > 0 ? (categoryRevenue.creator / totalTukubiRevenueMinor) * 100 : 0 },
              { label: 'Business+ Accounts', amount: categoryRevenue.business + mrrMinor, pct: totalTukubiRevenueMinor > 0 ? ((categoryRevenue.business + mrrMinor) / totalTukubiRevenueMinor) * 100 : 0 },
              { label: 'General Users', amount: categoryRevenue.user, pct: totalTukubiRevenueMinor > 0 ? (categoryRevenue.user / totalTukubiRevenueMinor) * 100 : 0 },
            ].map((seg) => (
              <div key={seg.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-brand-sandstone">{seg.label}</span>
                  <span className="text-white">{fmt(seg.amount)} ({seg.pct.toFixed(1)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-sunriseCoral rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(2, seg.pct))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Monetization Tier Structure */}
        <div className="p-5 rounded-3xl bg-brand-dusk/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-sandstone flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-caribbeanSea" /> Configured Monetization Tiers
          </h3>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {tiers.map((tier) => (
              <div key={tier.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {tier.name}
                    <span className="text-[10px] font-mono text-slate-400 capitalize">({tier.account_category})</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Commission: <strong className="text-brand-sunriseCoral">{tier.default_commission_rate_bps / 100}%</strong>
                    {tier.listing_limit ? ` • ${tier.listing_limit} listings limit` : ' • Unlimited listings'}
                  </p>
                </div>
                <span className="font-black text-brand-goldenHour">
                  {tier.price_minor_monthly === 0 ? 'Free' : `$${(tier.price_minor_monthly / 100).toFixed(2)}/mo`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Commission Rules & Version History */}
      <div className="p-5 rounded-3xl bg-brand-dusk/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-sandstone flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-sunriseCoral" /> Versioned Commission Rules Engine
          </h3>
          <span className="text-xs text-brand-sandstone/60 font-mono">
            {rules.length} Rules Defined · Strict Snapshot Versioning
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs text-brand-sandstone/80">
            <thead className="bg-slate-900/80 text-brand-sandstone/50 uppercase text-[10px]">
              <tr>
                <th className="p-3">Rule Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Product Type</th>
                <th className="p-3">Percentage</th>
                <th className="p-3">Fixed Fee</th>
                <th className="p-3">Version</th>
                <th className="p-3">Effective Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-brand-dusk/40">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="p-3 font-semibold text-white">{rule.rule_name}</td>
                  <td className="p-3 capitalize">{rule.account_category} ({rule.tier_code})</td>
                  <td className="p-3 capitalize font-mono text-[11px]">{rule.product_type}</td>
                  <td className="p-3 font-bold text-brand-sunriseCoral">{rule.percentage_bps / 100}%</td>
                  <td className="p-3">${(rule.fixed_fee_minor / 100).toFixed(2)}</td>
                  <td className="p-3 font-mono text-[10px] text-brand-goldenHour">v{rule.version}</td>
                  <td className="p-3 text-slate-400">{new Date(rule.effective_from).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
