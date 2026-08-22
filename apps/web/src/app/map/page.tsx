'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  MapPin,
  Globe,
  Users,
  Building2,
  Calendar,
  ShoppingBag,
  Tv,
  Flame,
  Sparkles,
  ArrowUpRight,
  Search,
} from 'lucide-react';

interface IslandNode {
  code: string;
  name: string;
  flag: string;
  region: 'Greater Antilles' | 'Lesser Antilles' | 'Southern Caribbean' | 'Diaspora Hub';
  creators: string;
  businesses: string;
  events: string;
  activeLive: number;
  trendingTag: string;
  summary: string;
  coordinates: { x: number; y: number };
}

const CARIBBEAN_MAP_DATA: IslandNode[] = [
  {
    code: 'JAM',
    name: 'Jamaica',
    flag: '🇯🇲',
    region: 'Greater Antilles',
    creators: '14.2K',
    businesses: '2,400',
    events: '45 Fetes',
    activeLive: 12,
    trendingTag: '#KingstonVibes',
    summary: 'Heart of reggae, dancehall, sound system culture, Blue Mountain coffee, and track athletics.',
    coordinates: { x: 30, y: 35 },
  },
  {
    code: 'TTO',
    name: 'Trinidad & Tobago',
    flag: '🇹🇹',
    region: 'Southern Caribbean',
    creators: '11.8K',
    businesses: '1,950',
    events: '62 Fetes',
    activeLive: 18,
    trendingTag: '#CarnivalTT',
    summary: 'Birthplace of Steelpan, Soca, Calypso, and the greatest carnival spectacle on earth.',
    coordinates: { x: 75, y: 80 },
  },
  {
    code: 'DOM',
    name: 'Dominican Republic',
    flag: '🇩🇴',
    region: 'Greater Antilles',
    creators: '18.5K',
    businesses: '3,100',
    events: '38 Events',
    activeLive: 15,
    trendingTag: '#RDTechSummit',
    summary: 'Bachata, Merengue, artisanal cacao, tech innovation hubs, and baseball legends.',
    coordinates: { x: 45, y: 30 },
  },
  {
    code: 'BRB',
    name: 'Barbados',
    flag: '🇧🇧',
    region: 'Lesser Antilles',
    creators: '5.4K',
    businesses: '890',
    events: '24 Events',
    activeLive: 6,
    trendingTag: '#CropOver2026',
    summary: 'Culinary capital, aged rum heritage, Crop Over Grand Kadooment, and tech fintech pioneers.',
    coordinates: { x: 80, y: 65 },
  },
  {
    code: 'HTI',
    name: 'Haiti',
    flag: '🇭🇹',
    region: 'Greater Antilles',
    creators: '9.2K',
    businesses: '1,200',
    events: '19 Events',
    activeLive: 8,
    trendingTag: '#AyitiArt',
    summary: 'Pioneering art, metal sculpture, Kompa rhythms, coffee, and rich diaspora history.',
    coordinates: { x: 38, y: 32 },
  },
  {
    code: 'PRI',
    name: 'Puerto Rico',
    flag: '🇵🇷',
    region: 'Greater Antilles',
    creators: '16.0K',
    businesses: '2,800',
    events: '41 Events',
    activeLive: 14,
    trendingTag: '#SanJuanNights',
    summary: 'Boricua pride, Salsa, Reggaeton roots, Old San Juan arts, and diaspora bridges.',
    coordinates: { x: 55, y: 32 },
  },
  {
    code: 'BHS',
    name: 'Bahamas',
    flag: '🇧🇸',
    region: 'Greater Antilles',
    creators: '4.8K',
    businesses: '740',
    events: '16 Events',
    activeLive: 4,
    trendingTag: '#JunkanooFest',
    summary: 'Junkanoo celebration, crystal archipelagos, maritime commerce, and tourism leadership.',
    coordinates: { x: 25, y: 15 },
  },
  {
    code: 'GUY',
    name: 'Guyana',
    flag: '🇬🇾',
    region: 'Southern Caribbean',
    creators: '4.2K',
    businesses: '680',
    events: '14 Events',
    activeLive: 5,
    trendingTag: '#GuyanaMash',
    summary: 'Land of Many Waters, Mashramani, emerging energy innovation, and rainforest biodiversity.',
    coordinates: { x: 85, y: 90 },
  },
  {
    code: 'MIA',
    name: 'Miami Diaspora Hub',
    flag: '🗽',
    region: 'Diaspora Hub',
    creators: '22.0K',
    businesses: '4,500',
    events: '85 Fetes',
    activeLive: 24,
    trendingTag: '#MiamiCarnival',
    summary: 'Gateway to the Caribbean. Wynwood cultural fusions, Little Haiti, Little Havana, and tech.',
    coordinates: { x: 15, y: 10 },
  },
  {
    code: 'TOR',
    name: 'Toronto Diaspora Hub',
    flag: '🇨🇦',
    region: 'Diaspora Hub',
    creators: '19.4K',
    businesses: '3,800',
    events: '52 Fetes',
    activeLive: 16,
    trendingTag: '#Caribana2026',
    summary: 'Home of North America’s largest Carnival celebration, culinary markets, and diaspora guilds.',
    coordinates: { x: 20, y: 5 },
  },
  {
    code: 'LON',
    name: 'London Diaspora Hub',
    flag: '🇬🇧',
    region: 'Diaspora Hub',
    creators: '17.8K',
    businesses: '3,200',
    events: '48 Fetes',
    activeLive: 14,
    trendingTag: '#NottingHillCarnival',
    summary: 'Windrush legacy, Notting Hill Carnival, sound system culture, and European diaspora bridge.',
    coordinates: { x: 85, y: 5 },
  },
];

export default function CaribbeanMapDiscoveryPage() {
  const [selectedNode, setSelectedNode] = useState<IslandNode>(CARIBBEAN_MAP_DATA[0]);
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredNodes = CARIBBEAN_MAP_DATA.filter((node) => {
    const matchesRegion = filterRegion === 'All' || node.region === filterRegion;
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.trendingTag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-sky-400 animate-ping" />
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Compass className="w-8 h-8 text-sky-400" /> Caribbean Discovery Map
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Real-time interactive discovery of creators, businesses, cultural events, and diaspora connections.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search island or diaspora..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Region Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Greater Antilles', 'Lesser Antilles', 'Southern Caribbean', 'Diaspora Hub'].map((reg) => (
          <button
            key={reg}
            onClick={() => setFilterRegion(reg)}
            className={`px-4 py-1.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
              filterRegion === reg
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {reg}
          </button>
        ))}
      </div>

      {/* Map Interactive Grid & Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Island & Hub Interactive Cards (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredNodes.map((node) => {
              const isSelected = selectedNode.code === node.code;
              return (
                <div
                  key={node.code}
                  onClick={() => setSelectedNode(node)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-lg group ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl group-hover:scale-110 transition-transform">
                      {node.flag}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950 text-sky-400 border border-slate-800">
                      {node.region}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-white group-hover:text-sky-300 transition-colors">
                      {node.name}
                    </h3>
                    <p className="text-[11px] font-bold text-amber-400 mt-0.5">
                      {node.trendingTag}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{node.creators} creators</span>
                    <span>{node.events}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Island / Hub Detail Drawer (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-5xl">{selectedNode.flag}</span>
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                ACTIVE PULSE
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white">{selectedNode.name}</h2>
              <span className="text-xs font-bold text-sky-400">{selectedNode.trendingTag}</span>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {selectedNode.summary}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-sky-400" /> Creators
                </span>
                <p className="text-base font-black text-white">{selectedNode.creators}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-400" /> Businesses
                </span>
                <p className="text-base font-black text-white">{selectedNode.businesses}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-yellow-400" /> Upcoming
                </span>
                <p className="text-base font-black text-white">{selectedNode.events}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Tv className="w-3 h-3 text-red-400" /> Live Ingest
                </span>
                <p className="text-base font-black text-red-400">{selectedNode.activeLive} Live Now</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Link
                href={`/explore?country=${selectedNode.code}`}
                className="w-full block bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black py-2.5 rounded-2xl text-xs text-center transition-all shadow-md shadow-sky-500/20"
              >
                Explore {selectedNode.name} Feed →
              </Link>
              <Link
                href={`/events?region=${selectedNode.code}`}
                className="w-full block bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-2xl text-xs text-center border border-slate-700 transition-colors"
              >
                View Cultural Fetes &amp; Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
