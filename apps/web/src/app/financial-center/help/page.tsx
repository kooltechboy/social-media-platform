import React from 'react';
import { HelpCircle, ShieldCheck, FileCheck, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FinancialHelpPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand-goldenHour" /> Financial Help &amp; Payment Policies
        </h2>
        <p className="text-xs text-slate-400">
          Understanding payment processing, settlement timelines, buyer protection, and dispute resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Buyer &amp; Order Protection
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All marketplace purchases and event ticket bookings are subject to our standard 30-day fulfillment guarantee. If an item is unfulfilled or damaged, buyers may open a dispute through the Marketplace Orders dashboard.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FileCheck className="w-4 h-4 text-brand-sunriseCoral" /> Regulated Financial Architecture
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            TUKUBI is a digital commerce and creator community platform. Regulated payment processing, merchant underwriting, currency conversions, and fund transfers are provided by licensed payment service institutions and banks.
          </p>
        </div>
      </div>
    </div>
  );
}
