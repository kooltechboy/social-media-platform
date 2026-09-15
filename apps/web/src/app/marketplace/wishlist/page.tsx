import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, ShoppingBag, ArrowRight } from 'lucide-react';
import { Money } from '@caribbean/payments';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import WishlistButton from '../../../components/marketplace/wishlist-button';

export const dynamic = 'force-dynamic';

export default async function MarketplaceWishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6 animate-fadeIn">
        <div className="surface-card border border-white/15 rounded-3xl p-8 text-center max-w-sm space-y-4 shadow-2xl">
          <Heart className="w-12 h-12 text-rose-400 mx-auto fill-rose-400/20" />
          <h1 className="text-xl font-black text-white">Your Saved Items</h1>
          <p className="text-xs text-brand-sandstone/70">
            Sign in to access your saved Caribbean products, watch price drops, and organize collections.
          </p>
          <Link
            href="/login?next=/marketplace/wishlist"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  let savedItems: any[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('marketplace_wishlists')
      .select(`
        id, created_at,
        products (
          id, title, description, price_minor, currency, product_kind, inventory_count, is_active,
          marketplace_product_media (media_url),
          businesses (name)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    savedItems = data ?? [];
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
          <Heart className="w-5 h-5 text-rose-400 fill-rose-400" /> Saved Items &amp; Wishlist
        </h1>
      </div>

      {savedItems.length === 0 ? (
        <div className="surface-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 border border-white/10 shadow-xl">
          <Heart className="w-14 h-14 text-white/20 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">Your wishlist is empty</h3>
            <p className="text-xs text-brand-sandstone/70 leading-relaxed">
              Explore authentic Caribbean artisan goods, Blue Mountain coffee, carnival fashion, and digital stems. Tap the heart on any item to save it here.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
          >
            Browse Marketplace →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {savedItems.map((item) => {
            const p = item.products;
            if (!p) return null;
            const price = new Money(p.price_minor, p.currency);
            const mediaUrl = p.marketplace_product_media?.[0]?.media_url;

            return (
              <div
                key={item.id}
                className="surface-card border border-white/10 rounded-3xl p-4 flex flex-col justify-between space-y-3 shadow-lg hover:border-orange-500/30 transition-all group"
              >
                <div className="space-y-3">
                  <div className="aspect-square bg-slate-950 border border-white/10 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    {mediaUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={mediaUrl} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">
                        {p.product_kind === 'service' ? '🤝' : p.product_kind === 'digital' ? '🎧' : '📦'}
                      </span>
                    )}

                    <div className="absolute top-2.5 right-2.5">
                      <WishlistButton productId={p.id} initialSaved={true} size="sm" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-white truncate">{p.title}</h3>
                    <p className="text-xs text-brand-sandstone/60 line-clamp-1 mt-0.5">
                      {p.businesses?.name || 'Caribbean Merchant'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-base font-black text-brand-goldenHour">{price.format()}</span>
                    <span className="text-[11px] text-brand-sandstone/60">
                      {p.is_active ? 'In Stock' : 'Unavailable'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/marketplace/${p.id}`}
                  className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <span>View Product</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
