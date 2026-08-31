import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { Money } from '@caribbean/payments';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { cancelOrderAction } from '../../../lib/marketplace/actions';

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  fulfilled: 'bg-brand-caribbeanSea/10 text-brand-caribbeanSea border-brand-caribbeanSea/30',
  cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  pending_payment: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid & Secured',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  pending_payment: 'Pending Payment',
};

export default async function MarketplaceOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6">
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 text-center max-w-sm space-y-4">
          <ShoppingBag className="w-10 h-10 text-orange-400 mx-auto" />
          <h1 className="text-lg font-bold text-brand-sandstone">Marketplace Orders</h1>
          <p className="text-xs text-brand-sandstone/60">Sign in to view your orders and purchase history.</p>
          <Link
            href="/login?next=/marketplace/orders"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-5 py-2 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  let orders: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, subtotal_minor, platform_fee_minor, total_minor, currency, created_at, order_items(id, quantity, unit_price_minor, line_total_minor, products(id, title, product_kind, seller_id))')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    orders = data ?? [];
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-brand-sandstone transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <h1 className="text-lg font-black text-brand-sandstone flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-orange-400" /> My Orders &amp; Purchases
        </h1>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-brand-dusk/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <Package className="w-12 h-12 text-orange-400/60 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-brand-sandstone">No orders yet</h3>
            <p className="text-xs text-brand-sandstone/60 leading-relaxed">
              Explore authentic Caribbean goods, digital audio stems, and artisan crafts protected by 30-day dispute settlement.
            </p>
            <Link
              href="/marketplace"
              className="inline-block bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
            >
              Browse Marketplace →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const total = new Money(order.total_minor, order.currency);
            const items = order.order_items ?? [];
            const firstItem = items[0];
            const sellerName = firstItem?.products?.businesses?.name ?? firstItem?.products?.profiles?.display_name ?? 'Merchant';

            return (
              <div
                key={order.id}
                className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-6 space-y-4 transition-all hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-300">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[order.status] ?? 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-sandstone/40">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {sellerName && ` • Sold by ${sellerName}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-brand-sandstone/40 block">Total</span>
                    <span className="text-xl font-black text-brand-sandstone">{total.format()}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {items.map((item: any) => {
                    const itemTotal = new Money(item.line_total_minor, order.currency);
                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📦</span>
                          <span className="font-semibold text-slate-200">
                            {item.products?.title ?? 'Item'}
                          </span>
                          <span className="text-brand-sandstone/40">× {item.quantity}</span>
                        </div>
                        <span className="font-bold text-slate-300">{itemTotal.format()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Fulfillment Protected</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href="/financial-center"
                      className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Wallet className="w-3 h-3" /> View in Financial Center
                    </Link>
                    {order.status === 'pending_payment' && (
                      <Link
                        href="/financial-center"
                        className="bg-brand-sunriseCoral text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs hover:bg-brand-goldenHour transition-colors"
                      >
                        Complete Payment
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
