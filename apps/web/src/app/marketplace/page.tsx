import React from 'react';
import { ShoppingBag, Star, Wallet, Plus, ArrowLeft } from 'lucide-react';
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
  profiles: { display_name: string; username: string } | null;
  businesses: { name: string } | null;
  average_rating?: number;
}

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
    products = (data ?? []) as unknown as Product[];
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-emerald-400" /> Caribbean Marketplace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authentic Caribbean products, food, art, services, and culture — direct from Caribbean businesses.
          </p>
        </div>
        {user ? (
          <Link
            href="/creator-studio"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Sell on Marketplace
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            Sign in to Sell
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No products yet.</p>
          <p className="text-xs text-slate-500 mt-1">Caribbean sellers will list products here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const price = new Money(product.price_minor, product.currency);
            const sellerName = product.businesses?.name ?? product.profiles?.display_name ?? 'Caribbean Seller';
            const outOfStock = product.inventory_count !== null && product.inventory_count === 0;
            return (
              <article
                key={product.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="aspect-video bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800">
                    <ShoppingBag className="w-10 h-10 text-slate-700" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 truncate">{sellerName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      product.product_kind === 'physical'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : product.product_kind === 'digital'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {product.product_kind}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white leading-snug">{product.title}</h3>
                  {product.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{product.description}</p>
                  )}
                  <div className="text-xl font-black text-emerald-400">
                    {price.format()}{' '}
                    <span className="text-xs font-normal text-slate-400">{product.currency}</span>
                  </div>
                  {product.inventory_count !== null && (
                    <p className="text-[11px] text-slate-500">
                      {outOfStock ? 'Out of stock' : `${product.inventory_count} in stock`}
                    </p>
                  )}
                </div>

                <OrderButton
                  productId={product.id}
                  disabled={outOfStock || !user || user.id === product.seller_id}
                  isAuthenticated={!!user}
                  isSeller={user?.id === product.seller_id}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
