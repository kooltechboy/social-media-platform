import React from 'react';
import { Compass, Search, Globe, MapPin, Sparkles, Filter } from 'lucide-react';

export default function ExplorePage() {
  const islands = [
    { flag: '🇩🇴', name: 'Dominican Republic', tag: '#Dominicana', creators: '142k' },
    { flag: '🇯🇲', name: 'Jamaica', tag: '#JamaicaVibes', creators: '189k' },
    { flag: '🇹🇹', name: 'Trinidad & Tobago', tag: '#SocaKingdom', creators: '98k' },
    { flag: '🇧🇸', name: 'Bahamas', tag: '#BahamasLife', creators: '45k' },
    { flag: '🇧🇧', name: 'Barbados', tag: '#BajanPride', creators: '52k' },
    { flag: '🇭🇹', name: 'Haiti', tag: '#AyitiCherie', creators: '110k' },
    { flag: '🇨🇺', name: 'Cuba', tag: '#CubaCultural', creators: '88k' },
    { flag: '🇵🇷', name: 'Puerto Rico', tag: '#BoricuaPower', creators: '160k' },
    { flag: '🇨🇼', name: 'Curaçao', tag: '#DushiCuracao', creators: '34k' },
    { flag: '🇬🇾', name: 'Guyana', tag: '#GuyanaOne', creators: '41k' },
  ];

  const diasporaHubs = [
    { city: 'Brooklyn & NYC', country: '🇺🇸 USA', count: '1.2M Diaspora' },
    { city: 'Miami & South Florida', country: '🇺🇸 USA', count: '950K Diaspora' },
    { city: 'Toronto & GTA', country: '🇨🇦 Canada', count: '600K Diaspora' },
    { city: 'London & UK', country: '🇬🇧 UK', count: '550K Diaspora' },
    { city: 'Amsterdam & Netherlands', country: '🇳🇱 EU', count: '210K Diaspora' },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Compass className="w-7 h-7 text-sky-400" /> Caribbean Discovery Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore creators, music, culture, and diaspora communities across 34 countries & worldwide hubs.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search islands, creators, food, or cities..." 
            className="w-full bg-slate-900 border border-slate-700/70 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Caribbean by Location Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" /> Browse by Island & Country
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {islands.map((item, idx) => (
            <div key={idx} className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.flag}</div>
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-sky-400 transition-colors">{item.name}</h3>
                <span className="text-xs text-slate-400">{item.creators} Creators</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Diaspora Global Hubs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-400" /> Major Diaspora Hubs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {diasporaHubs.map((hub, idx) => (
            <div key={idx} className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-400">{hub.country}</span>
                <h4 className="font-bold text-slate-100 text-sm">{hub.city}</h4>
                <span className="text-xs text-slate-400">{hub.count}</span>
              </div>
              <button className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-sky-500/30 transition-colors">
                Connect Hub
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
