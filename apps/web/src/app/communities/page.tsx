import React from 'react';
import { Users, Plus, ShieldCheck, MapPin } from 'lucide-react';

export default function CommunitiesPage() {
  const communities = [
    {
      name: 'Jamaicans in Toronto',
      members: '34.2k Members',
      location: '📍 Toronto, Canada',
      flag: '🇨🇦 🇯🇲',
      desc: 'Community hub for Jamaicans living in Toronto & GTA. Events, housing, career support, food recommendations.',
    },
    {
      name: 'Dominicans in New York',
      members: '52.1k Members',
      location: '📍 NYC, USA',
      flag: '🇺🇸 🇩🇴',
      desc: 'Connecting the Dominican diaspora across Washington Heights, Bronx, Brooklyn, and Queens.',
    },
    {
      name: 'Caribbean Software Engineers',
      members: '12.8k Members',
      location: '📍 Worldwide Diaspora',
      flag: '💻 🌴',
      desc: 'Global tech community for Caribbean developers, designers, and tech founders building worldwide.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-sky-400" /> Caribbean Communities
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect with diaspora groups, cultural organizations, and professional networks worldwide.
          </p>
        </div>

        <button className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Create Community
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {communities.map((comm, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-sky-500/50 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{comm.flag}</span>
                <span className="text-xs text-sky-400 font-semibold">{comm.location}</span>
              </div>
              <h3 className="font-bold text-base text-white">{comm.name}</h3>
              <p className="text-xs text-slate-400">{comm.members}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{comm.desc}</p>
            </div>

            <button className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold py-2 rounded-xl text-xs border border-sky-500/30 transition-colors">
              Join Community
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
