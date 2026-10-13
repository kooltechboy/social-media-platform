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
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useTranslation, TranslationKey } from '@caribbean/localization';
import { useUnreadNotificationsCount, useUnreadMessagesCount } from './notifications-realtime-provider';
import { useSidebar } from './sidebar-context';

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
  const { isCollapsed, toggleCollapse } = useSidebar();
  const unreadNotifications = useUnreadNotificationsCount();
  const unreadMessages = useUnreadMessagesCount();
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const activePath = currentPath || pathname || '/';
  const isOfficialUser = user?.isOfficial || user?.username?.toLowerCase() === 'tukubi';

  // 1. PRIMARY NAVIGATION (11 Unified Global Destinations)
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
      href: '/caribbean',
      labelKey: 'nav.caribbean',
      fallbackLabel: 'Caribbean',
      icon: Globe,
    },
    {
      href: '/reels',
      labelKey: 'nav.reels',
      fallbackLabel: 'Reels & Sounds',
      icon: Film,
    },
    {
      href: '/live',
      labelKey: 'nav.live_streams',
      fallbackLabel: 'Live',
      icon: Tv,
      badge: 'LIVE',
    },
    {
      href: '/communities',
      labelKey: 'nav.communities',
      fallbackLabel: 'Communities',
      icon: Users,
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
      href: '/pages',
      fallbackLabel: 'Pages',
      icon: Building2,
    },
    {
      href: '/podcasts',
      labelKey: 'nav.podcasts',
      fallbackLabel: 'Podcasts',
      icon: Mic,
    },
    {
      href: '/creator-studio',
      labelKey: 'nav.creator_studio',
      fallbackLabel: 'Creator Studio',
      icon: Radio,
      badge: 'STUDIO',
    },
  ];

  // 2. PERSONAL & CONNECT NAVIGATION
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
    {
      href: '/settings',
      labelKey: 'nav.settings',
      fallbackLabel: 'Settings',
      icon: Settings,
    },
  ];

  // 3. TOOLS & ECOSYSTEM (Collapsible)
  const TOOLS_NAV: NavItem[] = [
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
      href: '/creator-hub',
      fallbackLabel: 'Creator Hub',
      icon: Sparkles,
      badge: 'HUB',
    },
    {
      href: '/help',
      fallbackLabel: 'Help & Learn',
      icon: HelpCircle,
    },
  ];

  function isItemActive(href: string): boolean {
    if (href === '/') {
      return activePath === '/' || activePath === '/home' || activePath.startsWith('/feeds');
    }
    if (href === '/caribbean') {
      return activePath === '/caribbean' || activePath.startsWith('/caribbean/') || activePath.startsWith('/diaspora');
    }
    if (href === '/profile') {
      return activePath.startsWith('/profile');
    }
    return activePath.startsWith(href);
  }

  const renderNavList = (items: NavItem[]) => (
    <ul className="space-y-0.5" role="list">
      {items.map((item) => {
        const isActive = isItemActive(item.href);
        const Icon = item.icon;
        const label = item.labelKey ? t(item.labelKey) : (item.label || item.fallbackLabel);

        if (isCollapsed) {
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                title={label}
                aria-label={label}
                className={`relative flex items-center justify-center w-10 h-8 mx-auto rounded-xl transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-caribbeanSea/30 to-brand-sunriseCoral/20 text-white border border-brand-caribbeanSea/50 shadow-md shadow-brand-caribbeanSea/15'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-brand-caribbeanSea' : 'text-slate-400 group-hover:text-brand-caribbeanSea'
                  }`}
                />
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-sunriseCoral text-slate-950 font-black text-[9px] flex items-center justify-center shadow-sm">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
                {item.badge && !item.badgeCount && (
                  <span
                    className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                      item.badge === 'LIVE' ? 'bg-rose-500 animate-pulse' : 'bg-brand-goldenHour'
                    }`}
                  />
                )}
              </Link>
            </li>
          );
        }

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`nav-fit-compact-item flex items-center justify-between px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-bold min-h-[30px] sm:min-h-[32px] transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-caribbeanSea/25 to-brand-sunriseCoral/15 text-white border border-brand-caribbeanSea/40 shadow-sm shadow-brand-caribbeanSea/10'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-brand-caribbeanSea' : 'text-slate-400 group-hover:text-brand-caribbeanSea'
                  }`}
                />
                <span className="truncate">{label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="min-w-[18px] h-4.5 px-1 rounded-full bg-brand-sunriseCoral text-slate-950 font-black text-[9px] flex items-center justify-center shadow-sm">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
                {item.badge && (
                  <span
                    className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full border ${
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
    <nav className="w-full h-full flex flex-col pb-1" aria-label="Global navigation">
      {/* ── 0. Sidebar Collapse / Expand Toggle Button ── */}
      <div className={`flex items-center shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between px-2'} mb-1`}>
        {!isCollapsed && (
          <span className="text-[9.5px] font-black uppercase tracking-wider text-brand-sandstone/50">
            Platform Menu
          </span>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar into compact rail'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded-lg text-brand-sandstone/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5 text-brand-caribbeanSea" />
          ) : (
            <PanelLeftClose className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* ── 1. Create Action Button ── */}
      <div className="px-0.5 shrink-0 mb-1">
        <Link
          href="/create"
          title="Create on TUKUBI"
          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-caribbeanSea via-teal-400 to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black tracking-wide transition-all shadow-md shadow-brand-caribbeanSea/20 hover:shadow-brand-caribbeanSea/30 active:scale-[0.98] ${
            isCollapsed ? 'w-10 h-8 mx-auto p-0' : 'py-1.5 px-3 text-xs min-h-[34px]'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-slate-950 shrink-0" />
          {!isCollapsed && <span>Create on TUKUBI</span>}
        </Link>
      </div>

      {/* ── 2. Primary Navigation Container ── */}
      <div className={`glass rounded-2xl flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar border border-white/10 shadow-lg ${isCollapsed ? 'p-1' : 'p-1.5'}`}>
        {!isCollapsed && (
          <div className="px-2 pt-0.5 pb-0.5 flex items-center justify-between shrink-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-brand-sandstone/50">
              Primary
            </span>
            <span className="text-[8.5px] font-bold text-brand-caribbeanSea/80">Caribbean Global</span>
          </div>
        )}

        {renderNavList(PRIMARY_NAV)}

        <div className="h-px bg-white/10 my-0.5 shrink-0" />

        {!isCollapsed && (
          <div className="px-2 pt-0.5 pb-0.5 shrink-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-brand-sandstone/50">
              Personal &amp; Connect
            </span>
          </div>
        )}

        {renderNavList(SECONDARY_NAV)}

        <div className="h-px bg-white/10 my-0.5 shrink-0" />

        {/* ── 3. More Tools & Ecosystem Accordion / Compact Menu ── */}
        {isCollapsed ? (
          renderNavList(TOOLS_NAV)
        ) : (
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsToolsOpen((prev) => !prev)}
              aria-expanded={isToolsOpen}
              className="w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors min-h-[28px]"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" />
                Tools &amp; Ecosystem
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isToolsOpen ? 'rotate-180 text-brand-caribbeanSea' : ''
                }`}
              />
            </button>

            {isToolsOpen && (
              <div className="pt-0.5 pl-1 space-y-0.5 animate-fadeIn">
                {renderNavList(TOOLS_NAV)}
              </div>
            )}
          </div>
        )}

        {!isCollapsed && (
          <>
            <div className="nav-fit-hide-short h-px bg-white/10 my-0.5 shrink-0" />

            {/* Creator Ecosystem Action Card - Compact & Elegant (hidden on short viewports: links duplicated in nav) */}
            <div className="nav-fit-hide-short glass rounded-xl p-2 space-y-1 shrink-0 border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] font-black text-brand-caribbeanSea uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-brand-goldenHour" /> Caribbean Creator Ecosystem
                </div>
                <Link
                  href="/creator-studio"
                  className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-brand-caribbeanSea/20 text-brand-caribbeanSea hover:brightness-125 transition-all"
                  title="Create, manage, analyze & monetize content"
                >
                  Studio →
                </Link>
              </div>

              <div className="flex items-center gap-1.5 pt-0.5">
                <Link
                  href="/creator-hub"
                  className="flex-1 flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group min-h-[30px]"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-brand-goldenHour flex items-center gap-1 truncate">
                      <Sparkles className="w-3 h-3 shrink-0" /> Creator Hub
                    </p>
                    <p className="text-[8.5px] text-brand-sandstone/60 truncate">
                      Your home base, audience &amp; business
                    </p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-brand-goldenHour opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                </Link>

                <Link
                  href="/creator-studio"
                  className="shrink-0 bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-[10px] px-2.5 py-1.5 rounded-lg transition-all shadow-sm text-center min-h-[30px] flex items-center justify-center whitespace-nowrap"
                >
                  Open Studio
                </Link>
              </div>

              <p className="text-[8.5px] text-center text-brand-sandstone/50 truncate">
                Create, manage, analyze &amp; monetize content
              </p>
            </div>
          </>
        )}

        {/* ── 4. Diaspora / Brand Identity Footer (Safely docked inside scroll container to prevent overlap) ── */}
        {!isCollapsed && (
          <div className="nav-fit-hide-short px-2 pt-1.5 pb-0.5 text-center border-t border-white/5 mt-0.5 shrink-0">
            <p className="text-[9.5px] font-black tracking-wider text-brand-sandstone/60 leading-tight">
              TUKUBI — The Caribbean Connected.
            </p>
            <p className="text-[8.5px] text-brand-sandstone/40 leading-tight">
              Born in the Caribbean. Built for the World.
            </p>
          </div>
        )}
      </div>
    </nav>
  );
}
