import React from 'react';
import { ShoppingBag, Star, Wallet, Plus, ArrowLeft, ShieldCheck, Sparkles, Truck, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { Money } from '@caribbean/spotpay';
import OrderButton from '../../components/order-button';
import ConnectSpotPayCard from '../../components/connect-spotpay-card';

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
  businesses: { name: string } | null;
}

const MARKETPLACE_TABS = [
  'All Products',
  'From the Islands',
  'From the Diaspora',
  'Food & Spices',
  'Carnival & Mas',
  'Art & Decor',
  'Digital & Sounds',
];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeCategory = resolvedParams.category || 'All Products';
  const queryText = resolvedParams.q || '';

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let products: Product[] = [];
  if (supabase) {
    let query = supabase
      .from('products')
      .select('id, title, description, product_kind, price_minor, currency, inventory_count, is_active, seller_id, profiles(display_name, username), businesses(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24);

    if (queryText) {
      query = query.or(`title.ilike.%${queryText}%,description.ilike.%${queryText}%`);
    } else if (activeCategory === 'Digital & Sounds') {
      query = query.eq('product_kind', 'digital');
    } else if (activeCategory === 'Food & Spices') {
      query = query.ilike('title', '%coffee%').or('title.ilike.%sauce%,title.ilike.%cacao%,title.ilike.%rum%');
    } else if (activeCategory === 'Carnival & Mas') {
      query = query.or('title.ilike.%carnival%,title.ilike.%mas%,title.ilike.%headdress%');
    } else if (activeCategory === 'Art & Decor') {
      query = query.or('title.ilike.%art%,title.ilike.%sculpture%,title.ilike.%relief%');
    }

    const { data } = await query;
    if (data && data.length > 0) {
      products = data as unknown as Product[];
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-brand-sandstone flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-orange-400" /> Shop the Caribbean
            </h1>
          </div>
          <p className="text-xs md:text-sm text-brand-sandstone/60 mt-1">
            Authentic island goods, artisan craft, food, coffee, and digital audio — SpotPay protected with 30-day dispute settlement.
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link
              href="/marketplace/orders"
              className="bg-brand-dusk hover:bg-slate-800 border border-slate-700 text-brand-sandstone font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-orange-400" /> My Purchases
            </Link>
            <Link
              href="/creator-studio"
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" /> Open Shop / Sell
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

      {/* SpotPay Connect Onboarding Banner */}
      <ConnectSpotPayCard />

      {/* Trust & Guarantee Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950/20 to-slate-900 border border-orange-500/20 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-sunriseCoral flex-shrink-0" />
          <p className="text-slate-300">
            <strong className="text-brand-sandstone">SpotPay Buyer &amp; Seller Protection:</strong> Every purchase is held in escrow until dispatch confirmation with guaranteed double-entry settlement.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-brand-sandstone/60 flex-shrink-0">
          <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Global Island Shipping</span>
          <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-brand-sunriseCoral" /> Verified Sellers</span>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-brand-dusk/70 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto">
          <ShoppingBag className="w-12 h-12 text-orange-400/60 mx-auto" />
          <h3 className="text-base font-bold text-brand-sandstone">No products found</h3>
          <p className="text-xs text-brand-sandstone/60 leading-relaxed">
            There are currently no active products in this category. Become a verified Caribbean merchant and list your island artisanal goods!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const price = new Money(product.price_minor, product.currency);
            const sellerName = product.businesses?.name ?? product.profiles?.display_name ?? 'Caribbean Merchant';
            const outOfStock = product.inventory_count !== null && product.inventory_count === 0;
            return (
              <article
                key={product.id}
                className="bg-brand-dusk/80 border border-slate-800/90 hover:border-orange-500/50 rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all shadow-xl group"
              >
                <div className="space-y-3.5">
                  <Link
                    href={`/marketplace/${product.id}`}
                    className="aspect-video bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden group-hover:border-slate-700 transition-colors block cursor-pointer"
                  >
                    <div className="text-4xl mb-1">📦</div>
                    {product.origin && (
                      <span className="absolute top-3 left-3 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-twilight/80 text-orange-400 border border-orange-500/30 backdrop-blur-md">
                        {product.origin}
                      </span>
                    )}
                  </Link>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-brand-sandstone/60 truncate">{sellerName}</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      product.product_kind === 'physical'
                        ? 'bg-brand-sunriseCoral/10 text-brand-sunriseCoral border-brand-sunriseCoral/20'
                        : product.product_kind === 'digital'
                        ? 'bg-brand-caribbeanSea/10 text-brand-caribbeanSea border-brand-caribbeanSea/20'
                        : 'bg-brand-goldenHour/10 text-brand-goldenHour border-brand-goldenHour/20'
                    }`}>
                      {product.product_kind.toUpperCase()}
                    </span>
                  </div>

                  <Link href={`/marketplace/${product.id}`}>
                    <h3 className="font-extrabold text-sm text-brand-sandstone group-hover:text-orange-300 transition-colors leading-snug cursor-pointer">
                      {product.title}
                    </h3>
                  </Link>

                  {product.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-medium">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-2xl font-black text-brand-sandstone">
                      {price.format()} <span className="text-xs font-semibold text-brand-sandstone/60">{product.currency}</span>
                    </div>
                    {product.rating && (
                      <div className="flex items-center gap-1 text-xs font-bold text-brand-goldenHour">
                        <Star className="w-3.5 h-3.5 fill-brand-goldenHour" /> {product.rating}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <OrderButton
                    productId={product.id}
                    disabled={outOfStock || !user || user.id === product.seller_id}
                    isAuthenticated={!!user}
                    isSeller={user?.id === product.seller_id}
                    productDetails={{
                      title: product.title,
                      priceMinor: product.price_minor,
                      currency: product.currency,
                      sellerName,
                      productKind: product.product_kind,
                      origin: product.origin,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
