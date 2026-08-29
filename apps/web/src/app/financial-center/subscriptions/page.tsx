import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { Repeat } from 'lucide-react';
import { Money } from '@caribbean/payments';

export const dynamic = 'force-dynamic';

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id, tier, price_minor, currency, billing_source, status, current_period_end, creator_accounts(profiles(username, display_name))')
    .eq('subscriber_id', user.id);

  const subList = subscriptions ?? [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white">Active Subscriptions &amp; Memberships</h2>
        <p className="text-xs text-slate-400">
          Fan memberships, creator patronages, and digital service subscriptions.
        </p>
      </div>

      {subList.length === 0 ? (
        <div className="text-center py-12 bg-brand-dusk/40 border border-slate-800 rounded-2xl space-y-2">
          <Repeat className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Active Subscriptions</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Subscribe to your favorite Caribbean creators or unlock professional tools to see recurring billing details here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subList.map((s: any) => {
            const money = new Money(s.price_minor, s.currency || 'USD');
            const creator = s.creator_accounts?.profiles;

            return (
              <div key={s.id} className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {creator?.display_name || 'Creator'} Membership
                    </h3>
                    <p className="text-xs text-slate-400">@{creator?.username || 'creator'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {s.status}
                  </span>
                </div>
                <div className="text-xl font-black text-white">
                  {money.format()}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ month</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                  <span>Renews: {new Date(s.current_period_end).toLocaleDateString()}</span>
                  <span className="capitalize">Rail: {s.billing_source.replace('_', ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
