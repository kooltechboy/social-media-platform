'use client';

import React from 'react';
import { Users, Video, Compass, ShoppingBag, DollarSign, Sparkles } from 'lucide-react';

interface MomentItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  tag: string;
  bgGradient: string;
}

const MOMENTS: MomentItem[] = [
  {
    id: 'connect',
    title: 'Connect',
    subtitle: 'With authentic people, island roots & global diaspora communities',
    icon: <Users className="w-4 h-4 text-cyan-400" />,
    gradient: 'from-cyan-500/20 to-blue-600/30',
    tag: 'Community',
    bgGradient: 'from-[#0E1F38] to-[#071120]',
  },
  {
    id: 'create',
    title: 'Create',
    subtitle: 'Share your music, sounds, visual art, podcasts & cultural story',
    icon: <Video className="w-4 h-4 text-pink-400" />,
    gradient: 'from-pink-500/20 to-purple-600/30',
    tag: 'Studio',
    bgGradient: 'from-[#2A1030] to-[#120516]',
  },
  {
    id: 'discover',
    title: 'Discover',
    subtitle: 'Explore cuisine, secret beaches, live festivals, calypso & soca',
    icon: <Compass className="w-4 h-4 text-brand-goldenHour" />,
    gradient: 'from-amber-500/20 to-orange-600/30',
    tag: 'Culture',
    bgGradient: 'from-[#2A1D0D] to-[#130C04]',
  },
  {
    id: 'shop',
    title: 'Shop',
    subtitle: 'Support local Caribbean artisans, designers, spices & storefronts',
    icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
    gradient: 'from-emerald-500/20 to-teal-600/30',
    tag: 'Marketplace',
    bgGradient: 'from-[#0C241E] to-[#05130F]',
  },
  {
    id: 'earn',
    title: 'Earn',
    subtitle: 'Monetize your talent, receive fan tips & get paid instantly',
    icon: <DollarSign className="w-4 h-4 text-brand-sunriseCoral" />,
    gradient: 'from-rose-500/20 to-amber-600/30',
    tag: 'Creator Economy',
    bgGradient: 'from-[#2C1215] to-[#140608]',
  },
];

export function ShowcaseMoments() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            The Caribbean in Every Moment
          </h3>
          <p className="text-xs text-brand-sandstone/60 mt-0.5">
            A comprehensive ecosystem designed for connection, commerce, and culture.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {MOMENTS.map((m) => (
          <div
            key={m.id}
            className={`group rounded-3xl p-5 border border-white/10 bg-gradient-to-b ${m.bgGradient} hover:border-white/25 transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-2xl flex flex-col justify-between min-h-[170px] relative overflow-hidden`}
          >
            {/* Ambient inner glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

            <div className="relative z-10 flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-md">
                {m.icon}
              </div>
              <span className="text-[10px] font-bold text-brand-sandstone/50 uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                {m.tag}
              </span>
            </div>

            <div className="relative z-10 space-y-1 mt-4">
              <h4 className="font-extrabold text-base text-white tracking-tight group-hover:text-brand-caribbeanSea transition-colors">
                {m.title}
              </h4>
              <p className="text-[11px] text-brand-sandstone/70 leading-relaxed line-clamp-2">
                {m.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
