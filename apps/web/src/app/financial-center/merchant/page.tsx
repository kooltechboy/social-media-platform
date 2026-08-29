import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { Store, ShieldCheck, ExternalLink } from 'lucide-react';
import { SELLER_PLANS, Money } from '@caribbean/payments';

export const dynamic = 'force-dynamic';

export default async function MerchantFinancialPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [businessRes, ordersRes] = await Promise.all([
    supabase.from('businesses').select('id, name, slug, currency').eq('owner_id', user.id).maybeSingle(),
    supabase.from('orders').select('id, total_minor, status, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  const business = businessRes.data;
  const recentOrders = ordersRes.data ?? [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Store className="w-5 h-5 text-brand-sunriseCoral" /> Merchant Financial Center
        </h2>
        <p className="text-xs text-slate-400">
          Store sales volume, settlement accounts, chargeback reconciliation, and merchant fee management.
        </p>
      </div>

      {!business ? (
        <div className="p-6 rounded-2xl bg-brand-dusk/60 border border-slate-800 text-center space-y-3">
          <h3 className="text-base font-bold text-white">Create a Caribbean Business Store</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Set up digital storefronts, accept payments in local Caribbean currencies, and manage multi-staff access.
          </p>
          <a
            href="/pages/create"
            className="inline-block px-5 py-2.5 rounded-xl bg-brand-sunriseCoral text-slate-950 font-black text-xs hover:opacity-95"
          >
            Create Storefront →
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-brand-dusk/70 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">{business.name}</h3>
                <p className="text-xs text-slate-400">Currency: {business.currency || 'USD'}</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Storefront
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Available Merchant Plans</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(SELLER_PLANS).slice(0, 3).map((plan) => (
                <div key={plan.id} className="p-4 rounded-xl bg-brand-dusk/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{plan.name}</span>
                    <span className="text-[10px] font-black text-brand-goldenHour">
                      {plan.priceMinor === 0 ? 'Free' : `$${(plan.priceMinor / 100).toFixed(2)}/mo`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{plan.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
