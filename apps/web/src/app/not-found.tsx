import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Home,
  Search,
  Users,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 text-brand-sandstone">
      <div className="bg-brand-dusk/80 border border-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-10 max-w-xl w-full text-center space-y-6 shadow-2xl">
        {/* Animated Compass Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-caribbeanSea/20 via-brand-goldenHour/20 to-brand-sunriseCoral/20 border border-brand-caribbeanSea/30 flex items-center justify-center shadow-lg shadow-brand-caribbeanSea/10">
          <Compass className="w-10 h-10 text-brand-caribbeanSea animate-pulse" />
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-sunriseCoral flex items-center justify-center text-[9px] font-black text-slate-950">
            !
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-goldenHour/10 border border-brand-goldenHour/30 text-brand-goldenHour text-[11px] font-black uppercase tracking-widest">
            <MapPin className="w-3 h-3" /> Error 404 • Destination Unknown
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Lost in the Archipelago
          </h1>
          <p className="text-xs sm:text-sm text-brand-sandstone/70 max-w-md mx-auto leading-relaxed">
            The page, profile, community, or island coordinates you are navigating to could not be found or have navigated to new waters.
          </p>
        </div>

        {/* Quick Nav Destination Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 text-left">
          <Link
            href="/"
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 text-xs font-bold text-white transition-all group hover:border-brand-caribbeanSea/50"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-caribbeanSea/20 text-brand-caribbeanSea flex items-center justify-center shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-bold">Home Horizon</span>
              <span className="block text-[10px] text-brand-sandstone/50 font-normal truncate">Return to feed</span>
            </div>
          </Link>

          <Link
            href="/explore"
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 text-xs font-bold text-white transition-all group hover:border-brand-goldenHour/50"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-goldenHour/20 text-brand-goldenHour flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-bold">Explore</span>
              <span className="block text-[10px] text-brand-sandstone/50 font-normal truncate">Islands &amp; culture</span>
            </div>
          </Link>

          <Link
            href="/communities"
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 text-xs font-bold text-white transition-all group hover:border-brand-sunriseCoral/50"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-sunriseCoral/20 text-brand-sunriseCoral flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-bold">Communities</span>
              <span className="block text-[10px] text-brand-sandstone/50 font-normal truncate">Join diaspora hubs</span>
            </div>
          </Link>

          <Link
            href="/marketplace"
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 text-xs font-bold text-white transition-all group hover:border-emerald-400/50"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-bold">Marketplace</span>
              <span className="block text-[10px] text-brand-sandstone/50 font-normal truncate">Caribbean commerce</span>
            </div>
          </Link>
        </div>

        {/* Search Call-To-Action */}
        <div className="pt-2">
          <Link
            href="/search"
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea via-brand-goldenHour to-brand-sunriseCoral text-slate-950 font-black text-xs hover:opacity-95 transition-all shadow-lg shadow-brand-caribbeanSea/20 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search Entire TUKUBI Ecosystem</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
