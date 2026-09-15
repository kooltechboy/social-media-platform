import React from 'react';
import Link from 'next/link';
import { Tag, ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import OffersManagerClient, { type OfferItem } from '../../../components/marketplace/offers-manager-client';
import type { OfferStatus } from '@caribbean/marketplace';

export const dynamic = 'force-dynamic';

export default async function MarketplaceOffersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-6 animate-fadeIn">
        <div className="surface-card border border-white/15 rounded-3xl p-8 text-center max-w-sm space-y-4 shadow-2xl">
          <Tag className="w-12 h-12 text-orange-400 mx-auto" />
          <h1 className="text-xl font-black text-white">Marketplace Offers</h1>
          <p className="text-xs text-brand-sandstone/70">
            Sign in to track your sent price offers, receive seller counteroffers, or manage inbound offers on your merchandise.
          </p>
          <Link
            href="/login?next=/marketplace/offers"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  let offersList: OfferItem[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('marketplace_offers')
      .select(`
        id, product_id, buyer_id, seller_id, offered_price_minor, counter_price_minor,
        currency, quantity, status, message, expires_at, created_at,
        products (title, price_minor, currency),
        buyer:profiles!marketplace_offers_buyer_id_fkey(display_name, username),
        seller:profiles!marketplace_offers_seller_id_fkey(display_name, username)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      offersList = data.map((row: any) => {
        const isBuyer = row.buyer_id === user.id;
        const otherPartyName = isBuyer
          ? row.seller?.display_name || row.seller?.username || 'Seller'
          : row.buyer?.display_name || row.buyer?.username || 'Buyer';

        return {
          id: row.id,
          productId: row.product_id,
          productTitle: row.products?.title || 'Caribbean Product',
          productPriceMinor: row.products?.price_minor || row.offered_price_minor,
          offeredPriceMinor: row.offered_price_minor,
          counterPriceMinor: row.counter_price_minor,
          currency: row.currency || 'USD',
          quantity: row.quantity || 1,
          status: (row.status as OfferStatus) || 'pending',
          message: row.message,
          expiresAt: row.expires_at,
          createdAt: row.created_at,
          otherPartyName,
          isBuyer,
        };
      });
    }
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
          <Tag className="w-5 h-5 text-orange-400" /> Offers &amp; Price Negotiations
        </h1>
      </div>

      <OffersManagerClient initialOffers={offersList} />
    </div>
  );
}
