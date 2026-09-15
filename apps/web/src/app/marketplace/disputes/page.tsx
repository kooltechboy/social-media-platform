import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import DisputesManagerClient, { type DisputeItem } from '../../../components/marketplace/disputes-manager-client';

export const dynamic = 'force-dynamic';

export default async function MarketplaceDisputesPage({
  searchParams,
}: {
  searchParams?: Promise<{ orderId?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialOrderId = resolvedParams.orderId || '';

  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6 animate-fadeIn">
        <div className="surface-card border border-white/15 rounded-3xl p-8 text-center max-w-sm space-y-4 shadow-2xl">
          <ShieldCheck className="w-12 h-12 text-brand-sunriseCoral mx-auto" />
          <h1 className="text-xl font-black text-white">Resolution Center</h1>
          <p className="text-xs text-brand-sandstone/70">
            Sign in to track active buyer protection claims, upload dispute evidence, or respond as a merchant.
          </p>
          <Link
            href="/login?next=/marketplace/disputes"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  let disputes: DisputeItem[] = [];
  let availableOrders: Array<{ id: string; total_minor: number; currency: string }> = [];

  if (supabase) {
    const [disputesRes, ordersRes] = await Promise.all([
      supabase
        .from('marketplace_disputes')
        .select(`
          id, order_id, reason, status, disputed_amount_minor, currency, buyer_notes,
          seller_notes, resolution_summary, created_at, updated_at,
          orders (id, total_minor, currency),
          seller:profiles!marketplace_disputes_seller_id_fkey(display_name, username)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, total_minor, currency')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

    disputes = (disputesRes.data ?? []).map((d: any) => ({
      id: d.id,
      orderId: d.order_id,
      reason: d.reason,
      status: d.status,
      disputedAmountMinor: d.disputed_amount_minor,
      currency: d.currency,
      buyerNotes: d.buyer_notes,
      sellerNotes: d.seller_notes,
      resolutionSummary: d.resolution_summary,
      createdAt: d.created_at,
      sellerName: d.seller?.display_name || d.seller?.username || 'Merchant',
    }));

    availableOrders = ordersRes.data ?? [];
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-sandstone/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-sunriseCoral" /> TUKUBI Resolution Center
        </h1>
      </div>

      {/* Information Banner */}
      <div className="surface-card border border-white/10 rounded-3xl p-5 space-y-2 text-xs">
        <h2 className="font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Guaranteed Double-Entry Escrow Settlement
        </h2>
        <p className="text-brand-sandstone/70 leading-relaxed">
          All disputes are managed according to the 30-day Caribbean Trust &amp; Safety window. Funds remain locked in ledger escrow until mutual agreement or mediator determination.
        </p>
      </div>

      {/* Interactive Disputes Manager Client */}
      <DisputesManagerClient
        disputes={disputes}
        availableOrders={availableOrders}
        initialOrderId={initialOrderId}
      />
    </div>
  );
}
