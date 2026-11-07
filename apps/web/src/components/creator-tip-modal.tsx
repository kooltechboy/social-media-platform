'use client';

import React, { useState, useTransition } from 'react';
import {
  Heart,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { tipCreatorAction } from '@/lib/creator/monetization-actions';

interface CreatorTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  creatorHandle: string;
  creatorId?: string;
}

const PRESET_TIPS = [2, 5, 10, 25, 50];

export default function CreatorTipModal({
  isOpen,
  onClose,
  creatorName,
  creatorHandle,
  creatorId,
}: CreatorTipModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(5);
  const [customAmount, setCustomAmount] = useState<string>('5');
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedTxId, setCompletedTxId] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericDollar = parseFloat(customAmount) || 0;
  const amountMinor = Math.round(numericDollar * 100);

  function handlePresetClick(val: number) {
    setSelectedPreset(val);
    setCustomAmount(val.toString());
    setErrorMsg(null);
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (PRESET_TIPS.includes(parsed)) {
      setSelectedPreset(parsed);
    } else {
      setSelectedPreset(null);
    }
    setErrorMsg(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (amountMinor < 100) {
      setErrorMsg('Minimum tip is $1.00 USD.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await tipCreatorAction({
          creatorId,
          creatorHandle,
          amountMinor,
          currency: 'USD',
          message: message.trim() || undefined,
          isAnonymous,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to send tip.');
        } else {
          setCompletedTxId(res.transactionId || 'confirmed');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Network error processing tip.');
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-brand-sandstone/60 hover:text-white hover:bg-white/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {completedTxId ? (
          /* Confirmation Screen */
          <div className="py-4 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Tip Confirmed &amp; Credited
              </span>
              <h3 className="font-extrabold text-xl text-white pt-1">
                Thank You for Supporting {creatorName}!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                Your tip of <strong className="text-emerald-400">${(amountMinor / 100).toFixed(2)} USD</strong> has been directly credited to @{creatorHandle}&apos;s verified creator ledger balance.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-bold text-white">@{creatorHandle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ledger Reference:</span>
                <span className="font-mono text-emerald-300 text-[11px] truncate max-w-[180px]">
                  {completedTxId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Guarantee:</span>
                <span className="text-brand-goldenHour font-semibold text-[11px]">Double-Entry Settled</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:opacity-95 text-slate-950 font-black py-3 rounded-2xl text-xs sm:text-sm min-h-[44px] cursor-pointer shadow-lg"
            >
              Done
            </button>
          </div>
        ) : (
          /* Interactive Tipping Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3.5 pr-8">
              <div className="p-3.5 rounded-2xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30 shrink-0">
                <Heart className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-goldenHour/15 text-brand-goldenHour border border-brand-goldenHour/30">
                    Direct Creator Tip
                  </span>
                </div>
                <h3 className="font-black text-lg text-white flex items-center gap-1.5 pt-0.5">
                  Support {creatorName} <Sparkles className="w-4 h-4 text-brand-goldenHour" />
                </h3>
                <p className="text-xs text-brand-sandstone/70">@{creatorHandle}</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Amount Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Select Tip Amount (USD)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_TIPS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`py-2 rounded-xl font-bold text-xs transition-all border cursor-pointer min-h-[40px] flex items-center justify-center ${
                      selectedPreset === preset
                        ? 'bg-brand-sunriseCoral text-slate-950 border-brand-sunriseCoral shadow-md ring-2 ring-brand-sunriseCoral/50'
                        : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="Custom amount"
                  className="w-full min-h-[42px] rounded-xl bg-slate-900 border border-slate-700 pl-8 pr-16 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  USD
                </span>
              </div>
            </div>

            {/* Encouragement Note */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Message of appreciation <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <textarea
                rows={2}
                maxLength={280}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Love your riddims and island content! Keep inspiring..."
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-sunriseCoral resize-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 px-1">
                <span>Direct to creator</span>
                <span>{message.length} / 280</span>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-brand-sunriseCoral focus:ring-brand-sunriseCoral cursor-pointer"
              />
              <span>Send tip anonymously</span>
            </label>

            {/* Double-entry Ledger Guarantee */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-[11px] text-brand-sandstone/70">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>95% goes directly to @{creatorHandle}. Verified double-entry settlement.</span>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isPending || amountMinor < 100}
                className="w-full bg-gradient-to-r from-brand-sunriseCoral via-pink-600 to-brand-goldenHour hover:opacity-95 text-slate-950 font-black py-3 rounded-2xl text-xs sm:text-sm min-h-[44px] flex items-center justify-center gap-2 shadow-lg shadow-brand-sunriseCoral/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Tip...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-slate-950" />
                    <span>Send ${(amountMinor > 0 ? amountMinor / 100 : 0).toFixed(2)} USD Tip</span>
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
