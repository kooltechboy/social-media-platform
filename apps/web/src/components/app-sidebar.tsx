'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import {
  Home,
  Layers,
  Compass,
  Film,
  Users,
  Building2,
  ShoppingBag,
  Calendar,
  Mic,
  MessageSquare,
  Bell,
  User,
  PlusCircle,
  Tv,
  Music,
  MapPin,
  Radio,
  Wallet,
  Settings,
  HelpCircle,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Megaphone,
} from 'lucide-react';
import { useTranslation, TranslationKey } from '@caribbean/localization';
import { useUnreadNotificationsCount, useUnreadMessagesCount } from './notifications-realtime-provider';

interface NavItem {
  href: string;
  label?: string;
  labelKey?: TranslationKey;
  fallbackLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeCount?: number;
}

export default function AppSidebar({ currentPath }: { currentPath?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();
  const unreadNotifications = useUnreadNotificationsCount();
  const unreadMessages = useUnreadMessagesCount();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const activePath = currentPath || pathname || '/';
  const isOfficialUser = user?.isOfficial || user?.username?.toLowerCase() === 'tukubi';

  // 1. PRIMARY GLOBAL NAVIGATION (Core 8 destinations)
  const PRIMARY_NAV: NavItem[] = [
    {
      href: '/',
      labelKey: 'nav.home',
      fallbackLabel: 'Home',
      icon: Home,
    },
    {
      href: '/explore',
      labelKey: 'nav.explore',
      fallbackLabel: 'Explore',
      icon: Compass,
    },
    {
      href: '/reels',
      labelKey: 'nav.reels',
      fallbackLabel: 'Reels',
      icon: Film,
    },
    {
      href: '/communities',
      labelKey: 'nav.communities',
      fallbackLabel: 'Communities',
      icon: Users,
    },
    {
      href: '/pages',
      fallbackLabel: 'Pages',
      icon: Building2,
    },
    {
      href: '/marketplace',
      labelKey: 'nav.marketplace',
      fallbackLabel: 'Marketplace',
      icon: ShoppingBag,
    },
    {
      href: '/events',
      labelKey: 'nav.events',
      fallbackLabel: 'Events',
      icon: Calendar,
    },
    {
      href: '/podcasts',
      labelKey: 'nav.podcasts',
      fallbackLabel: 'Podcasts',
      icon: Mic,
    },
  ];

  // 2. SECONDARY NAVIGATION (Personal & Communication)
  const SECONDARY_NAV: NavItem[] = [
    {
      href: '/messages',
      labelKey: 'nav.messages',
      fallbackLabel: 'Messages',
      icon: MessageSquare,
      badgeCount: unreadMessages,
    },
    {
      href: '/notifications',
      labelKey: 'nav.notifications',
      fallbackLabel: 'Notifications',
      icon: Bell,
      badgeCount: unreadNotifications,
    },
    {
      href: user ? (isOfficialUser ? '/profile/tukubi' : '/profile') : '/login',
      labelKey: user ? undefined : 'nav.sign_in',
      label: user ? `@${user.username}` : undefined,
      fallbackLabel: 'Profile',
      icon: User,
      badge: isOfficialUser ? 'OFFICIAL' : undefined,
    },
  ];

  // 3. ECOSYSTEM & TOOLS (More Menu)
  const ECOSYSTEM_NAV: NavItem[] = [
    {
      href: '/live',
      labelKey: 'nav.live_streams',
      fallbackLabel: 'Live Broadcasts',
      icon: Tv,
      badge: 'LIVE',
    },
    {
      href: '/sounds',
      labelKey: 'nav.sounds',
      fallbackLabel: 'Caribbean Sounds',
      icon: Music,
    },
    {
      href: '/map',
      labelKey: 'nav.map',
      fallbackLabel: 'Caribbean Map',
      icon: MapPin,
    },
    {
      href: '/creator-hub',
      fallbackLabel: 'Creator Hub',
      icon: Sparkles,
      badge: 'HUB',
    },
    {
      href: '/creator-studio',
      labelKey: 'nav.creator_studio',
      fallbackLabel: 'Creator Studio',
      icon: Radio,
      badge: 'STUDIO',
    },
    {
      href: '/financial-center',
      labelKey: 'nav.financial_center',
      fallbackLabel: 'Financial Center',
      icon: Wallet,
    },
    {
      href: '/ads',
      fallbackLabel: 'Ads & Promotion',
      icon: Megaphone,
    },
    {
      href: '/settings',
      labelKey: 'nav.settings',
      fallbackLabel: 'Settings',
      icon: Settings,
    },
    {
      href: '/help',
      fallbackLabel: 'Help & Learn',
      icon: HelpCircle,
    },
  ];

  function isItemActive(href: string): boolean {
    if (href === '/') {
      return (
        activePath === '/' ||
        activePath === '/home' ||
        activePath === '/feeds' ||
        activePath.startsWith('/feeds/')
      );
    }
    if (href === '/profile') {
      return activePath.startsWith('/profile');
    }
    return activePath.startsWith(href);
  }

  const renderNavList = (items: NavItem[]) => (
    <ul className="space-y-1" role="list">
      {items.map((item) => {
        const isActive = isItemActive(item.href);
        const Icon = item.icon;
        const label = item.labelKey ? t(item.labelKey) : (item.label || item.fallbackLabel);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs md:text-sm font-bold min-h-[42px] transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-caribbeanSea/25 to-brand-sunriseCoral/15 text-white border border-brand-caribbeanSea/40 shadow-sm shadow-brand-caribbeanSea/10'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-brand-caribbeanSea' : 'text-slate-400 group-hover:text-brand-caribbeanSea'
                  }`}
                />
                <span className="truncate">{label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-sunriseCoral text-slate-950 font-black text-[10px] flex items-center justify-center shadow-sm">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
                {item.badge && (
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      item.badge === 'OFFICIAL'
                        ? 'bg-brand-caribbeanSea/20 text-[#38BDF8] border-[#0EA5E9]/40'
                        : item.badge === 'LIVE'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                        : item.badge === 'STUDIO'
                        ? 'bg-brand-goldenHour/20 text-brand-goldenHour border-brand-goldenHour/30'
                        : 'bg-white/10 text-brand-sandstone/70 border-white/10'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav className="w-full space-y-4 pb-8" aria-label="Global navigation">
      {/* ── 1. Create Action Button ── */}
      <div className="px-1">
        <Link
          href="/create"
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-caribbeanSea via-teal-400 to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-brand-caribbeanSea/20 hover:shadow-brand-caribbeanSea/30 active:scale-[0.98] min-h-[46px]"
        >
          <PlusCircle className="w-5 h-5 text-slate-950 shrink-0" />
          <span>Create on TUKUBI</span>
        </Link>
      </div>

      {/* ── 2. Primary Navigation Container ── */}
      <div className="glass rounded-3xl p-2.5 space-y-3 border border-white/10 shadow-lg">
        <div className="px-2 pt-1 pb-0.5 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-sandstone/50">
            Navigation
          </span>
          <span className="text-[9px] font-bold text-brand-caribbeanSea/80">Caribbean Global</span>
        </div>

        {renderNavList(PRIMARY_NAV)}

        <div className="h-px bg-white/10 my-2" />

        <div className="px-2 pt-0.5 pb-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-sandstone/50">
            Personal &amp; Connect
          </span>
        </div>

        {renderNavList(SECONDARY_NAV)}

        <div className="h-px bg-white/10 my-2" />

        {/* ── 3. More / Ecosystem Accordion ── */}
        <div>
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-expanded={isMoreOpen}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />
              More Ecosystem Features
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isMoreOpen ? 'rotate-180 text-brand-caribbeanSea' : ''
              }`}
            />
          </button>

          {isMoreOpen && (
            <div className="pt-1.5 pl-1 space-y-1 animate-fadeIn">
              {renderNavList(ECOSYSTEM_NAV)}
            </div>
          )}
        </div>

        <div className="h-px bg-white/10 my-2" />

        {/* Creator Ecosystem Action Card */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-brand-caribbeanSea uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Caribbean Creator Ecosystem
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed text-center">
            Grow your presence, connect with fans, and operate your media business on TUKUBI.
          </p>

          <div className="space-y-2 pt-1">
            <Link
              href="/creator-hub"
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group min-h-[44px]"
            >
              <div>
                <p className="text-xs font-black text-brand-goldenHour flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Creator Hub
                </p>
                <p className="text-[10px] text-brand-sandstone/70">
                  Your home base, audience &amp; business
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-brand-goldenHour opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/creator-studio"
              className="w-full block bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all shadow-md shadow-brand-caribbeanSea/20 text-center min-h-[40px] flex items-center justify-center"
            >
              Open Creator Studio
            </Link>
            <p className="text-[10px] text-center text-brand-sandstone/60">
              Create, manage, analyze &amp; monetize content
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. Diaspora / Brand Identity Footer ── */}
      <div className="px-3 py-2 text-center space-y-1">
        <p className="text-[11px] font-black tracking-wider text-brand-sandstone/70">
          TUKUBI — The Caribbean Connected.
        </p>
        <p className="text-[10px] text-brand-sandstone/40">
          Born in the Caribbean. Built for the World.
        </p>
      </div>
    </nav>
  );
}
