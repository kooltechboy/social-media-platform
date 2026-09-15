'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Tag, Clock, Check, X, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';
import { respondOfferAction } from '../../lib/marketplace/actions';
import type { OfferStatus } from '@caribbean/marketplace';

export interface OfferItem {
  id: string;
  productId: string;
  productTitle: string;
  productPriceMinor: number;
  offeredPriceMinor: number;
  counterPriceMinor?: number | null;
  currency: string;
  quantity: number;
  status: OfferStatus;
  message?: string | null;
  expiresAt: string;
  createdAt: string;
  otherPartyName: string;
  isBuyer: boolean;
}

const STATUS_BADGES: Record<OfferStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Pending Response', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  countered: { label: 'Counteroffer Received', badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  accepted: { label: 'Accepted', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Declined', badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  cancelled: { label: 'Cancelled', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  expired: { label: 'Expired', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
};

export default function OffersManagerClient({ initialOffers }: { initialOffers: OfferItem[] }) {
  const [offers, setOffers] = useState<OfferItem[]>(initialOffers);
  const [tab, setTab] = useState<'sent' | 'received'>('sent');
  const [counterModalOffer, setCounterModalOffer] = useState<OfferItem | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const filteredOffers = offers.filter((o) => (tab === 'sent' ? o.isBuyer : !o.isBuyer));

  const handleAction = (offerId: string, action: 'accept' | 'reject' | 'cancel') => {
    startTransition(async () => {
      const res = await respondOfferAction(offerId, action);
      if (res.success) {
        setOffers((prev) =>
          prev.map((o) =>
            o.id === offerId
              ? {
                  ...o,
                  status:
                    action === 'accept'
                      ? 'accepted'
                      : action === 'reject'
                      ? 'rejected'
                      : 'cancelled',
                }
              : o
          )
        );
      }
    });
  };

  const handleCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterModalOffer) return;
    const priceVal = parseFloat(counterPriceInput);
    if (!priceVal || priceVal <= 0) return;

    startTransition(async () => {
      const res = await respondOfferAction(counterModalOffer.id, 'counter', priceVal);
      if (res.success) {
        setOffers((prev) =>
          prev.map((o) =>
            o.id === counterModalOffer.id
              ? {
                  ...o,
                  status: 'countered',
                  counterPriceMinor: Math.round(priceVal * 100),
                }
              : o
          )
        );
        setCounterModalOffer(null);
        setCounterPriceInput('');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'sent'
              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
              : 'bg-white/5 text-brand-sandstone/70 hover:text-white'
          }`}
        >
          My Sent Offers ({offers.filter((o) => o.isBuyer).length})
        </button>
        <button
          onClick={() => setTab('received')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'received'
              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
              : 'bg-white/5 text-brand-sandstone/70 hover:text-white'
          }`}
        >
          Received Offers ({offers.filter((o) => !o.isBuyer).length})
        </button>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="surface-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 border border-white/10">
          <Tag className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="text-base font-black text-white">
            {tab === 'sent' ? 'No offers made yet' : 'No offers received yet'}
          </h3>
          <p className="text-xs text-brand-sandstone/70 leading-relaxed">
            {tab === 'sent'
              ? 'When you propose a price on a marketplace listing, negotiate directly with Caribbean sellers here.'
              : 'When buyers make price proposals on your active listings, you can accept, counteroffer, or decline here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const badge = STATUS_BADGES[offer.status] || STATUS_BADGES.pending;
            const originalDollars = (offer.productPriceMinor / 100).toFixed(2);
            const offeredDollars = (offer.offeredPriceMinor / 100).toFixed(2);
            const counterDollars = offer.counterPriceMinor
              ? (offer.counterPriceMinor / 100).toFixed(2)
              : null;
            const isActionable = offer.status === 'pending' || offer.status === 'countered';

            return (
              <div
                key={offer.id}
                className="surface-card border border-white/10 rounded-3xl p-5 space-y-4 shadow-lg hover:border-white/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="space-y-0.5">
                    <Link
                      href={`/marketplace/${offer.productId}`}
                      className="text-sm font-black text-white hover:text-orange-400 transition-colors line-clamp-1"
                    >
                      {offer.productTitle}
                    </Link>
                    <p className="text-xs text-brand-sandstone/60">
                      {offer.isBuyer ? `Seller: ${offer.otherPartyName}` : `Buyer: ${offer.otherPartyName}`} • Listed at ${originalDollars} {offer.currency}
                    </p>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border self-start sm:self-auto ${badge.badgeClass}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Offer Pricing Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-brand-sandstone/50 uppercase font-black block">Offered Price</span>
                    <span className="text-base font-black text-brand-goldenHour">
                      ${offeredDollars} {offer.currency}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-brand-sandstone/50 uppercase font-black block">Quantity</span>
                    <span className="text-base font-black text-white">{offer.quantity} unit(s)</span>
                  </div>

                  {counterDollars && (
                    <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30">
                      <span className="text-[10px] text-sky-400 uppercase font-black block">Counteroffer</span>
                      <span className="text-base font-black text-sky-300">
                        ${counterDollars} {offer.currency}
                      </span>
                    </div>
                  )}

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-brand-sandstone/50 uppercase font-black block">Expires At</span>
                    <span className="text-xs font-bold text-brand-sandstone/80">
                      {new Date(offer.expiresAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Message if any */}
                {offer.message && (
                  <p className="text-xs text-brand-sandstone/80 italic p-3 rounded-2xl bg-white/5 border border-white/10">
                    &ldquo;{offer.message}&rdquo;
                  </p>
                )}

                {/* Action Buttons */}
                {isActionable && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                    {/* Buyer actions */}
                    {offer.isBuyer ? (
                      <>
                        {offer.status === 'countered' && (
                          <>
                            <button
                              onClick={() => handleAction(offer.id, 'accept')}
                              disabled={isPending}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept Counteroffer
                            </button>
                            <button
                              onClick={() => handleAction(offer.id, 'reject')}
                              disabled={isPending}
                              className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-300 font-bold text-xs hover:bg-rose-500/10 transition-all"
                            >
                              <X className="w-3.5 h-3.5" /> Decline
                            </button>
                          </>
                        )}
                        {offer.status === 'pending' && (
                          <button
                            onClick={() => handleAction(offer.id, 'cancel')}
                            disabled={isPending}
                            className="px-4 py-2 rounded-xl border border-white/15 hover:bg-white/10 text-brand-sandstone text-xs font-bold transition-all"
                          >
                            Cancel My Offer
                          </button>
                        )}
                      </>
                    ) : (
                      /* Seller actions */
                      <>
                        <button
                          onClick={() => handleAction(offer.id, 'accept')}
                          disabled={isPending}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept ${offeredDollars}
                        </button>
                        <button
                          onClick={() => {
                            setCounterModalOffer(offer);
                            setCounterPriceInput(((offer.productPriceMinor + offer.offeredPriceMinor) / 200).toFixed(2));
                          }}
                          disabled={isPending}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Counteroffer
                        </button>
                        <button
                          onClick={() => handleAction(offer.id, 'reject')}
                          disabled={isPending}
                          className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-300 font-bold text-xs hover:bg-rose-500/10 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Counteroffer Modal */}
      {counterModalOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="surface-card border border-sky-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <h3 className="text-lg font-black text-white">Counteroffer to Buyer</h3>
            <p className="text-xs text-brand-sandstone/70">
              Listing: <strong className="text-white">{counterModalOffer.productTitle}</strong> (Listed: ${(counterModalOffer.productPriceMinor / 100).toFixed(2)}, Buyer offered: ${(counterModalOffer.offeredPriceMinor / 100).toFixed(2)})
            </p>

            <form onSubmit={handleCounterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-sandstone/90 mb-1">
                  Proposed Counter Price ($USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={counterPriceInput}
                  onChange={(e) => setCounterPriceInput(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-white/20 rounded-2xl px-4 py-3 text-lg font-black text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterModalOffer(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-white font-bold text-xs hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition-all shadow-md"
                >
                  {isPending ? 'Sending...' : 'Send Counteroffer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
