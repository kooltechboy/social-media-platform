import React from 'react';
import { Mic, Play, Radio, Rss, Heart, Share2, DollarSign } from 'lucide-react';

export default function PodcastsPage() {
  const podcasts = [
    {
      title: 'The Caribbean Tech & Founders Podcast',
      host: 'Marcus & Sarah',
      flag: '🇯🇲',
      episodes: 48,
      subscribers: '14.5k',
      desc: 'Deep dives with Caribbean founders in Kingston, Toronto, Miami, and London building global technology.',
      rss: '/podcasts/founders/rss.xml',
    },
    {
      title: 'Dominicana Cultural Talks',
      host: 'Elena Rodriguez',
      flag: '🇩🇴',
      episodes: 92,
      subscribers: '28.1k',
      desc: 'Exploring Dominican history, music, food, and diaspora stories in Brooklyn and Santo Domingo.',
      rss: '/podcasts/dominicana/rss.xml',
    },
    {
      title: 'Soca & Carnival Pulse',
      host: 'DJ Trini Vibe',
      flag: '🇹🇹',
      episodes: 64,
      subscribers: '32.0k',
      desc: 'The official home for Carnival news, soca music breakdowns, and artist interviews across Trinidad & the UK.',
      rss: '/podcasts/soca/rss.xml',
    }
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Mic className="w-8 h-8 text-amber-400" /> Caribbean Podcast Network
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audio & video podcast publishing, auto-generated Whisper AI transcripts, and RSS distribution.
          </p>
        </div>

        <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors">
          <Radio className="w-4 h-4" /> Host Your Podcast
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {podcasts.map((pod, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-amber-500/50 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{pod.flag}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Rss className="w-3 h-3" /> RSS Valid
                </span>
              </div>
              <h3 className="font-bold text-base text-white">{pod.title}</h3>
              <p className="text-xs text-slate-400">Host: {pod.host} • {pod.episodes} Episodes</p>
              <p className="text-xs text-slate-300 leading-relaxed">{pod.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">{pod.subscribers} Subscribers</span>
              <button className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                <Play className="w-3.5 h-3.5" /> Listen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
