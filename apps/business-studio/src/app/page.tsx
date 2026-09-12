import React from 'react';
import { aggregateReviews, formatPrice } from '@caribbean/business';

export default function BusinessStudioOverview() {
  const reviews = aggregateReviews([5, 5, 5, 4, 5, 5, 4, 5]);

  return (
    <div className="space-y-8">
      {/* Merchant Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1D1429] via-[#2A1B38] to-[#1D1429] border border-[#00B4D8]/20 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#00B4D8]">
                Official Caribbean Merchant
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified Seller
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Blue Mountain Artisan Goods
            </h1>
            <p className="text-sm text-[#FDF2E9]/70">
              Category: <strong className="text-white">Retail & Artisanal Food</strong> • Origin: <strong className="text-white">Kingston, Jamaica (JAM)</strong> • Rating: <strong className="text-[#FFB347]">★ {reviews.average} ({reviews.total} reviews)</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/campaigns"
              className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#00B4D8] to-[#FFB347] text-white hover:opacity-95 shadow-lg shadow-[#00B4D8]/20 transition-opacity"
            >
              + Create Ad Campaign
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Gross Sales (Month-to-Date)</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">{formatPrice(1425000, 'USD')}</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-emerald-400">
            ↑ 31.4% vs previous period
          </span>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Orders Ready to Ship</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">28</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-[#FFB347]">
            Avg dispatch time: 1.2 days
          </span>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Active Diaspora Campaigns</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">4 Live</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-[#00B4D8]">
            Targeting: FL, NY, ON, London
          </span>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Customer Satisfaction</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">99.2%</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-emerald-400">
            Zero chargeback disputes
          </span>
        </div>
      </div>

      {/* Orders Preview */}
      <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Fulfillment Pipeline</h2>
          <a href="/orders" className="text-xs text-[#00B4D8] hover:underline">
            Manage All Orders →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#FDF2E9]/80">
            <thead className="border-b border-[#2A1B38] text-xs uppercase text-[#FDF2E9]/50">
              <tr>
                <th className="py-3 px-2">Order #</th>
                <th className="py-3 px-2">Customer & Destination</th>
                <th className="py-3 px-2">Items</th>
                <th className="py-3 px-2">Total</th>
                <th className="py-3 px-2">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1B38]/60">
              <tr>
                <td className="py-3 px-2 font-mono text-white">TK-9842</td>
                <td className="py-3 px-2">Marcus B. — Brooklyn, NY (USA)</td>
                <td className="py-3 px-2 text-xs">2x 100% Blue Mountain Reserve</td>
                <td className="py-3 px-2 font-mono text-white">{formatPrice(7600, 'USD')}</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Escrow Locked • Shipped
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-2 font-mono text-white">TK-9841</td>
                <td className="py-3 px-2">Sarah L. — Toronto, ON (CAN)</td>
                <td className="py-3 px-2 text-xs">1x Hand-carved Cedar Drum</td>
                <td className="py-3 px-2 font-mono text-white">{formatPrice(18500, 'USD')}</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Awaiting Packing
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
