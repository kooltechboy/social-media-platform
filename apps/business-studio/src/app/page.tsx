import React from 'react';
import { aggregateReviews, formatPrice } from '@caribbean/business';

export default function BusinessStudioOverview() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1D1429] via-[#2A1B38] to-[#1D1429] border border-[#00B4D8]/20 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#00B4D8]">
            Caribbean Business Studio
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Welcome to Business Studio
          </h1>
          <p className="text-sm text-[#FDF2E9]/70">
            Connect your storefront, set up product listings, and reach the Caribbean diaspora worldwide. Manage orders, track sales, and run ad campaigns — all from one dashboard.
          </p>
        </div>
        <div className="mt-6">
          <a
            href="/onboarding"
            className="inline-flex px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#00B4D8] to-[#FFB347] text-white hover:opacity-95 shadow-lg shadow-[#00B4D8]/20 transition-opacity"
          >
            Set Up Your Store →
          </a>
        </div>
      </div>

      {/* Metrics Row — Zero State */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Gross Sales (Month-to-Date)</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">{formatPrice(0, 'USD')}</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-[#FDF2E9]/40">
            Sales will appear once your first order is placed
          </span>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Orders Ready to Ship</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">0</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-[#FDF2E9]/40">
            List your first product to start receiving orders
          </span>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Active Diaspora Campaigns</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">0</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-[#FDF2E9]/40">
            Create an ad campaign to reach the global Caribbean community
          </span>
        </div>

        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs font-medium text-[#FDF2E9]/60">Customer Satisfaction</p>
          <p className="mt-2 text-2xl font-bold text-white font-mono">—</p>
          <span className="mt-2 inline-flex items-center text-xs font-medium text-[#FDF2E9]/40">
            Ratings will appear after your first completed sale
          </span>
        </div>
      </div>

      {/* Orders Preview — Empty State */}
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
                <td colSpan={5} className="py-8 text-center text-[#FDF2E9]/40">
                  <p className="text-sm">No orders yet</p>
                  <p className="text-xs mt-1">Orders from Caribbean and diaspora customers will appear here with escrow status tracking.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
