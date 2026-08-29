import React from 'react';
import { createSupabaseServerClient, getCurrentUser } from '../../../lib/supabase/server';
import { Ticket, Calendar, ShieldCheck } from 'lucide-react';
import { Money } from '@caribbean/payments';

export const dynamic = 'force-dynamic';

export default async function EventRevenuePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: events } = await supabase
    .from('events')
    .select('id, title, starts_at, country_code, city')
    .eq('host_id', user.id);

  const hostedEvents = events ?? [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-brand-goldenHour" /> Event Organizer Financial Center
        </h2>
        <p className="text-xs text-slate-400">
          Cultural festival ticket sales, QR admission revenue, and event settlement escrow.
        </p>
      </div>

      {hostedEvents.length === 0 ? (
        <div className="p-6 rounded-2xl bg-brand-dusk/60 border border-slate-800 text-center space-y-3">
          <h3 className="text-base font-bold text-white">No Hosted Events Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Host a Caribbean festival, concert, or cultural workshop to start ticketing and collecting admissions.
          </p>
          <a
            href="/events"
            className="inline-block px-5 py-2.5 rounded-xl bg-brand-sunriseCoral text-slate-950 font-black text-xs hover:opacity-95"
          >
            Create Cultural Event →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Your Hosted Events</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hostedEvents.map((evt: any) => (
              <div key={evt.id} className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                <p className="text-xs text-slate-400">
                  {evt.city}, {evt.country_code} • {new Date(evt.starts_at).toLocaleDateString()}
                </p>
                <div className="pt-2 border-t border-slate-800 text-xs text-brand-goldenHour font-semibold">
                  Ticketing Active via Multimodal Checkout
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
