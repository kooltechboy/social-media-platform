'use client';

import React, { useState, useTransition } from 'react';
import { Wallet, ShoppingBag } from 'lucide-react';
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
        href="/login"
        className="w-full text-center bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
      >
        <Wallet className="w-4 h-4" /> Sign in to Buy
      </Link>
    );
  }

  if (isSeller) {
    return (
      <div className="w-full text-center text-[11px] text-slate-500 py-2">Your product</div>
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
      <div className="space-y-1">
        <p className="text-xs text-emerald-400 text-center font-semibold">Order created — proceed to payment.</p>
        <p className="text-[10px] text-slate-500 text-center font-mono">{state.orderId}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handle}
        disabled={disabled || pending}
        className="w-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wallet className="w-4 h-4" />
        {pending ? 'Processing…' : disabled ? 'Unavailable' : 'Buy with SpotPay'}
      </button>
      {state.error && (
        <p role="alert" className="text-[11px] text-rose-400 text-center">{state.error}</p>
      )}
    </div>
  );
}
