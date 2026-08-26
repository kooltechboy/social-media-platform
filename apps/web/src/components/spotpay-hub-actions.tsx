'use client';

import React, { useState } from 'react';
import { Send, ArrowDownLeft, Globe, CreditCard, Sparkles, PlusCircle } from 'lucide-react';
import SpotPaySendValueModal from './spotpay-send-value-modal';
import SpotPayWithdrawModal from './spotpay-withdraw-modal';

interface SpotPayHubActionsProps {
  walletBalanceFormatted: string;
}

export default function SpotPayHubActions({ walletBalanceFormatted }: SpotPayHubActionsProps) {
  const [isSendValueOpen, setIsSendValueOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsSendValueOpen(true)}
          className="bg-gradient-to-r from-brand-sunriseCoral to-brand-goldenHour hover:opacity-95 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-sunriseCoral/20 transition-all hover:scale-[1.02]"
        >
          <Globe className="w-4 h-4 text-white" />
          <span>Send Value to Homeland</span>
          <span className="bg-white/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">0% Loss</span>
        </button>

        <button
          type="button"
          onClick={() => setIsWithdrawOpen(true)}
          className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          <span>Withdraw / Cash Out</span>
        </button>
      </div>

      <SpotPaySendValueModal
        isOpen={isSendValueOpen}
        onClose={() => setIsSendValueOpen(false)}
        userBalanceFormatted={walletBalanceFormatted}
      />

      <SpotPayWithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        userBalanceFormatted={walletBalanceFormatted}
      />
    </>
  );
}
