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
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import UserAvatar from './user-avatar';
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

  // 1. PRIMARY NAVIGATION (11 Unified Global Destinations — Image 2 Alignment)
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
      href: '/shorts',
      fallbackLabel: 'Shorts',
      icon: Film,
      badge: 'HOT',
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
      href: '/creator-studio',
      labelKey: 'nav.creator_studio',
      fallbackLabel: 'Creator Studio',
      icon: Radio,
      badge: 'STUDIO',
    },
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
      href: '/settings',
      labelKey: 'nav.settings',
      fallbackLabel: 'Settings',
      icon: Settings,
    },
  ];

  // 2. TOOLS & ECOSYSTEM (Collapsible)
  const TOOLS_NAV: NavItem[] = [
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
      fallbackLabel: 'Live Streams',
      icon: Tv,
      badge: 'LIVE',
    },
    {
      href: '/pages?tab=my-pages',
      fallbackLabel: 'My Pages',
      icon: ShieldCheck,
      badge: 'PAGES',
    },
    {
      href: '/pages/create',
      fallbackLabel: 'Create Page',
      icon: PlusCircle,
      badge: 'NEW',
    },
    {
      href: '/podcasts',
      labelKey: 'nav.podcasts',
      fallbackLabel: 'Podcasts',
      icon: Mic,
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
    if (href === '/shorts') {
      return activePath === '/shorts' || activePath.startsWith('/shorts/');
    }
    if (href === '/reels') {
      return activePath === '/reels' || activePath.startsWith('/reels/');
    }
    if (href === '/profile') {
      return activePath.startsWith('/profile');
    }
    if (href === '/pages') {
      return activePath === '/pages';
    }
    if (href === '/pages?tab=my-pages') {
      return activePath.includes('tab=my-pages') || activePath.includes('/manage');
    }
    if (href === '/pages/create') {
      return activePath === '/pages/create';
    }
    return activePath.startsWith(href);
  }

  const renderNavList = (items: NavItem[]) => (
    <ul className="space-y-px" role="list">
      {items.map((item) => {
        if (isCollapsed && item.href === '/pages?tab=my-pages') {
          return null;
        }
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
                className={`relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-colors group ${
                  isActive
                    ? 'bg-brand-caribbeanSea/[0.14] text-white ring-1 ring-inset ring-brand-caribbeanSea/30'
                    : 'text-brand-mist hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? 'text-brand-caribbeanSea' : 'text-brand-mist group-hover:text-white'
                  }`}
                />
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-caribbeanSea text-[#04101F] font-semibold text-[9px] flex items-center justify-center ring-2 ring-brand-twilight">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
                {item.badge && !item.badgeCount && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                      item.badge === 'LIVE' ? 'bg-rose-500' : 'bg-brand-goldenHour'
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
              className={`nav-fit-compact-item relative flex items-center justify-between pl-3 pr-2.5 py-2 rounded-xl text-[13.5px] min-h-[38px] transition-colors group ${
                isActive
                  ? 'bg-brand-caribbeanSea/[0.12] text-white font-semibold'
                  : 'text-[#C3CCDA] font-medium hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-brand-caribbeanTeal to-brand-caribbeanSea"
                />
              )}
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    isActive ? 'text-brand-caribbeanSea' : 'text-brand-mist group-hover:text-white'
                  }`}
                />
                <span className="truncate">{label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-caribbeanSea text-[#04101F] font-semibold text-[10.5px] flex items-center justify-center tabular-nums">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
                {item.badge && (
                  <span
                    className={`text-[9.5px] font-semibold tracking-[0.06em] px-1.5 py-[3px] rounded-md leading-none ${
                      item.badge === 'OFFICIAL'
                        ? 'bg-brand-caribbeanSea/10 text-sky-300'
                        : item.badge === 'LIVE'
                        ? 'bg-rose-500/12 text-rose-300'
                        : item.badge === 'STUDIO'
                        ? 'bg-brand-goldenHour/10 text-brand-goldenHour'
                        : 'bg-white/[0.06] text-brand-mist'
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
    <nav className="w-full h-full flex flex-col gap-2 pb-2" aria-label="Global navigation">
      {/* ── 1. Create Action + Collapse Toggle ── */}
      <div className={`flex items-center gap-1.5 shrink-0 ${isCollapsed ? 'flex-col' : ''}`}>
        <Link
          href="/create"
          title="Create on TUKUBI"
          className={`tk-btn-primary flex items-center justify-center gap-2 rounded-xl ${
            isCollapsed ? 'w-10 h-10 p-0' : 'flex-1 h-10 px-3 text-[13.5px]'
          }`}
        >
          <PlusCircle className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && <span>Create</span>}
        </Link>
        <button
          type="button"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar into compact rail'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-brand-mist hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-[18px] h-[18px]" />
          ) : (
            <PanelLeftClose className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>

      {/* ── 2. Primary Navigation Container ── */}
      <div className={`tk-panel flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar ${isCollapsed ? 'p-1.5' : 'p-2'}`}>
        {!isCollapsed && (
          <div className="px-3 pt-1.5 pb-2 shrink-0">
            <span className="tk-section-label">Menu</span>
          </div>
        )}

        {renderNavList(PRIMARY_NAV)}

        <div className="h-px bg-white/[0.06] my-2 mx-2 shrink-0" />

        {/* ── 3. More Tools & Ecosystem Accordion / Compact Menu ── */}
        {isCollapsed ? (
          renderNavList(TOOLS_NAV)
        ) : (
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsToolsOpen((prev) => !prev)}
              aria-expanded={isToolsOpen}
              className="w-full flex items-center justify-between pl-3 pr-2.5 py-2 rounded-xl text-[13px] font-medium text-brand-mist hover:text-white hover:bg-white/[0.04] transition-colors min-h-[38px]"
            >
              <span className="flex items-center gap-3">
                <Sparkles className="w-[18px] h-[18px] text-brand-goldenHour/90" />
                Discover more
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isToolsOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {isToolsOpen && (
              <div className="pt-1 space-y-2 animate-fadeIn">
                <div className="space-y-px">{renderNavList(TOOLS_NAV)}</div>

                <div className="mx-1 p-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-1.5">
                  <Link
                    href="/creator-hub"
                    className="block px-2 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="text-[12px] font-semibold text-white block">
                      Creator Hub
                    </span>
                    <span className="text-[10.5px] text-brand-mist block leading-snug">
                      Your home base, audience &amp; business
                    </span>
                  </Link>
                  <Link
                    href="/creator-studio"
                    className="block px-2 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="text-[12px] font-semibold text-brand-caribbeanSea block">
                      Creator Studio
                    </span>
                    <span className="text-[10.5px] text-brand-mist block leading-snug">
                      Create, manage, analyze &amp; monetize content
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 4. Bottom User Profile Card ── */}
        {user && (
          <div className="pt-2 mt-auto shrink-0">
            <div className="h-px bg-white/[0.06] mx-2 mb-2" />
            <Link
              href={isOfficialUser ? '/profile/tukubi' : '/profile'}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.05] transition-colors group ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="View your profile"
            >
              <UserAvatar
                src={user.avatarUrl}
                name={user.displayName || user.username}
                size="sm"
              />
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-semibold text-white truncate">
                      {user.displayName || user.username}
                    </span>
                    {user.isVerified && (
                      <CheckCircle className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
                    )}
                  </div>
                  <span className="text-[11.5px] text-brand-mist truncate block">
                    @{user.username}
                  </span>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* ── 5. Brand Identity Footer ── */}
        {!isCollapsed && (
          <div className="nav-fit-hide-short px-3 pt-2 pb-1 shrink-0 space-y-0.5">
            <p className="text-[11px] font-semibold text-[#94A3B8] leading-snug">
              TUKUBI — The Caribbean Connected.
            </p>
            <p className="text-[10.5px] text-[#6B7A90] leading-snug">
              Born in the Caribbean. Built for the World.
            </p>
          </div>
        )}
      </div>
    </nav>
  );
}
