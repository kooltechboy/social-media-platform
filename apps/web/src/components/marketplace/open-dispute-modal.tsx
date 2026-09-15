'use client';

import React, { useState, useTransition } from 'react';
import { ShieldCheck, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { openDisputeAction } from '../../lib/marketplace/actions';
import { DISPUTE_REASON_METADATA, type DisputeReason } from '@caribbean/marketplace';

interface OpenDisputeModalProps {
  initialOrderId?: string;
  isOpen: boolean;
  onClose: () => void;
  availableOrders?: Array<{ id: string; total_minor: number; currency: string }>;
}

export default function OpenDisputeModal({
  initialOrderId = '',
  isOpen,
  onClose,
  availableOrders = [],
}: OpenDisputeModalProps) {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [reason, setReason] = useState<DisputeReason>('not_received');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const activeOrderId = orderId.trim();
    if (!activeOrderId) {
      setError('Please provide a valid Order ID.');
      return;
    }
    if (!buyerNotes.trim() || buyerNotes.trim().length < 10) {
      setError('Please provide a detailed explanation of the issue (at least 10 characters).');
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append('orderId', activeOrderId);
      fd.append('reason', reason);
      fd.append('buyerNotes', buyerNotes);

      const res = await openDisputeAction({ error: null, success: null }, fd);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Dispute claim successfully filed. Case assigned to TUKUBI Resolution Center.');
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    });
  };

  const reasonList = Object.entries(DISPUTE_REASON_METADATA) as [DisputeReason, { label: string; description: string }][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="surface-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-sandstone/60 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-wider">TUKUBI Resolution Center</span>
          </div>
          <h2 className="text-xl font-black text-white">Open a Buyer Protection Dispute</h2>
          <p className="text-xs text-brand-sandstone/70">
            All marketplace transactions are backed by Caribbean Double-Entry Escrow. If your order arrived damaged, incorrect, or failed to arrive, open a formal case below.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order ID Selection / Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-sandstone/80 block">Order Identifier</label>
            {availableOrders.length > 0 ? (
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="" className="bg-slate-900 text-slate-300">
                  Select an eligible order…
                </option>
                {availableOrders.map((o) => (
                  <option key={o.id} value={o.id} className="bg-slate-900 text-white">
                    Order #{o.id.slice(0, 8).toUpperCase()} — ${(o.total_minor / 100).toFixed(2)} {o.currency}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter full or partial order UUID"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            )}
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-sandstone/80 block">Reason for Dispute</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {reasonList.map(([key, meta]) => (
                <option key={key} value={key} className="bg-slate-900 text-white">
                  {meta.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-brand-sandstone/50">
              {DISPUTE_REASON_METADATA[reason]?.description}
            </p>
          </div>

          {/* Detailed Statement */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-sandstone/80 block">
              Case Details &amp; Supporting Description
            </label>
            <textarea
              rows={4}
              value={buyerNotes}
              onChange={(e) => setBuyerNotes(e.target.value)}
              placeholder="Describe what occurred, dates, tracking discrepancies, or seller interaction history..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-brand-sandstone/70 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || Boolean(success)}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Submit Dispute Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
