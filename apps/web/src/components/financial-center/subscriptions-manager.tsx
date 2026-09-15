'use client';

import React, { useState } from 'react';
import { Repeat, Sparkles, UserCheck, AlertCircle, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { Money } from '@caribbean/payments';
import Link from 'next/link';

export interface PlatformSubscriptionItem {
  id: string;
  tierId: string;
  tierName: string;
  tierDescription?: string;
  targetType: string;
  billingInterval: string;
  priceMinor: number;
  currency: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentProvider: string;
}

export interface CreatorSubscriptionItem {
  id: string;
  tier: string;
  planName?: string;
  planDescription?: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatarUrl?: string;
  priceMinor: number;
  currency: string;
  billingSource: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionsManagerProps {
  platformSubscriptions: PlatformSubscriptionItem[];
  creatorSubscriptions: CreatorSubscriptionItem[];
}

export default function SubscriptionsManager({
  platformSubscriptions: initialPlatformSubs,
  creatorSubscriptions: initialCreatorSubs,
}: SubscriptionsManagerProps) {
  const [platformSubs, setPlatformSubs] = useState<PlatformSubscriptionItem[]>(initialPlatformSubs);
  const [creatorSubs, setCreatorSubs] = useState<CreatorSubscriptionItem[]>(initialCreatorSubs);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCancel(subscriptionId: string, isPlatform: boolean) {
    if (!confirm('Are you sure you want to cancel this subscription? You will retain access until the end of the current billing period.')) {
      return;
    }

    setCancelingId(subscriptionId);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/payments/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      if (isPlatform) {
        setPlatformSubs((prev) =>
          prev.map((sub) => (sub.id === subscriptionId ? { ...sub, status: 'canceled', cancelAtPeriodEnd: true } : sub))
        );
      } else {
        setCreatorSubs((prev) =>
          prev.map((sub) => (sub.id === subscriptionId ? { ...sub, status: 'canceled', cancelAtPeriodEnd: true } : sub))
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while canceling');
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Model A: TUKUBI Platform Subscriptions */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              <h2 className="text-lg font-black text-white">TUKUBI Platform Memberships</h2>
            </div>
            <p className="text-xs text-brand-sandstone/70 mt-0.5">
              Creator Pro, Seller Pro, and professional digital business tiers powering your Caribbean brand.
            </p>
          </div>
          <Link
            href="/creator-studio/monetization"
            className="text-xs font-bold text-brand-gold hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Explore TUKUBI Plans</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {platformSubs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-brand-sandstone/40 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Active Platform Subscriptions</h3>
            <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
              You are currently on the baseline standard tier. Upgrade to Creator Pro or Seller Pro to unlock zero-commission marketplace tools, advanced analytics, and custom branding.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformSubs.map((sub) => {
              const money = new Money(sub.priceMinor, sub.currency || 'USD');
              const isCanceling = cancelingId === sub.id;
              const isActive = sub.status === 'active';

              return (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono tracking-wider uppercase text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20">
                        Platform Tier
                      </span>
                      <h3 className="text-base font-black text-white mt-1.5">{sub.tierName}</h3>
                      {sub.tierDescription && (
                        <p className="text-xs text-brand-sandstone/70 mt-0.5">{sub.tierDescription}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-white">
                    {money.format()}
                    <span className="text-xs text-brand-sandstone/60 font-normal">
                      {' '}/ {sub.billingInterval}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/10 text-[11px] text-brand-sandstone/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span>
                        {sub.cancelAtPeriodEnd ? 'Expires' : 'Renews'}:{' '}
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="capitalize">Rail: {sub.paymentProvider}</span>
                    </div>

                    {isActive && !sub.cancelAtPeriodEnd && (
                      <button
                        onClick={() => handleCancel(sub.id, true)}
                        disabled={isCanceling}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 font-semibold disabled:opacity-50"
                      >
                        {isCanceling ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Canceling...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel Subscription</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Model B: Creator Fan Memberships */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-coral" />
              <h2 className="text-lg font-black text-white">Creator Fan Memberships</h2>
            </div>
            <p className="text-xs text-brand-sandstone/70 mt-0.5">
              Your direct patronages supporting Caribbean creators, cultural artists, and community channels.
            </p>
          </div>
          <Link
            href="/creators"
            className="text-xs font-bold text-brand-coral hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Discover Creators</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {creatorSubs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2">
            <Repeat className="w-6 h-6 text-brand-sandstone/40 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Creator Memberships Yet</h3>
            <p className="text-xs text-brand-sandstone/60 max-w-sm mx-auto">
              Join custom creator membership tiers across the Caribbean to unlock exclusive content, member badges, and community access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creatorSubs.map((sub) => {
              const money = new Money(sub.priceMinor, sub.currency || 'USD');
              const isCanceling = cancelingId === sub.id;
              const isActive = sub.status === 'active';

              return (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-coral to-brand-gold flex items-center justify-center text-white font-black text-sm">
                        {sub.creatorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{sub.creatorName}</h3>
                        <p className="text-xs text-brand-sandstone/70">@{sub.creatorUsername}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-brand-coral">
                      {sub.planName || `${sub.tier.toUpperCase()} Tier`}
                    </span>
                    {sub.planDescription && (
                      <p className="text-xs text-brand-sandstone/60 line-clamp-2">{sub.planDescription}</p>
                    )}
                  </div>

                  <div className="text-2xl font-black text-white">
                    {money.format()}
                    <span className="text-xs text-brand-sandstone/60 font-normal"> / month</span>
                  </div>

                  <div className="pt-3 border-t border-white/10 text-[11px] text-brand-sandstone/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span>
                        {sub.cancelAtPeriodEnd ? 'Expires' : 'Renews'}:{' '}
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="capitalize">Rail: {sub.billingSource.replace('_', ' ')}</span>
                    </div>

                    {isActive && !sub.cancelAtPeriodEnd && (
                      <button
                        onClick={() => handleCancel(sub.id, false)}
                        disabled={isCanceling}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 font-semibold disabled:opacity-50"
                      >
                        {isCanceling ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Canceling...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel Membership</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
