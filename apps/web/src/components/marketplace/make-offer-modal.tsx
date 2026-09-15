'use client';

import React, { useState, useTransition } from 'react';
import { Tag, X, Clock, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { submitOfferAction } from '../../lib/marketplace/actions';

interface MakeOfferModalProps {
  productId: string;
  productTitle: string;
  currentPriceMinor: number;
  currency: string;
  sellerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MakeOfferModal({
  productId,
  productTitle,
  currentPriceMinor,
  currency,
  sellerName,
  isOpen,
  onClose,
}: MakeOfferModalProps) {
  const [offeredPrice, setOfferedPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const currentDollars = currentPriceMinor / 100;
  const numericOffer = parseFloat(offeredPrice) || 0;
  const discountPercent =
    numericOffer > 0 && currentDollars > 0
      ? Math.round(((currentDollars - numericOffer) / currentDollars) * 100)
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (numericOffer <= 0) {
      setError('Please enter a valid positive offer amount.');
      return;
    }

    if (numericOffer >= currentDollars) {
      setError('Offer should be below the current listing price. If paying full price, use Buy Now.');
      return;
    }

    const formData = new FormData();
    formData.set('productId', productId);
    formData.set('offeredPrice', numericOffer.toString());
    formData.set('quantity', quantity.toString());
    formData.set('message', message);

    startTransition(async () => {
      const res = await submitOfferAction({ error: null, success: null }, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(res.success || 'Offer submitted successfully!');
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="surface-card border border-orange-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-sandstone/60 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-black uppercase tracking-wider">
            <Tag className="w-4 h-4" /> Make an Offer
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">{productTitle}</h2>
          <p className="text-xs text-brand-sandstone/70">
            Sold by <strong className="text-white">{sellerName}</strong> • Current Price:{' '}
            <span className="font-bold text-brand-goldenHour">
              ${currentDollars.toFixed(2)} {currency}
            </span>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
              Your Offer Amount (${currency})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-brand-sandstone/50">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={currentDollars}
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                placeholder={(currentDollars * 0.9).toFixed(2)}
                required
                className="w-full bg-slate-950/80 border border-white/20 rounded-2xl pl-9 pr-4 py-3 text-lg font-black text-white placeholder-brand-sandstone/30 focus:outline-none focus:border-orange-500"
              />
            </div>
            {discountPercent > 0 && (
              <p className="text-[11px] font-bold text-orange-400 mt-1">
                {discountPercent}% off asking price
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
              Quantity
            </label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950/80 border border-white/20 rounded-2xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-orange-500"
            >
              {[1, 2, 3, 4, 5, 10].map((q) => (
                <option key={q} value={q}>
                  {q} {q === 1 ? 'unit' : 'units'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-sandstone/90 mb-1.5">
              Note to Seller (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Can pick up this Saturday in Kingston, or ship to Montego Bay..."
              rows={3}
              className="w-full bg-slate-950/80 border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-brand-sandstone/40 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="surface-card p-3 rounded-2xl border border-white/10 flex items-center justify-between text-[11px] text-brand-sandstone/70">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" /> 48-Hour Seller Window
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Buyer Protection Active
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-white/15 text-white font-bold text-xs hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !!success}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all shadow-md shadow-orange-500/20"
            >
              {isPending ? 'Submitting Offer...' : 'Send Offer to Seller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
