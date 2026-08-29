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
import { Money } from '@caribbean/spotpay';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { cancelOrderAction } from '../../../lib/marketplace/actions';

export const dynamic = 'force-dynamic';

export default async function MarketplaceOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex items-center justify-center p-6">
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-8 text-center max-w-sm space-y-4">
          <ShoppingBag className="w-10 h-10 text-orange-400 mx-auto" />
          <h1 className="text-lg font-bold text-brand-sandstone">Marketplace Orders</h1>
          <p className="text-xs text-brand-sandstone/60">Sign in to view your orders and SpotPay purchase history.</p>
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
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
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
              Explore authentic Caribbean goods, digital audio stems, and artisan crafts protected by SpotPay Escrow.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const total = new Money(order.total_minor, order.currency);
            return (
              <div
                key={order.id}
                className="bg-brand-dusk/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-brand-sandstone/40 block">
                      Order #{order.id}
                    </span>
                    <span className="text-xs text-brand-sandstone/60">
                      {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                      order.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : order.status === 'fulfilled'
                        ? 'bg-brand-caribbeanSea/10 text-brand-caribbeanSea border-brand-caribbeanSea/30'
                        : order.status === 'cancelled'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-black text-brand-sandstone">
                      {total.format()} {order.currency}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">
                        {item.quantity}x {item.products?.title || 'Caribbean Product'}
                      </span>
                      <span className="text-brand-sandstone/60 font-mono">
                        ${(item.line_total_minor / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 text-[11px] text-brand-sandstone/50">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-sunriseCoral" />
                    <span>SpotPay Escrow Protected</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'pending_payment' && (
                      <Link
                        href="/spotpay"
                        className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs transition-all shadow-sm"
                      >
                        Complete Payment →
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
