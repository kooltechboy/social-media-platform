'use client';

import React, { useState } from 'react';
import { CreditCard, X, ShieldCheck, CheckCircle, Loader2, ArrowDownLeft, Building, Zap } from 'lucide-react';
import { instantWithdrawAction, type WithdrawActionState } from '../lib/spotpay/actions';

interface SpotPayWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalanceFormatted?: string;
}

export default function SpotPayWithdrawModal({
  isOpen,
  onClose,
  userBalanceFormatted = '$2,450.00 USD',
}: SpotPayWithdrawModalProps) {
  const [methodKind, setMethodKind] = useState<'instant_card' | 'ach_bank'>('instant_card');
  const [amount, setAmount] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<WithdrawActionState>({ error: null, success: null });

  if (!isOpen) return null;

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setState({ error: null, success: null });

    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('methodKind', methodKind);

    try {
      const res = await instantWithdrawAction({ error: null, success: null }, formData);
      setState(res);
      if (res.success) {
        setTimeout(() => {
          onClose();
          setState({ error: null, success: null });
        }, 3000);
      }
    } catch (err: any) {
      setState({ error: err.message || 'Withdrawal failed', success: null });
    } finally {
      setIsSubmitting(false);
    }
  }

  const amountNum = parseFloat(amount) || 0;
  const fee = methodKind === 'instant_card' ? Math.max(0.5, Math.round(amountNum * 0.015 * 100) / 100) : 0;
  const netReceived = Math.max(0, amountNum - fee);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-3 rounded-2xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral border border-brand-sunriseCoral/30">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-lg text-brand-sandstone">Withdraw from SpotPay</h3>
            <p className="text-xs text-brand-sandstone/60">Transfer wallet balance to your linked bank or card</p>
          </div>
        </div>

        {state.success ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black text-white">Transfer Initiated!</h4>
            <p className="text-xs text-slate-300">{state.success}</p>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4">
            {state.error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {state.error}
              </div>
            )}

            {/* Payout Rail Choice */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Payout Speed & Destination
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethodKind('instant_card')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    methodKind === 'instant_card'
                      ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/15 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Zap className={`w-4 h-4 ${methodKind === 'instant_card' ? 'text-brand-goldenHour' : 'text-slate-500'}`} />
                    <span className="text-[10px] font-black uppercase text-amber-400">1.5% Fee</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-black text-white">Instant Card</div>
                    <div className="text-[10px] text-slate-400">Arrives in seconds</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethodKind('ach_bank')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    methodKind === 'ach_bank'
                      ? 'border-emerald-500 bg-emerald-500/15 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Building className={`w-4 h-4 ${methodKind === 'ach_bank' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-[10px] font-black uppercase text-emerald-400">Free</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-black text-white">Bank Transfer</div>
                    <div className="text-[10px] text-slate-400">1–2 business days</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Amount to Withdraw (USD)</label>
                <span className="text-[11px] text-slate-400">Available: <strong className="text-emerald-400">{userBalanceFormatted}</strong></span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['50', '100', '250', '500'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      amount === amt
                        ? 'border-brand-sunriseCoral bg-brand-sunriseCoral text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="5"
                max="5000"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-brand-sunriseCoral"
              />
            </div>

            {/* Summary */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Requested Amount:</span>
                <span className="font-bold text-white">${amountNum.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Processing Fee ({methodKind === 'instant_card' ? '1.5%' : '0%'}):</span>
                <span className="font-bold text-slate-300">${fee.toFixed(2)} USD</span>
              </div>
              <div className="border-t border-slate-800 pt-1.5 flex justify-between font-black text-white">
                <span>Net Deposited to Account:</span>
                <span className="text-emerald-400">${netReceived.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || amountNum < 5}
              className="w-full py-3 rounded-2xl bg-brand-sunriseCoral hover:bg-brand-goldenHour font-black text-white text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Ledger Outflow...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Withdraw ${amountNum.toFixed(2)} USD
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
