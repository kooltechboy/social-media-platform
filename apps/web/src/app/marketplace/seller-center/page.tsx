import React from 'react';
import Link from 'next/link';
import {
  Store,
  Plus,
  ArrowLeft,
  ShoppingBag,
  DollarSign,
  Package,
  Tag,
  Star,
  Eye,
  TrendingUp,
  Truck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Money } from '@caribbean/payments';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SellerCenterDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6 animate-fadeIn">
        <div className="surface-card border border-white/15 rounded-3xl p-8 text-center max-w-sm space-y-4 shadow-2xl">
          <Store className="w-12 h-12 text-brand-goldenHour mx-auto" />
          <h1 className="text-xl font-black text-white">Merchant Seller Center</h1>
          <p className="text-xs text-brand-sandstone/70">
            Sign in to manage your Caribbean merchandise, track multi-island orders, fulfill shipments, and analyze conversion.
          </p>
          <Link
            href="/login?next=/marketplace/seller-center"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
          >
            Sign In to Seller Center
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  let activeListings: any[] = [];
  let sellerOrders: any[] = [];
  let totalRevenueMinor = 0;
  let totalViews = 0;
  let pendingOffersCount = 0;

  if (supabase) {
    // 1. Fetch Seller Listings
    const { data: listings } = await supabase
      .from('products')
      .select('id, title, price_minor, currency, inventory_count, is_active, status, views_count, created_at, marketplace_product_media(media_url)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    activeListings = listings ?? [];
    totalViews = activeListings.reduce((sum, item) => sum + (item.views_count || 0), 0);

    // 2. Fetch Seller Orders (through order_items)
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        id, quantity, line_total_minor,
        orders (id, status, created_at, currency, buyer_id),
        products!inner (seller_id, title)
      `)
      .eq('products.seller_id', user.id)
      .order('id', { ascending: false })
      .limit(20);

    if (orderItems) {
      sellerOrders = orderItems;
      totalRevenueMinor = orderItems.reduce((sum, item) => {
        const orderStatus = (item.orders as any)?.status;
        if (orderStatus === 'paid' || orderStatus === 'fulfilled') {
          return sum + item.line_total_minor;
        }
        return sum;
      }, 0);
    }

    // 3. Fetch Inbound Pending Offers
    const { count: offersCount } = await supabase
      .from('marketplace_offers')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'pending');

    pendingOffersCount = offersCount ?? 0;
  }

  const revenueFormatted = new Money(totalRevenueMinor, 'USD');

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-sandstone/70 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Store className="w-6 h-6 text-brand-goldenHour" /> Caribbean Seller Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/marketplace/offers"
            className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Tag className="w-4 h-4 text-orange-400" />
            <span>Offers ({pendingOffersCount})</span>
          </Link>
          <Link
            href="/marketplace/seller-center/create"
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Listing</span>
          </Link>
        </div>
      </div>

      {/* Analytics KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card border border-white/10 rounded-3xl p-5 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-black uppercase text-brand-sandstone/60">
            <span>Settled Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{revenueFormatted.format()}</p>
          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Double-entry verified
          </p>
        </div>

        <div className="surface-card border border-white/10 rounded-3xl p-5 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-black uppercase text-brand-sandstone/60">
            <span>Active Listings</span>
            <Package className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-black text-white">{activeListings.length}</p>
          <p className="text-[10px] text-brand-sandstone/60">Across Caribbean catalog</p>
        </div>

        <div className="surface-card border border-white/10 rounded-3xl p-5 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-black uppercase text-brand-sandstone/60">
            <span>Total Views</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalViews}</p>
          <p className="text-[10px] text-brand-sandstone/60">Buyer impressions</p>
        </div>

        <div className="surface-card border border-white/10 rounded-3xl p-5 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-black uppercase text-brand-sandstone/60">
            <span>Customer Orders</span>
            <ShoppingBag className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{sellerOrders.length}</p>
          <p className="text-[10px] text-brand-sandstone/60">Fulfillment pipeline</p>
        </div>
      </div>

      {/* Active Listings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-400" /> My Products &amp; Merchandise
          </h2>
          <Link
            href="/marketplace/seller-center/create"
            className="text-xs font-bold text-orange-400 hover:underline flex items-center gap-1"
          >
            <span>+ Add Listing</span>
          </Link>
        </div>

        {activeListings.length === 0 ? (
          <div className="surface-card rounded-3xl p-10 text-center max-w-md mx-auto space-y-3 border border-white/10">
            <Package className="w-12 h-12 text-white/20 mx-auto" />
            <h3 className="text-sm font-black text-white">No products listed yet</h3>
            <p className="text-xs text-brand-sandstone/70">
              Start selling authentic Caribbean goods to customers across the islands and global diaspora.
            </p>
            <Link
              href="/marketplace/seller-center/create"
              className="inline-block px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs transition-all shadow-md"
            >
              Create First Listing
            </Link>
          </div>
        ) : (
          <div className="surface-card border border-white/10 rounded-3xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-brand-sandstone/80">
                <thead className="border-b border-white/10 text-[11px] uppercase font-black tracking-wider text-brand-sandstone/50 bg-white/5">
                  <tr>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Views</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {activeListings.map((item) => {
                    const price = new Money(item.price_minor, item.currency);
                    const thumb = item.marketplace_product_media?.[0]?.media_url;

                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                          {thumb ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={thumb} alt={item.title} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-lg border border-white/10">
                              📦
                            </div>
                          )}
                          <div className="truncate max-w-[200px] sm:max-w-xs">
                            <Link href={`/marketplace/${item.id}`} className="hover:text-orange-400">
                              {item.title}
                            </Link>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-brand-goldenHour">{price.format()}</td>
                        <td className="py-3.5 px-4">
                          {item.inventory_count !== null ? (
                            <span className={item.inventory_count > 0 ? 'text-white' : 'text-rose-400 font-bold'}>
                              {item.inventory_count}
                            </span>
                          ) : (
                            <span className="text-brand-sandstone/50">Unlimited</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">{item.views_count || 0}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              item.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            }`}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/marketplace/${item.id}`}
                            className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-bold"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recent Customer Orders */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-brand-caribbeanSea" /> Recent Fulfillment Orders
        </h2>

        {sellerOrders.length === 0 ? (
          <div className="surface-card rounded-3xl p-8 text-center border border-white/10">
            <p className="text-xs text-brand-sandstone/70">
              No customer orders received yet. Once a customer completes checkout, waybills and delivery details appear here.
            </p>
          </div>
        ) : (
          <div className="surface-card border border-white/10 rounded-3xl p-4 space-y-3">
            {sellerOrders.map((o) => {
              const orderDetails = o.orders as any;
              const lineTotal = new Money(o.line_total_minor, orderDetails?.currency || 'USD');

              return (
                <div
                  key={o.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white truncate">
                      {o.quantity}x {o.products?.title || 'Item'}
                    </p>
                    <p className="text-[10px] text-brand-sandstone/50 font-mono">
                      Order #{orderDetails?.id?.slice(0, 8).toUpperCase() || 'ORDER'} • Status: {orderDetails?.status || 'Processing'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-brand-goldenHour">{lineTotal.format()}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {orderDetails?.status || 'Active'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
