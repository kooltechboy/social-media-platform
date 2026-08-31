import React from 'react';
import {
  ShoppingBag,
  Star,
  Wallet,
  Plus,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Truck,
  CheckCircle,
  Search,
  SlidersHorizontal,
  Store,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { Money, getMarketplaceLaunchMessaging } from '@caribbean/payments';
import OrderButton from '../../components/order-button';

export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  title: string;
  description: string | null;
  product_kind: 'physical' | 'digital' | 'service';
  price_minor: number;
  currency: string;
  inventory_count: number | null;
  is_active: boolean;
  seller_id: string;
  origin?: string;
  rating?: number;
  profiles: { display_name: string; username: string } | null;
  businesses: { name: string; slug?: string } | null;
}

const MARKETPLACE_TABS = [
  'All Products',
  'From the Islands',
  'From the Diaspora',
  'Food & Spices',
  'Carnival & Mas',
  'Art & Decor',
  'Digital & Sounds',
  'Services & Bookings',
];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string; kind?: string; sort?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeCategory = resolvedParams.category || 'All Products';
  const queryText = resolvedParams.q || '';
  const filterKind = resolvedParams.kind || 'all';
  const sortOption = resolvedParams.sort || 'newest';

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let products: Product[] = [];
  if (supabase) {
    let query = supabase
      .from('products')
      .select('id, title, description, product_kind, price_minor, currency, inventory_count, is_active, seller_id, profiles(display_name, username), businesses(name, slug)')
      .eq('is_active', true);

    if (queryText) {
      query = query.or(`title.ilike.%${queryText}%,description.ilike.%${queryText}%`);
    }

    if (filterKind !== 'all') {
      query = query.eq('product_kind', filterKind);
    } else if (activeCategory === 'Digital & Sounds') {
      query = query.eq('product_kind', 'digital');
    } else if (activeCategory === 'Services & Bookings') {
      query = query.eq('product_kind', 'service');
    } else if (activeCategory === 'Food & Spices') {
      query = query.ilike('title', '%coffee%').or('title.ilike.%sauce%,title.ilike.%cacao%,title.ilike.%rum%');
    } else if (activeCategory === 'Carnival & Mas') {
      query = query.or('title.ilike.%carnival%,title.ilike.%mas%,title.ilike.%headdress%');
    } else if (activeCategory === 'Art & Decor') {
      query = query.or('title.ilike.%art%,title.ilike.%sculpture%,title.ilike.%relief%');
    }

    if (sortOption === 'price_asc') {
      query = query.order('price_minor', { ascending: true });
    } else if (sortOption === 'price_desc') {
      query = query.order('price_minor', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.limit(28);

    const { data } = await query;
    if (data && data.length > 0) {
      products = data as unknown as Product[];
    }
  }

  const launchMessaging = getMarketplaceLaunchMessaging();

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-orange-400" /> Shop the Caribbean
            </h1>
          </div>
          <p className="text-xs md:text-sm text-brand-sandstone/60 mt-1">
            Authentic island goods, artisan craft, food, coffee, and digital audio — protected with 30-day dispute settlement.
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link
              href="/merchant"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all"
            >
              <Store className="w-4 h-4 text-brand-goldenHour" /> Merchant Hub
            </Link>
            <Link
              href="/marketplace/orders"
              className="bg-brand-dusk hover:bg-slate-800 border border-slate-700 text-brand-sandstone font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-orange-400" /> My Purchases
            </Link>
            <Link
              href="/pages/create"
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" /> Open Store / Sell
            </Link>
          </div>
        ) : (
          <Link
            href="/login?redirect=/marketplace"
            className="bg-orange-500/20 text-orange-300 border border-orange-500/40 font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 hover:bg-orange-500/30 transition-all self-start md:self-auto"
          >
            Sign in to Sell
          </Link>
        )}
      </div>

      {/* Phased Launch Banner (Directive 10 & 46) */}
      <div className="bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/30 border border-orange-500/30 rounded-3xl p-5 shadow-lg space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
            {launchMessaging.badge}
          </span>
          <h2 className="text-sm md:text-base font-black text-brand-sandstone">
            {launchMessaging.bannerTitle}
          </h2>
        </div>
        <p className="text-xs text-brand-sandstone/70 leading-relaxed font-medium">
          {launchMessaging.bannerBody}
        </p>
      </div>

      {/* Faceted Search & Category Rail */}
      <div className="space-y-4">
        {/* Search Bar & Quick Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={queryText}
              placeholder="Search Caribbean goods, coffee, art, music, or services..."
              className="w-full bg-brand-dusk border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </form>

          {/* Product Kind Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'All Kinds' },
              { id: 'physical', label: 'Physical Goods' },
              { id: 'digital', label: 'Digital Assets' },
              { id: 'service', label: 'Services' },
            ].map((k) => (
              <Link
                key={k.id}
                href={`/marketplace?kind=${k.id}${queryText ? `&q=${encodeURIComponent(queryText)}` : ''}`}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                  filterKind === k.id
                    ? 'bg-slate-800 text-orange-400 border border-orange-500/40'
                    : 'bg-brand-dusk text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {k.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Categories Tab Rail */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {MARKETPLACE_TABS.map((tab) => {
            const isActive = tab === activeCategory;
            return (
              <Link
                key={tab}
                href={tab === 'All Products' ? '/marketplace' : `/marketplace?category=${encodeURIComponent(tab)}`}
                className={`px-4 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                    : 'bg-brand-dusk text-brand-sandstone/60 hover:text-brand-sandstone border border-slate-800'
                }`}
              >
                {tab}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950/20 to-slate-900 border border-orange-500/20 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-sunriseCoral flex-shrink-0" />
          <p className="text-slate-300">
            <strong className="text-brand-sandstone">TUKUBI Buyer &amp; Seller Protection:</strong> Every purchase is backed by automated dispute settlement and escrow resolution via authorized Caribbean and international payment processors.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-brand-sandstone/60 flex-shrink-0">
          <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Global Island Shipping</span>
          <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-brand-sunriseCoral" /> Verified Sellers</span>
        </div>
      </div>

      {/* Products Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-orange-400" />
            <span>{activeCategory}</span>
            <span className="text-xs font-normal text-slate-400">({products.length} items)</span>
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="p-12 rounded-3xl bg-brand-dusk/60 border border-dashed border-slate-800 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No products found</h3>
            <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
              No Caribbean merchandise matches this search query or category filter yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const price = new Money(p.price_minor, p.currency);
              const sellerName = p.businesses?.name || p.profiles?.display_name || 'Caribbean Merchant';
              const sellerSlug = p.businesses?.slug || p.profiles?.username;

              return (
                <div
                  key={p.id}
                  className="bg-brand-dusk border border-slate-800/80 hover:border-orange-500/40 rounded-3xl p-4 flex flex-col justify-between transition-all group shadow-lg"
                >
                  <div className="space-y-3">
                    <Link
                      href={`/marketplace/${p.id}`}
                      className="aspect-square bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform"
                    >
                      <span className="text-5xl">
                        {p.product_kind === 'service' ? '🤝' : p.product_kind === 'digital' ? '🎧' : '📦'}
                      </span>
                      <span className={`absolute top-2.5 right-2.5 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
                        p.product_kind === 'physical'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : p.product_kind === 'digital'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      }`}>
                        {p.product_kind}
                      </span>
                    </Link>

                    <div>
                      {sellerSlug ? (
                        <Link
                          href={`/store/${sellerSlug}`}
                          className="text-[11px] font-bold text-orange-400 hover:underline block truncate"
                        >
                          {sellerName}
                        </Link>
                      ) : (
                        <div className="text-[11px] font-bold text-slate-400 truncate">{sellerName}</div>
                      )}
                      <Link
                        href={`/marketplace/${p.id}`}
                        className="font-bold text-sm text-white hover:text-orange-400 line-clamp-1 transition-colors mt-0.5"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-brand-sandstone/60 line-clamp-2 mt-1 min-h-[32px]">
                        {p.description || 'Authentic Caribbean offering with guaranteed fulfillment.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-base font-black text-white">{price.format()}</span>
                      {p.inventory_count !== null && (
                        <span className="text-[10px] text-brand-sandstone/50">
                          {p.inventory_count > 0 ? `${p.inventory_count} in stock` : 'Sold out'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3">
                    <OrderButton
                      productId={p.id}
                      isAuthenticated={!!user}
                      disabled={!user || p.inventory_count === 0}
                      isSeller={user?.id === p.seller_id}
                      productDetails={{
                        title: p.title,
                        priceMinor: p.price_minor,
                        currency: p.currency,
                        sellerName,
                        productKind: p.product_kind,
                      }}
                    />
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
