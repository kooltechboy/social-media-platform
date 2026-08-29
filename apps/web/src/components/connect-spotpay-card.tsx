'use client';

import React, { useState } from 'react';
import { Wallet, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Zap, X } from 'lucide-react';
import Link from 'next/link';

interface ConnectSpotPayCardProps {
  onDismiss?: () => void;
  isDismissable?: boolean;
}

export default function ConnectSpotPayCard({
  onDismiss,
  isDismissable = true,
}: ConnectSpotPayCardProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  function handleConnect() {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 1200);
  }

  if (isConnected) {
    return (
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-brand-dusk to-purple-950/40 border border-purple-500/40 shadow-xl space-y-2 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">SpotPay Account Connected!</h4>
              <p className="text-[11px] text-slate-300">Your digital wallet is active for 1-click checkout and creator tipping.</p>
            </div>
          </div>
          <Link
            href="/spotpay"
            className="text-[11px] font-bold text-brand-goldenHour hover:underline flex items-center gap-1"
          >
            Manage Wallet →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-5 rounded-3xl bg-gradient-to-br from-purple-950/50 via-brand-dusk to-slate-900 border border-purple-500/30 shadow-xl space-y-4">
      {isDismissable && onDismiss && (
        <button
          type="button"
          onClick={() => {
            setIsDismissed(true);
            onDismiss();
          }}
          className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="space-y-1 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/30">
              TUKUBI × SpotPay
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Financial Layer</span>
          </div>
          <h3 className="text-sm font-black text-white">Connect Your SpotPay Wallet</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Link SpotPay to unlock instant 1-click purchases, zero-fee creator tipping, and cross-border money movement without leaving TUKUBI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1 border-t border-purple-900/40">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-brand-goldenHour shrink-0" />
          <span>Instant Settlement</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-sunriseCoral shrink-0" />
          <span>0% Cut on Seller Plans</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Double-Entry Escrow</span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
        >
          {isConnecting ? (
            'Connecting SpotPay...'
          ) : (
            <>
              <span>Connect SpotPay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsDismissed(true);
            if (onDismiss) onDismiss();
          }}
          className="text-xs text-slate-400 hover:text-white font-medium px-3 py-2 cursor-pointer"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
