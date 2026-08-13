import React from 'react';
import { Calendar, MapPin, Ticket, ShieldCheck } from 'lucide-react';

export default function EventsPage() {
  const events = [
    {
      title: 'Toronto Caribbean Carnival (Caribana) 2026',
      date: 'SAT, AUG 1, 2026',
      location: 'Exhibition Place, Toronto 🇨🇦',
      flag: '🇨🇦',
      price: '$45.00',
      category: 'Festival & Parade',
    },
    {
      title: 'Dominican Cultural & Food Festival',
      date: 'SUN, AUG 16, 2026',
      location: 'Brooklyn Bridge Park, NYC 🇺🇸',
      flag: '🇺🇸',
      price: '$25.00',
      category: 'Food & Culture',
    },
    {
      title: 'Jamaica Reggae & Dancehall Summit',
      date: 'FRI, SEP 4, 2026',
      location: 'National Arena, Kingston 🇯🇲',
      flag: '🇯🇲',
      price: '$60.00',
      category: 'Live Music & Concert',
    }
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-sky-400" /> Caribbean Events & Ticketing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover festivals, concerts, food summits, and diaspora events with instant SpotPay ticketing.
          </p>
        </div>

        <button className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors">
          Host & Sell Tickets
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((event, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-sky-500/50 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/40">{event.category}</span>
                <span className="text-2xl">{event.flag}</span>
              </div>
              <span className="text-xs font-bold text-amber-400 block">{event.date}</span>
              <h3 className="font-bold text-base text-white">{event.title}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" /> {event.location}
              </p>
              <div className="text-lg font-black text-white">{event.price} <span className="text-xs font-normal text-slate-400">USD</span></div>
            </div>

            <button className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors">
              <Ticket className="w-4 h-4" /> Get Tickets (SpotPay)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
