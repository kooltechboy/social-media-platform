'use client';

import React, { useState } from 'react';
import { Tag, MessageCircle, Share2, Flag, ShieldCheck } from 'lucide-react';
import MakeOfferModal from './make-offer-modal';
import ShareProductModal from './share-product-modal';
import ReportListingModal from './report-listing-modal';
import OrderButton from '../order-button';

interface ProductDetailActionsProps {
  productId: string;
  productTitle: string;
  priceMinor: number;
  currency: string;
  sellerId: string;
  sellerName: string;
  productKind: 'physical' | 'digital' | 'service';
  isAuthenticated: boolean;
  isSeller: boolean;
  inventoryCount: number | null;
}

export default function ProductDetailActions({
  productId,
  productTitle,
  priceMinor,
  currency,
  sellerId,
  sellerName,
  productKind,
  isAuthenticated,
  isSeller,
  inventoryCount,
}: ProductDetailActionsProps) {
  const [offerOpen, setOfferOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOutOfStock = inventoryCount !== null && inventoryCount === 0;

  return (
    <div className="space-y-3 pt-2">
      {/* Primary Buy / Order Button */}
      <OrderButton
        productId={productId}
        isAuthenticated={isAuthenticated}
        disabled={!isAuthenticated || isOutOfStock}
        isSeller={isSeller}
        productDetails={{
          title: productTitle,
          priceMinor,
          currency,
          sellerName,
          productKind,
        }}
      />

      {/* Secondary Actions: Make Offer & Message Seller */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setOfferOpen(true)}
          disabled={!isAuthenticated || isSeller || isOutOfStock}
          className="py-3 px-4 rounded-xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Tag className="w-4 h-4" />
          <span>Make Offer</span>
        </button>

        <a
          href={`/messages?recipientId=${sellerId}&productId=${productId}&productTitle=${encodeURIComponent(productTitle)}`}
          className="py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
        >
          <MessageCircle className="w-4 h-4 text-brand-caribbeanSea" />
          <span>Message Seller</span>
        </a>
      </div>

      {/* Tertiary Actions: Share & Report */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="text-brand-sandstone/70 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Product / Affiliate</span>
        </button>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="text-brand-sandstone/50 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Report</span>
        </button>
      </div>

      {/* Modals */}
      <MakeOfferModal
        productId={productId}
        productTitle={productTitle}
        currentPriceMinor={priceMinor}
        currency={currency}
        sellerName={sellerName}
        isOpen={offerOpen}
        onClose={() => setOfferOpen(false)}
      />

      <ShareProductModal
        productId={productId}
        productTitle={productTitle}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      <ReportListingModal
        productId={productId}
        productTitle={productTitle}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
