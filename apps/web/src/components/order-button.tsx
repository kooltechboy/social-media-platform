'use client';

import React, { useState } from 'react';
import { Wallet, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { isMarketplaceCommerceActive } from '@caribbean/payments';
import UnifiedCheckoutModal from './unified-checkout-modal';
import { ComingSoonButton } from './ui/coming-soon-badge';

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
        className="w-full text-center bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/40 font-bold py-2.5 md:py-3 px-4 rounded-xl text-xs md:text-sm min-h-[42px] md:min-h-[44px] flex items-center justify-center gap-2 transition-colors"
      >
        <Wallet className="w-4 h-4 md:w-5 md:h-5" /> Sign in to Buy
      </Link>
    );
  }

  if (isSeller) {
    return (
      <div className="w-full text-center text-xs md:text-sm font-semibold text-brand-sandstone/60 py-2.5">Your product listing</div>
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
      <ComingSoonButton label="Payments Coming Soon" className="w-full" />

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
