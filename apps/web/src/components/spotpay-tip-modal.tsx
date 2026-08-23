'use client';

import React, { useState } from 'react';
import { Wallet, X, Heart, Sparkles, CheckCircle, Loader2 } from 'lucide-react';

interface SpotPayTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  creatorHandle: string;
  creatorId?: string;
}

const TIP_AMOUNTS = [2, 5, 10, 25, 50];

export default function SpotPayTipModal({
  isOpen,
  onClose,
  creatorName,
  creatorHandle,
  creatorId,
}: SpotPayTipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  async function handleSendTip(e: React.FormEvent) {
    e.preventDefault();
    if (finalAmount <= 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { sendTipAction } = await import('../lib/creator/actions');
      const result = await sendTipAction(creatorHandle, Math.round(finalAmount * 100), message);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to process tip');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">SpotPay Tip Sent!</h3>
            <p className="text-xs text-slate-300">
              You sent <span className="font-bold text-emerald-400">${finalAmount.toFixed(2)} USD</span> to @{creatorHandle}.
            </p>
            <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Settled via Double-Entry Ledger
            </span>
          </div>
        ) : (
          <form onSubmit={handleSendTip} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-1.5">
                  Tip {creatorName} <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400">Direct creator patronage via SpotPay Wallet</p>
              </div>
            </div>

            {/* Quick Amount Pills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Select Tip Amount (USD)</label>
              <div className="grid grid-cols-5 gap-2">
                {TIP_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      !customAmount && selectedAmount === amt
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Or enter custom amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Custom amount"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Attached note (optional)</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Big up your work! Keep inspiring the diaspora."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              {error && (
                <p className="text-rose-400 text-xs mb-2 font-medium">{error}</p>
              )}
              <button
                type="submit"
                disabled={isProcessing || finalAmount <= 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Settling on Ledger...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-slate-950" />
                    <span>Send ${finalAmount.toFixed(2)} USD Tip</span>
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
