'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Money } from '@caribbean/payments';
import { DISPUTE_REASON_METADATA, type DisputeReason } from '@caribbean/marketplace';
import OpenDisputeModal from './open-dispute-modal';

export interface DisputeItem {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  disputedAmountMinor: number;
  currency: string;
  buyerNotes: string;
  sellerNotes?: string | null;
  resolutionSummary?: string | null;
  createdAt: string;
  sellerName: string;
}

interface DisputesManagerClientProps {
  disputes: DisputeItem[];
  availableOrders: Array<{ id: string; total_minor: number; currency: string }>;
  initialOrderId?: string;
}

const STATUS_BADGES: Record<string, { label: string; badgeClass: string }> = {
  open: { label: 'Case Opened', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  seller_responded: { label: 'Seller Responded', badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  under_review: { label: 'Under TUKUBI Review', badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  resolved_refund: { label: 'Resolved: Refund Issued', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  resolved_seller: { label: 'Resolved: Seller Upheld', badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
  closed: { label: 'Case Closed', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
};

export default function DisputesManagerClient({
  disputes,
  availableOrders,
  initialOrderId = '',
}: DisputesManagerClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(Boolean(initialOrderId));

  return (
    <div className="space-y-6">
      {/* Top Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active &amp; Past Claims</h2>
          <p className="text-xs text-brand-sandstone/60">Manage mediator reviews, statements, and refund outcomes</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Open New Dispute Case
        </button>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="surface-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 border border-white/10 shadow-xl">
          <CheckCircle className="w-12 h-12 text-emerald-400/60 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">No active dispute cases</h3>
            <p className="text-xs text-brand-sandstone/70 leading-relaxed">
              Your transactions and orders are in good standing. If you ever need support with an item not received or damaged in transit, you can open a dispute case below.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20"
            >
              Open a Dispute
            </button>
            <Link
              href="/marketplace/orders"
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
            >
              View My Orders
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => {
            const reasonMeta = DISPUTE_REASON_METADATA[d.reason as DisputeReason] || {
              label: d.reason,
              description: '',
            };
            const badge = STATUS_BADGES[d.status] || STATUS_BADGES.open;
            const amount = new Money(d.disputedAmountMinor, d.currency);

            return (
              <div
                key={d.id}
                className="surface-card border border-white/10 rounded-3xl p-5 space-y-3 shadow-lg hover:border-white/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs text-brand-sandstone/50 font-bold">
                      Case #{d.id.slice(0, 8).toUpperCase()} • Order #{d.orderId.slice(0, 8).toUpperCase()}
                    </span>
                    <h3 className="text-sm font-black text-white">{reasonMeta.label}</h3>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border self-start sm:self-auto ${badge.badgeClass}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-brand-sandstone/50 uppercase font-black block">Disputed Amount</span>
                    <span className="text-base font-black text-brand-goldenHour">{amount.format()}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-brand-sandstone/50 uppercase font-black block">Merchant</span>
                    <span className="text-xs font-bold text-white truncate block">
                      {d.sellerName}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-brand-sandstone/50 uppercase font-black block">Opened On</span>
                    <span className="text-xs font-bold text-brand-sandstone/80">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-brand-sandstone/80 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <strong className="text-white">Claim Statement:</strong> {d.buyerNotes}
                </p>

                {d.resolutionSummary && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                    <strong>Resolution Determination:</strong> {d.resolutionSummary}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for opening a dispute */}
      <OpenDisputeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialOrderId={initialOrderId}
        availableOrders={availableOrders}
      />
    </div>
  );
}
