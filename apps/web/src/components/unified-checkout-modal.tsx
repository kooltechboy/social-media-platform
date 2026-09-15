'use client';

import React, { useState, useTransition } from 'react';
import {
  CreditCard,
  CheckCircle,
  X,
  ShieldCheck,
  Lock,
  Loader2,
  ArrowRight,
  Globe,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Money, isMarketplaceCommerceActive } from '@caribbean/payments';

export interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    priceMinor: number;
    currency: string;
    sellerName: string;
    productKind: 'physical' | 'digital' | 'service';
    origin?: string;
  };
  creatorReferralCode?: string;
}

type PaymentMethodType = 'paypal' | 'card';

export default function UnifiedCheckoutModal({
  isOpen,
  onClose,
  product,
  creatorReferralCode,
}: UnifiedCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('paypal');
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    addressLine: '',
    city: '',
    country: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const canTransact = isMarketplaceCommerceActive();

  const unitPrice = new Money(product.priceMinor, product.currency);
  const subtotalMinor = product.priceMinor * quantity;
  const subtotal = new Money(subtotalMinor, product.currency);

  // Standard pass-through payment processing fee (2.9% + 30¢)
  const processingFeeMinor = Math.round((subtotalMinor * 290) / 10000) + 30;
  const processingFee = new Money(processingFeeMinor, product.currency);

  const totalMinor = subtotalMinor + processingFeeMinor;
  const total = new Money(totalMinor, product.currency);

  function handleCompletePayment(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!canTransact) {
      setErrorMessage(
        'Marketplace transactions officially begin September 30, 2026. You can explore stores and products now. Purchasing will be available when marketplace commerce launches.'
      );
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            quantity,
            provider: selectedMethod,
            creatorReferralCode,
            shippingAddress: product.productKind === 'physical' ? shippingAddress : undefined,
            returnUrl: `${window.location.origin}/financial-center/transactions?status=success`,
            cancelUrl: `${window.location.origin}/marketplace?status=cancelled`,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrorMessage(data.error || 'Payment initiation failed. Please try again.');
          return;
        }

        if (data.redirectUrl) {
          setRedirecting(true);
          window.location.href = data.redirectUrl;
          return;
        }

        if (data.status === 'succeeded') {
          window.location.href = `/financial-center/transactions?status=success&intentId=${data.intentId}`;
          return;
        }

        setErrorMessage('Payment requires further authorization with the provider.');
      } catch (err: any) {
        setErrorMessage(err?.message || 'Network error initiating checkout. Please try again.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          disabled={redirecting || isPending}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        {redirecting ? (
          <div className="py-12 text-center space-y-4 animate-fadeIn">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Connecting to PayPal...</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Redirecting to PayPal for secure transaction authorization. Complete the approval to finalize your order.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCompletePayment} className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-brand-sunriseCoral uppercase tracking-widest">
                  TUKUBI Marketplace
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-bit Encrypted</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">{product.title}</h2>
              <p className="text-xs text-slate-400">Sold by {product.sellerName} • {product.origin || 'Caribbean'}</p>
            </div>

            {/* Pre-launch notification banner */}
            {!canTransact && (
              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-orange-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Marketplace Transactions Launch September 30, 2026</span>
                </div>
                <p className="text-[11px] leading-relaxed text-orange-200/90 font-medium">
                  Merchants can create their stores, add products and services, and prepare their businesses now. Buyer and seller transactions will officially begin September 30, 2026.
                </p>
                <p className="text-[11px] text-orange-300 font-semibold">
                  You can explore stores and products now. Purchasing will be available when marketplace commerce launches.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Order Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!canTransact || isPending}
                    className="w-6 h-6 rounded bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="font-bold text-white w-4 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={!canTransact || isPending}
                    className="w-6 h-6 rounded bg-slate-800 text-white font-bold flex items-center justify-center hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-800/80 pt-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Product Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span className="text-white font-semibold">{subtotal.format()}</span>
                </div>
                {product.productKind === 'physical' && (
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping &amp; Handling</span>
                    <span className="text-emerald-400 font-semibold">Free Caribbean Standard</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Pass-Through Processing Fee</span>
                  <span className="text-slate-300 font-semibold">{processingFee.format()}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
                  <span>Total at Checkout</span>
                  <span className="text-brand-sunriseCoral">{total.format()} {product.currency}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector — Only active operational methods */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200 block">Payment Method Options</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* PayPal (Primary supported payment path) */}
                <div
                  onClick={() => !isPending && setSelectedMethod('paypal')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'paypal'
                      ? 'bg-slate-800 border-blue-400 text-white shadow-md ring-1 ring-blue-400/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold">PayPal</div>
                      <div className="text-[10px] text-slate-400">Global diaspora rail</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Primary
                  </span>
                </div>

                {/* Credit / Debit Card */}
                <div
                  onClick={() => !isPending && setSelectedMethod('card')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedMethod === 'card'
                      ? 'bg-slate-800 border-brand-sunriseCoral text-white shadow-md ring-1 ring-brand-sunriseCoral/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-brand-sunriseCoral" />
                    <div>
                      <div className="text-xs font-bold">Credit / Debit Card</div>
                      <div className="text-[10px] text-slate-400">Visa, Mastercard</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                </div>
              </div>
            </div>

            {/* Shipping Address for Physical Goods */}
            {product.productKind === 'physical' && (
              <div className="space-y-3 pt-1">
                <label className="text-xs font-bold text-slate-200 block">Delivery Address (Caribbean &amp; Diaspora)</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-sunriseCoral"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Street Address, Apt / Suite"
                    value={shippingAddress.addressLine}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-sunriseCoral"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City / Parish"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-sunriseCoral"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Country (e.g. Jamaica, Trinidad)"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-sunriseCoral"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>TUKUBI Buyer Protection: Double-entry verified financial ledger guarantee.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canTransact || isPending}
                className="flex-1 py-3 px-4 rounded-xl bg-brand-sunriseCoral hover:bg-brand-sunriseCoral/90 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-sunriseCoral/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize {total.format()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
