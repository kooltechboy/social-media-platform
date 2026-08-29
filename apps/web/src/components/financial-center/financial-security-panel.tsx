'use client';

import React from 'react';
import { ShieldCheck, Key, Lock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function FinancialSecurityPanel() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white">Payment &amp; Financial Security</h2>
        <p className="text-xs text-slate-400">
          Cryptographic security controls, tokenization policies, and access safeguards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tokenization & Vaulting */}
        <div className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">PCI-DSS Tokenization</h3>
              <p className="text-[11px] text-slate-400">Zero Raw Card Data Principle</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All credit and debit card PANs and CVVs are directly tokenized by PCI Service Provider Level 1 certified vaults (Stripe, CX Pay, WiPay). TUKUBI never processes, stores, or sees unencrypted card details.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Active on all payment forms
          </div>
        </div>

        {/* Double-Entry Ledger Protection */}
        <div className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-sunriseCoral/10 text-brand-sunriseCoral">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cryptographic Idempotency</h3>
              <p className="text-[11px] text-slate-400">Replay &amp; Double-Charge Shield</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every transaction, refund, and payout request requires a unique 128-bit idempotency key. Duplicate clicks or network retries are automatically deduplicated by the database kernel.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-brand-sunriseCoral">
            <CheckCircle2 className="w-4 h-4" /> Server-side idempotency enforced
          </div>
        </div>

        {/* 3D Secure 2.0 & Fraud Detection */}
        <div className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">3D Secure 2.0 Authentication</h3>
              <p className="text-[11px] text-slate-400">Biometric &amp; Cardholder Verification</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Transactions meeting risk or regulatory thresholds automatically trigger step-up biometric verification (Apple Pay, Google Pay) or bank-issued OTP challenges.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-purple-400">
            <CheckCircle2 className="w-4 h-4" /> 3DS 2.0 dynamic routing active
          </div>
        </div>

        {/* Suspicious Activity Reporting */}
        <div className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Security Inquiries</h3>
              <p className="text-[11px] text-slate-400">Trust &amp; Safety Team</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If you notice unrecognized transactions or suspicious activity on your account, our 24/7 Trust &amp; Safety team can place an immediate security lock on transaction authorizations.
          </p>
          <div className="pt-2">
            <a
              href="/moderation/appeals"
              className="text-xs font-bold text-brand-goldenHour hover:underline"
            >
              Contact Trust &amp; Safety →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
