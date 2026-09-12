import React from 'react';
import { formatPrice } from '@caribbean/business';

export default function OrdersPage() {
  const orders = [
    {
      id: 'TK-10021',
      date: 'Sep 12, 2026',
      customer: 'Elena R. (London, UK)',
      items: '3x Jamaican Scotch Bonnet Hot Sauce',
      totalMinor: 4500,
      currency: 'USD',
      status: 'Awaiting Fulfillment',
      tracking: 'Pending Carrier Assignment',
    },
    {
      id: 'TK-10020',
      date: 'Sep 12, 2026',
      customer: 'Devon K. (Atlanta, GA)',
      items: '1x Blue Mountain Coffee (1kg Whole Bean)',
      totalMinor: 6200,
      currency: 'USD',
      status: 'In Transit',
      tracking: 'DHL Express 984210491',
    },
    {
      id: 'TK-10019',
      date: 'Sep 11, 2026',
      customer: 'Camille T. (Kingston, JA)',
      items: '2x Ceramic Island Mugs',
      totalMinor: 3800,
      currency: 'USD',
      status: 'Delivered',
      tracking: 'Caribbean Local Post 14892',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A1B38] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Merchant Orders & Fulfillment Pipeline</h1>
          <p className="text-sm text-[#FDF2E9]/60">
            Fulfill marketplace orders, print Caribbean export customs declarations, and track escrow release.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-xl bg-[#2A1B38] text-white text-xs font-semibold hover:bg-[#2A1B38]/80 transition-colors">
            Export CSV
          </button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#FFB347] text-white font-semibold text-sm shadow-md hover:opacity-95 transition-opacity">
            Batch Print Waybills
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#FDF2E9]/80">
            <thead className="border-b border-[#2A1B38] text-xs uppercase text-[#FDF2E9]/50">
              <tr>
                <th className="py-3 px-2">Order ID</th>
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Customer</th>
                <th className="py-3 px-2">Items</th>
                <th className="py-3 px-2">Total</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1B38]/60">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-3 px-2 font-mono text-white font-bold">{o.id}</td>
                  <td className="py-3 px-2 text-xs text-[#FDF2E9]/60">{o.date}</td>
                  <td className="py-3 px-2">{o.customer}</td>
                  <td className="py-3 px-2 text-xs">{o.items}</td>
                  <td className="py-3 px-2 font-mono text-white">{formatPrice(o.totalMinor, o.currency)}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2.5 py-0.5 text-xs rounded-full border ${
                        o.status === 'Delivered'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : o.status === 'In Transit'
                          ? 'bg-[#00B4D8]/20 text-[#00B4D8] border-[#00B4D8]/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs font-mono text-[#FDF2E9]/60">{o.tracking}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
