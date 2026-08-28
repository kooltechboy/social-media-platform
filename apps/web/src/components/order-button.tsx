'use client';

import React, { useState, useTransition } from 'react';
import { Wallet, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createOrderAction, type MarketplaceActionState } from '../lib/marketplace/actions';

interface Props {
  productId: string;
  disabled: boolean;
  isAuthenticated: boolean;
  isSeller: boolean;
}

const INITIAL: MarketplaceActionState = { error: null, success: null };

export default function OrderButton({ productId, disabled, isAuthenticated, isSeller }: Props) {
  const [state, setState] = useState<MarketplaceActionState>(INITIAL);
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <Link
        href="/login?redirect=/marketplace"
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

  const handle = () => {
    const formData = new FormData();
    formData.set('productId', productId);
    formData.set('quantity', '1');
    startTransition(() => {
      void createOrderAction(INITIAL, formData).then((result) => {
        setState(result);
      });
    });
  };

  if (state.orderId) {
    return (
      <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-1.5 text-center">
        <p className="text-xs text-orange-400 font-bold flex items-center justify-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Order #{state.orderId.slice(0, 8)} Created!
        </p>
        <Link
          href="/spotpay"
          className="inline-block text-[11px] font-bold text-slate-950 bg-orange-500 hover:bg-orange-400 px-3 py-1 rounded-lg transition-all"
        >
          View SpotPay Escrow →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handle}
        disabled={disabled || pending}
        className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Wallet className="w-4 h-4" />
        {pending ? 'Processing Escrow…' : disabled ? 'Unavailable' : 'Buy with SpotPay'}
      </button>
      {state.error && (
        <p role="alert" className="text-[11px] text-rose-400 text-center font-medium">{state.error}</p>
      )}
    </div>
  );
}
