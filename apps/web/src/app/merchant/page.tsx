import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  Layout,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  Users,
  Eye,
} from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { Money, isMarketplaceCommerceActive } from '@caribbean/payments';
import StoreBuilder from '../../components/merchant/store-builder';

export const dynamic = 'force-dynamic';

export default async function MerchantCommandCenterPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { tab: activeTab = 'overview' } = (await searchParams) || {};
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/merchant');

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login');

  // 1. Fetch Merchant's Business
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, slug, category, country_iso, is_verified')
    .eq('owner_id', user.id)
    .maybeSingle();

  // 2. Fetch Merchant's Products & Services
  const { data: productsData } = await supabase
    .from('products')
    .select('id, title, description, product_kind, price_minor, currency, inventory_count, is_active, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  const products = productsData ?? [];

  // 3. Fetch Merchant's Orders
  const { data: ordersData } = await supabase
    .from('orders')
    .select('id, status, subtotal_minor, total_minor, currency, created_at, shipping_address, profiles(display_name)')
    .order('created_at', { ascending: false })
    .limit(10);

  const orders = ordersData ?? [];

  // 4. Fetch Storefront Configuration
  const { data: storeConfig } = await supabase
    .from('storefront_configs')
    .select('*')
    .eq('seller_id', user.id)
    .maybeSingle();

  const storeSlug = business?.slug || user.username || user.id;
  const canTransact = isMarketplaceCommerceActive();

  // KPI Calculations (100% Real Data)
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const lowStockCount = products.filter(
    (p) => p.inventory_count !== null && p.inventory_count > 0 && p.inventory_count <= 3
  ).length;
  const outOfStockCount = products.filter(
    (p) => p.inventory_count !== null && p.inventory_count === 0
  ).length;

  const totalGrossMinor = orders
    .filter((o) => ['paid', 'processing', 'shipped', 'fulfilled'].includes(o.status))
    .reduce((sum, o) => sum + (o.total_minor || 0), 0);

  const pendingShipmentsCount = orders.filter((o) =>
    ['paid', 'processing'].includes(o.status)
  ).length;

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Store className="w-8 h-8 text-orange-400" />
            <h1 className="text-2xl md:text-3xl font-black text-white">Merchant Command Center</h1>
          </div>
          <p className="text-xs md:text-sm text-brand-sandstone/60 mt-1">
            {business ? `${business.name} • ` : ''}Catalog management, multi-channel store layout, orders and Caribbean escrow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/store/${storeSlug}`}
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-brand-dusk hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View Public Store
          </Link>
          <Link
            href="/marketplace"
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-orange-500/20"
          >
            Explore Marketplace
          </Link>
        </div>
      </div>

      {/* Pre-launch Notification Banner */}
      {!canTransact && (
        <div className="p-4 rounded-3xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <strong className="text-white">Storefront Setup Phase Active:</strong> Customer transactions officially launch September 30, 2026.
              You can add products, set up variants, and build your storefront right now.
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40 shrink-0">
            Setup Active
          </span>
        </div>
      )}

      {/* Tab Navigation Rail */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'products', label: `Catalog & Products (${totalProducts})`, icon: Package },
          { key: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { key: 'builder', label: 'Storefront Builder', icon: Layout },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              href={`/merchant?tab=${tab.key}`}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
                  : 'bg-brand-dusk text-brand-sandstone/60 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-brand-dusk border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Gross Store Volume
              </span>
              <div className="text-2xl font-black text-white">
                {new Money(totalGrossMinor, 'USD').format()}
              </div>
              <p className="text-[11px] text-emerald-400">Escrow backed</p>
            </div>

            <div className="p-5 rounded-3xl bg-brand-dusk border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Catalog Items
              </span>
              <div className="text-2xl font-black text-white">{totalProducts}</div>
              <p className="text-[11px] text-brand-sandstone/60">{activeProducts} live in marketplace</p>
            </div>

            <div className="p-5 rounded-3xl bg-brand-dusk border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Inventory Alerts
              </span>
              <div className="text-2xl font-black text-orange-400">{lowStockCount} Low Stock</div>
              <p className="text-[11px] text-brand-sandstone/60">{outOfStockCount} items sold out</p>
            </div>

            <div className="p-5 rounded-3xl bg-brand-dusk border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pending Shipments
              </span>
              <div className="text-2xl font-black text-sky-400">{pendingShipmentsCount}</div>
              <p className="text-[11px] text-brand-sandstone/60">Awaiting carrier dispatch</p>
            </div>
          </div>

          {/* Quick Actions & Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 p-6 rounded-3xl bg-brand-dusk border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-400" /> Recent Catalog Listings
                </h3>
                <Link
                  href="/merchant?tab=products"
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                >
                  View All ({totalProducts}) →
                </Link>
              </div>

              {products.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">No products or services listed yet.</p>
                  <Link
                    href="/marketplace"
                    className="inline-block px-4 py-1.5 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs"
                  >
                    Add Product
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {products.slice(0, 5).map((p) => {
                    const price = new Money(p.price_minor, p.currency);
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {p.product_kind === 'service' ? '🤝' : p.product_kind === 'digital' ? '🎧' : '📦'}
                          </span>
                          <div>
                            <div className="font-bold text-white">{p.title}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{p.product_kind}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-white">{price.format()}</div>
                          <div className="text-[10px] text-slate-400">{p.inventory_count ?? 0} in stock</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 p-6 rounded-3xl bg-brand-dusk border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Merchant Verification
              </h3>
              <p className="text-xs text-brand-sandstone/60 leading-relaxed">
                TUKUBI verified merchants receive priority search placement, Caribbean escrow backing, and direct bank settlement rails.
              </p>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">KYC Status:</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Commission Rate:</span>
                  <span className="text-white font-bold">0% (Launch Tier)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Settlement Rail:</span>
                  <span className="text-white font-bold">PayPal / Bank Wire</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white">Catalog Offerings &amp; Inventory</h2>
          </div>

          <div className="p-5 rounded-3xl bg-brand-dusk border border-slate-800 space-y-4">
            {products.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Your catalog is currently empty</h3>
                <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
                  Add physical products, digital assets, or bookable services to your store catalog.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="pb-3">Item</th>
                      <th className="pb-3">Kind</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Inventory</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {products.map((p) => {
                      const price = new Money(p.price_minor, p.currency);
                      return (
                        <tr key={p.id} className="hover:bg-slate-900/40">
                          <td className="py-3 font-bold text-white flex items-center gap-2">
                            <span>{p.product_kind === 'service' ? '🤝' : p.product_kind === 'digital' ? '🎧' : '📦'}</span>
                            <span>{p.title}</span>
                          </td>
                          <td className="py-3 capitalize text-slate-400">{p.product_kind}</td>
                          <td className="py-3 font-bold text-white">{price.format()}</td>
                          <td className="py-3">
                            <span className={`font-semibold ${
                              p.inventory_count && p.inventory_count > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {p.inventory_count ?? 0} units
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              href={`/marketplace/${p.id}`}
                              className="text-orange-400 hover:text-orange-300 font-bold"
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white">Store Customer Orders</h2>
          <div className="p-5 rounded-3xl bg-brand-dusk border border-slate-800">
            {orders.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No customer orders yet</h3>
                <p className="text-xs text-brand-sandstone/60">
                  {canTransact
                    ? 'Orders will appear here as customers complete checkout.'
                    : 'Marketplace commerce launches September 30, 2026. Store catalogs and inventory setup are currently live.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {orders.map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">Order #{o.id.slice(0, 8)}</div>
                      <div className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{new Money(o.total_minor, o.currency).format()}</div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30 capitalize">
                        {o.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STOREFRONT BUILDER */}
      {activeTab === 'builder' && (
        <StoreBuilder
          sellerId={user.id}
          storeSlug={storeSlug}
          initialSections={storeConfig?.sections}
          initialSellerType={storeConfig?.seller_type}
          initialHeadline={storeConfig?.headline}
        />
      )}
    </div>
  );
}
