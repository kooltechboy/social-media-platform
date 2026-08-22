import React from 'react';
import Link from 'next/link';
import {
  Home,
  Compass,
  Video,
  Tv,
  Mic,
  Users,
  Wallet,
  Calendar,
  ShoppingBag,
  MessageSquare,
  Bell,
  User,
  Sparkles,
  Settings,
  Building2,
  MapPin,
  PlusCircle,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Home Feed', icon: <Home className="w-4 h-4 text-sky-400" /> },
  { href: '/create', label: 'Create Hub', icon: <PlusCircle className="w-4 h-4 text-emerald-400" />, badge: 'NEW' },
  { href: '/explore', label: 'Explore & Diaspora', icon: <Compass className="w-4 h-4 text-amber-400" /> },
  { href: '/map', label: 'Caribbean Map', icon: <MapPin className="w-4 h-4 text-rose-400" /> },
  { href: '/reels', label: 'Reels & Sounds', icon: <Video className="w-4 h-4 text-pink-400" /> },
  { href: '/live', label: 'Live Streams', icon: <Tv className="w-4 h-4 text-red-400" />, badge: 'LIVE' },
  { href: '/podcasts', label: 'Podcasts Network', icon: <Mic className="w-4 h-4 text-purple-400" /> },
  { href: '/communities', label: 'Diaspora Hubs', icon: <Users className="w-4 h-4 text-cyan-400" /> },
];

const COMMERCE_NAV: NavItem[] = [
  { href: '/marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-4 h-4 text-orange-400" /> },
  { href: '/events', label: 'Cultural Events', icon: <Calendar className="w-4 h-4 text-yellow-400" /> },
  { href: '/pages', label: 'Pages & Stores', icon: <Building2 className="w-4 h-4 text-emerald-400" />, badge: 'VERIFIED' },
  { href: '/spotpay', label: 'SpotPay Wallet', icon: <Wallet className="w-4 h-4 text-emerald-400" /> },
  { href: '/creator-studio', label: 'Creator Studio', icon: <Sparkles className="w-4 h-4 text-sky-400" /> },
];

const PERSONAL_NAV: NavItem[] = [
  { href: '/messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4 text-slate-300" /> },
  { href: '/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 text-slate-300" /> },
  { href: '/profile', label: 'My Identity', icon: <User className="w-4 h-4 text-slate-300" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4 text-slate-300" /> },
];

interface AppSidebarProps {
  currentPath?: string;
}

export default function AppSidebar({ currentPath = '/' }: AppSidebarProps) {
  const renderNavGroup = (items: NavItem[], title?: string) => (
    <div className="space-y-1">
      {title && (
        <p className="text-[10px] font-black tracking-wider uppercase text-slate-500 px-3 py-1.5">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive =
          item.href === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-sky-500/20 to-emerald-500/10 text-white border border-sky-500/30 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                item.badge === 'LIVE'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                  : item.badge === 'NEW'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="hidden md:block col-span-1 space-y-5" aria-label="Primary navigation">
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-3 shadow-xl space-y-4">
        {renderNavGroup(PRIMARY_NAV, 'Ecosystem')}
        <div className="h-px bg-slate-800/60 my-2" />
        {renderNavGroup(COMMERCE_NAV, 'Economy & Culture')}
        <div className="h-px bg-slate-800/60 my-2" />
        {renderNavGroup(PERSONAL_NAV, 'Account')}
      </div>

      {/* Creator Studio Action Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/60 border border-sky-500/30 rounded-3xl p-4 text-center shadow-lg space-y-2.5">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-sky-400 uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" /> Caribbean Creator Hub
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Keep <strong className="text-emerald-400">82.1% net</strong> of all subscriptions, gifts, and event ticket sales.
        </p>
        <Link
          href="/creator-studio"
          className="w-full block bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-2xl transition-all shadow-md shadow-sky-500/20 text-center"
        >
          Open Creator Studio
        </Link>
      </div>
    </aside>
  );
}
