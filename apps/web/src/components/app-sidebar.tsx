'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
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
  Music,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Home Feed', icon: <Home className="w-4 h-4 text-brand-caribbeanSea" /> },
  { href: '/create', label: 'Create Hub', icon: <PlusCircle className="w-4 h-4 text-brand-sunriseCoral" />, badge: 'NEW' },
  { href: '/explore', label: 'Explore & Diaspora', icon: <Compass className="w-4 h-4 text-brand-goldenHour" /> },
  { href: '/map', label: 'Caribbean Map', icon: <MapPin className="w-4 h-4 text-rose-400" /> },
  { href: '/reels', label: 'Reels & Shorts', icon: <Video className="w-4 h-4 text-pink-400" /> },
  { href: '/sounds', label: 'Caribbean Sounds', icon: <Music className="w-4 h-4 text-rose-400" />, badge: 'NEW' },
  { href: '/live', label: 'Live Streams', icon: <Tv className="w-4 h-4 text-red-400" />, badge: 'LIVE' },
  { href: '/podcasts', label: 'Podcasts Network', icon: <Mic className="w-4 h-4 text-purple-400" /> },
  { href: '/communities', label: 'Diaspora Hubs', icon: <Users className="w-4 h-4 text-cyan-400" /> },
];

const COMMERCE_NAV: NavItem[] = [
  { href: '/marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-4 h-4 text-orange-400" /> },
  { href: '/events', label: 'Cultural Events', icon: <Calendar className="w-4 h-4 text-yellow-400" /> },
  { href: '/pages', label: 'Pages & Stores', icon: <Building2 className="w-4 h-4 text-brand-sunriseCoral" />, badge: 'VERIFIED' },
  { href: '/spotpay', label: 'SpotPay Wallet', icon: <Wallet className="w-4 h-4 text-brand-sunriseCoral" /> },
  { href: '/creator-studio', label: 'Creator Studio', icon: <Sparkles className="w-4 h-4 text-brand-caribbeanSea" /> },
];

interface AppSidebarProps {
  currentPath?: string;
}

export default function AppSidebar({ currentPath }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const activePath = currentPath || pathname || '/';

  const personalNav: NavItem[] = [
    { href: '/messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4 text-slate-300" /> },
    { href: '/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 text-slate-300" /> },
    {
      href: user ? '/profile' : '/login',
      label: user ? `@${user.username}` : 'Sign In',
      icon: <User className="w-4 h-4 text-slate-300" />,
    },
    { href: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4 text-slate-300" /> },
  ];
  const renderNavGroup = (items: NavItem[], title?: string) => (
    <div className="space-y-1">
      {title && (
        <p className="text-[10px] font-black tracking-wider uppercase text-brand-sandstone/40 px-3 py-1.5">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive =
          item.href === '/'
            ? activePath === '/'
            : activePath.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/10 text-brand-sandstone border border-brand-caribbeanSea/30 shadow-sm'
                : 'text-slate-300 hover:bg-brand-dusk/60 hover:text-brand-sandstone border border-transparent'
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
                  ? 'bg-brand-sunriseCoral/20 text-brand-sunriseCoral border-brand-sunriseCoral/30'
                  : 'bg-brand-dusk text-brand-sandstone/60 border-slate-700'
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
      <div className="glass rounded-2xl p-3 space-y-4">
        {renderNavGroup(PRIMARY_NAV, 'Explore & Connect')}
        <div className="h-px bg-brand-dusk/60 my-2" />
        
        {/* Accordion for secondary features to reduce visual clutter */}
        <details className="group">
          <summary className="text-[10px] font-black tracking-wider uppercase text-brand-sandstone/40 px-3 py-1.5 cursor-pointer list-none flex justify-between items-center hover:text-slate-300 transition-colors">
            Economy & Culture
            <span className="transition group-open:rotate-180">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>
          </summary>
          <div className="mt-2 space-y-1">
            {COMMERCE_NAV.map((item) => {
              const isActive = activePath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/10 text-brand-sandstone border border-brand-caribbeanSea/30 shadow-sm'
                      : 'text-slate-300 hover:bg-brand-dusk/60 hover:text-brand-sandstone border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                      item.badge === 'VERIFIED'
                        ? 'bg-brand-sunriseCoral/20 text-brand-sunriseCoral border-brand-sunriseCoral/30'
                        : 'bg-brand-dusk text-brand-sandstone/60 border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </details>

        <div className="h-px bg-brand-dusk/60 my-2" />
        {renderNavGroup(personalNav, 'Account')}
      </div>

      {/* Creator Studio Action Card */}
      <div className="glass rounded-2xl p-4 text-center space-y-2.5">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-brand-caribbeanSea uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Caribbean Creator Hub
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Access professional studio tools, Live HD broadcasts, podcast hosting, and direct SpotPay fan memberships with <strong className="text-brand-sunriseCoral">Creator Tiers</strong>.
        </p>
        <Link
          href="/creator-studio"
          className="w-full block bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:from-brand-caribbeanSea hover:to-brand-sunriseCoral text-slate-950 font-black text-xs py-2.5 rounded-2xl transition-all shadow-md shadow-brand-caribbeanSea/20 text-center"
        >
          Open Creator Studio
        </Link>
      </div>
    </aside>
  );
}

