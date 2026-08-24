import React from 'react';
import { ShoppingBag, Star, Wallet, Plus, ArrowLeft, ShieldCheck, Sparkles, Truck, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseServerClient, getCurrentUser } from '../../lib/supabase/server';
import { Money } from '@caribbean/spotpay';
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
  businesses: { name: string } | null;
}

const SHOWCASE_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Blue Mountain Coffee (Grade 1 Single Origin Whole Bean)',
    description: 'Freshly roasted high-elevation Jamaican Blue Mountain whole bean coffee. Sealed and packaged in Portland, Jamaica.',
    product_kind: 'physical',
    price_minor: 3800,
    currency: 'USD',
    inventory_count: 45,
    is_active: true,
    seller_id: 'seller-coffee',
    origin: 'Portland, Jamaica 🇯🇲',
    rating: 4.9,
    profiles: { display_name: 'Portland Roast Co.', username: 'portlandcoffee' },
    businesses: { name: 'Portland Mountain Roasters' },
  },
  {
    id: 'prod-2',
    title: 'Handcrafted Carnival Headdress & Beaded Collar Set',
    description: 'Custom carnival feather piece designed by master mas designers in Belmont. Lightweight titanium frame with vibrant plumage.',
    product_kind: 'physical',
    price_minor: 14500,
    currency: 'USD',
    inventory_count: 12,
    is_active: true,
    seller_id: 'seller-mas',
    origin: 'Port of Spain, Trinidad 🇹🇹',
    rating: 5.0,
    profiles: { display_name: 'Belmont Mas Atelier', username: 'belmontmas' },
    businesses: { name: 'Belmont Mas Studio' },
  },
  {
    id: 'prod-3',
    title: 'Artisanal Dominican Organic Cacao & Vanilla Rum Nibs',
    description: 'Single-estate organic dark cacao bars infused with aged Dominican amber rum and natural vanilla bean.',
    product_kind: 'physical',
    price_minor: 2400,
    currency: 'USD',
    inventory_count: 80,
    is_active: true,
    seller_id: 'seller-cacao',
    origin: 'San Francisco de Macorís, DR 🇩🇴',
    rating: 4.8,
    profiles: { display_name: 'Cacao Quisqueya', username: 'cacaoquisqueya' },
    businesses: { name: 'Chocolates del Cibao' },
  },
  {
    id: 'prod-4',
    title: 'Bajan Gourmet Hot Pepper Sauce (Scotch Bonnet & Mustard)',
    description: 'The definitive yellow scotch bonnet sauce with aged mustard, turmeric, and local herbs. Ships worldwide in protective packaging.',
    product_kind: 'physical',
    price_minor: 1600,
    currency: 'USD',
    inventory_count: 150,
    is_active: true,
    seller_id: 'seller-sauce',
    origin: 'St. Michael, Barbados 🇧🇧',
    rating: 4.9,
    profiles: { display_name: 'Bajan Pepper Crafters', username: 'bajanpeppers' },
    businesses: { name: 'Island Spice Lab' },
  },
  {
    id: 'prod-5',
    title: 'Haitian Recycled Steel Drum Tree of Life Wall Relief',
    description: 'Hand-chiseled steel wall sculpture crafted in Croix-des-Bouquets by traditional Haitian metal artisans.',
    product_kind: 'physical',
    price_minor: 8500,
    currency: 'USD',
    inventory_count: 8,
    is_active: true,
    seller_id: 'seller-art',
    origin: 'Croix-des-Bouquets, Haiti 🇭🇹',
    rating: 5.0,
    profiles: { display_name: 'Haiti Artisan Guild', username: 'haitiart' },
    businesses: { name: 'Atelier Soleil Haiti' },
  },
  {
    id: 'prod-6',
    title: 'Soca & Dancehall Stem Pack Vol. 1 (24-bit WAV Royalty Free)',
    description: 'Over 200 authentic percussion loops, steel pan melodies, brass hits, and basslines for producers worldwide.',
    product_kind: 'digital',
    price_minor: 2900,
    currency: 'USD',
    inventory_count: null,
    is_active: true,
    seller_id: 'seller-stems',
    origin: 'London Diaspora 🇬🇧',
    rating: 4.9,
    profiles: { display_name: 'Caribbean Sound Labs', username: 'caribsoundlabs' },
    businesses: { name: 'Diaspora Audio Ltd' },
  },
];

const MARKETPLACE_TABS = [
  'All Products',
  'From the Islands',
  'From the Diaspora',
  'Food & Spices',
  'Carnival & Mas',
  'Art & Decor',
  'Digital & Sounds',
];

export default async function MarketplacePage() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);

  let products: Product[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('products')
      .select('id, title, description, product_kind, price_minor, currency, inventory_count, is_active, seller_id, profiles(display_name, username), businesses(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24);
    if (data && data.length > 0) {
      products = data as unknown as Product[];
    }
  }

  if (products.length === 0) {
    products = SHOWCASE_PRODUCTS;
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
          <Link
            href="/creator-studio"
            className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-md shadow-orange-500/20 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Open Shop / Sell
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-orange-500/20 text-orange-300 border border-orange-500/40 font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 hover:bg-orange-500/30 transition-all self-start md:self-auto"
          >
            Sign in to Sell
          </Link>
        )}
      </div>

      {/* Categories Tab Rail */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {MARKETPLACE_TABS.map((tab, idx) => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
              idx === 0
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'bg-brand-dusk text-brand-sandstone/60 hover:text-brand-sandstone border border-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

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
                <div className="aspect-video bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden group-hover:border-slate-700 transition-colors">
                  <div className="text-4xl mb-1">📦</div>
                  {product.origin && (
                    <span className="absolute top-3 left-3 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-twilight/80 text-orange-400 border border-orange-500/30 backdrop-blur-md">
                      {product.origin}
                    </span>
                  )}
                </div>

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

                <h3 className="font-extrabold text-sm text-brand-sandstone group-hover:text-orange-300 transition-colors leading-snug">
                  {product.title}
                </h3>

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
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
