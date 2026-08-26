'use client';

import React, { useState } from 'react';
import { Send, X, ShieldCheck, Sparkles, CheckCircle, Loader2, Globe, ShoppingBag, Zap, GraduationCap, HeartPulse } from 'lucide-react';
import { sendValueToCaribbeanAction, type SendValueActionState } from '../lib/spotpay/actions';

interface SpotPaySendValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalanceFormatted?: string;
}

const DESTINATIONS = [
  { code: 'DOM', name: 'Dominican Republic 🇩🇴', currency: 'DOP', providers: ['Bravo Supermarkets', 'EdeEste Electricidad', 'Farmacias Carol', 'UASD Matrícula'] },
  { code: 'JAM', name: 'Jamaica 🇯🇲', currency: 'JMD', providers: ['Hi-Lo Food Stores', 'JPS Power Utility', 'Fontana Pharmacy', 'UWI Mona Tuition'] },
  { code: 'TTO', name: 'Trinidad & Tobago 🇹🇹', currency: 'TTD', providers: ['Massy Stores', 'T&TEC Electricity', 'SuperPharm', 'UWI St. Augustine'] },
  { code: 'BRB', name: 'Barbados 🇧🇧', currency: 'BBD', providers: ['Popular Supermarket', 'BL&P Electric', 'Lewis Drug Mart', 'BCC Fees'] },
  { code: 'HTG', name: 'Haiti 🇭🇹', currency: 'HTG', providers: ['Carribex Mart', 'EDH Électricité', 'Pharmacie Nationale', 'UniQ Scolarité'] },
  { code: 'BHS', name: 'Bahamas 🇧🇸', currency: 'BSD', providers: ['Super Value Mart', 'BPL Power', 'Lowe’s Pharmacy', 'UB Tuition'] },
];

const CATEGORIES = [
  { id: 'groceries', label: 'Groceries & Food', icon: ShoppingBag, desc: 'Direct digital supermarket voucher' },
  { id: 'utilities', label: 'Electricity / Water / Tel', icon: Zap, desc: 'Instant bill payment to local utility' },
  { id: 'education', label: 'School & University Fees', icon: GraduationCap, desc: 'Tuition & textbook grant voucher' },
  { id: 'healthcare', label: 'Medicine & Pharmacy', icon: HeartPulse, desc: 'Prescription & health clinic credit' },
];

export default function SpotPaySendValueModal({
  isOpen,
  onClose,
  userBalanceFormatted = '$2,450.00 USD',
}: SpotPaySendValueModalProps) {
  const [selectedDest, setSelectedDest] = useState(DESTINATIONS[0]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [amount, setAmount] = useState('50');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [provider, setProvider] = useState(DESTINATIONS[0].providers[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<SendValueActionState>({ error: null, success: null });

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setState({ error: null, success: null });

    const formData = new FormData();
    formData.append('recipientName', recipientName);
    formData.append('recipientPhone', recipientPhone);
    formData.append('destinationCountry', selectedDest.code);
    formData.append('category', selectedCategory);
    formData.append('provider', provider);
    formData.append('amount', amount);

    try {
      const res = await sendValueToCaribbeanAction({ error: null, success: null }, formData);
      setState(res);
      if (res.success) {
        setTimeout(() => {
          onClose();
          setState({ error: null, success: null });
        }, 3500);
      }
    } catch (err: any) {
      setState({ error: err.message || 'Transaction failed', success: null });
    } finally {
      setIsSubmitting(false);
    }
  }

  const amountNum = parseFloat(amount) || 0;
  const partnerFee = Math.round(amountNum * 0.035 * 100) / 100; // 3.5% partner fulfillment
  const totalCharge = (amountNum + partnerFee).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-twilight/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-dusk border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-sunriseCoral to-brand-goldenHour text-white shadow-lg shadow-brand-sunriseCoral/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-lg text-brand-sandstone flex items-center gap-2">
              Send Value to Homeland <Sparkles className="w-4 h-4 text-brand-goldenHour" />
            </h3>
            <p className="text-xs text-brand-sandstone/60">
              Diaspora Direct: Groceries, Utility Bills & Healthcare with 0% money-loss
            </p>
          </div>
        </div>

        {state.success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-brand-sandstone">Voucher Dispatched!</h4>
            <p className="text-sm text-slate-300 max-w-md mx-auto">{state.success}</p>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 px-4 py-2 rounded-full">
              <ShieldCheck className="w-4 h-4" /> Double-Entry Ledger Settled &bull; MTO Partner Verified
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {state.error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {state.error}
              </div>
            )}

            {/* Destination Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Destination Island / Country
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DESTINATIONS.map((d) => (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => {
                      setSelectedDest(d);
                      setProvider(d.providers[0]);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      selectedDest.code === d.code
                        ? 'border-brand-sunriseCoral bg-brand-sunriseCoral/15 text-white shadow-md'
                        : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Value Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Value Purpose
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        isSelected
                          ? 'border-brand-goldenHour bg-brand-goldenHour/10 text-white'
                          : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-brand-goldenHour' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-black">{cat.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{cat.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Merchant / Provider Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Fulfillment Partner ({selectedDest.name.split(' ')[0]})
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-sunriseCoral"
              >
                {selectedDest.providers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">Recipient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Almonte"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">Recipient Mobile (For SMS Pin)</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (809) 555-0192"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-sunriseCoral"
                />
              </div>
            </div>

            {/* Amount Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Voucher Amount (USD)</label>
                <span className="text-[11px] text-slate-400">Wallet Available: <strong className="text-emerald-400">{userBalanceFormatted}</strong></span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['25', '50', '100', '250'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-2 rounded-xl border text-xs font-black transition-all ${
                      amount === amt
                        ? 'border-brand-sunriseCoral bg-brand-sunriseCoral text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-400">$</span>
                <input
                  type="number"
                  min="5"
                  max="2000"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-brand-sunriseCoral"
                  placeholder="Custom amount..."
                />
              </div>
            </div>

            {/* Breakdown summary */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Value delivered to {recipientName || 'Recipient'}:</span>
                <span className="font-bold text-white">${amountNum.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>MTO & Local Merchant Settlement (3.5%):</span>
                <span className="font-bold text-slate-300">${partnerFee.toFixed(2)} USD</span>
              </div>
              <div className="border-t border-slate-800 pt-1.5 flex justify-between font-black text-white">
                <span>Total SpotPay Deduction:</span>
                <span className="text-brand-sunriseCoral">${totalCharge} USD</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || amountNum <= 0}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-sunriseCoral via-brand-goldenHour to-brand-sunriseCoral bg-[length:200%_auto] hover:bg-right font-black text-white text-xs tracking-wider uppercase transition-all shadow-lg shadow-brand-sunriseCoral/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Ledger Transfer...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Issue Instant Value Voucher (${totalCharge} USD)
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
