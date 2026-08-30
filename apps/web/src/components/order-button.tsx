'use client';

import React, { useState } from 'react';
import { Wallet, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { isMarketplaceCommerceActive } from '@caribbean/payments';
import UnifiedCheckoutModal from './unified-checkout-modal';

interface Props {
  productId: string;
  disabled?: boolean;
  isAuthenticated: boolean;
  isSeller: boolean;
  productDetails?: {
    title: string;
    priceMinor: number;
    currency: string;
    sellerName: string;
    productKind: 'physical' | 'digital' | 'service';
    origin?: string;
  };
  creatorReferralCode?: string;
}

export default function OrderButton({
  productId,
  disabled,
  isAuthenticated,
  isSeller,
  productDetails,
  creatorReferralCode,
}: Props) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login?next=/marketplace"
        className="w-full text-center bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/40 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
      >
        <Wallet className="w-4 h-4" /> Sign in to Buy
      </Link>
    );
  }

  if (isSeller) {
    return (
      <div className="w-full text-center text-[11px] text-brand-sandstone/40 py-2">Your product listing</div>
    );
  }

  const defaultDetails = productDetails || {
    id: productId,
    title: 'Caribbean Verified Product',
    priceMinor: 2500,
    currency: 'USD',
    sellerName: 'Tukubi Merchant',
    productKind: 'physical' as const,
    origin: 'Caribbean 🌴',
  };

  const canTransact = isMarketplaceCommerceActive();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsCheckoutOpen(true)}
        disabled={disabled}
        className={`w-full font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          canTransact
            ? 'bg-gradient-to-r from-orange-500 to-brand-goldenHour hover:from-orange-400 hover:to-brand-goldenHour text-slate-950 shadow-orange-500/20'
            : 'bg-brand-dusk hover:bg-slate-800 text-orange-400 border border-orange-500/40 shadow-slate-900/50'
        }`}
      >
        <Wallet className="w-4 h-4" />
        {disabled
          ? 'Unavailable'
          : canTransact
          ? 'Buy with Card / PayPal'
          : 'Marketplace Transactions Launch Sept 30, 2026'}
      </button>

      <UnifiedCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={{
          id: productId,
          title: defaultDetails.title,
          priceMinor: defaultDetails.priceMinor,
          currency: defaultDetails.currency,
          sellerName: defaultDetails.sellerName,
          productKind: defaultDetails.productKind,
          origin: defaultDetails.origin,
        }}
        creatorReferralCode={creatorReferralCode}
      />
    </>
  );
}
