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
  Music,
  UserCheck,
  Radio,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useTranslation, TranslationKey } from '@caribbean/localization';

interface NavItem {
  href: string;
  label?: string;
  labelKey?: TranslationKey;
  fallbackLabel?: string;
  icon: React.ReactNode;
  badge?: string;
}

export default function AppSidebar({ currentPath }: { currentPath?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();
  const activePath = currentPath || pathname || '/';

  const isOfficialUser = user?.isOfficial || user?.username?.toLowerCase() === 'tukubi';

  const SOCIAL_NAV: NavItem[] = [
    {
      href: '/',
      labelKey: 'nav.home',
      fallbackLabel: 'Home Feed',
      icon: <Home className="w-5 h-5 text-brand-caribbeanSea" />,
    },
    {
      href: '/friends',
      fallbackLabel: 'Friends & Network',
      icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
    },
    {
      href: '/messages',
      label: t('nav.messages'),
      fallbackLabel: 'Messages',
      icon: <MessageSquare className="w-5 h-5 text-cyan-400" />,
    },
    {
      href: '/notifications',
      label: t('nav.notifications'),
      fallbackLabel: 'Notifications',
      icon: <Bell className="w-5 h-5 text-amber-400" />,
    },
  ];

  const DISCOVERY_NAV: NavItem[] = [
    {
      href: '/explore',
      labelKey: 'nav.explore',
      fallbackLabel: 'Explore Diaspora',
      icon: <Compass className="w-5 h-5 text-brand-goldenHour" />,
    },
    {
      href: '/map',
      labelKey: 'nav.map',
      fallbackLabel: 'Caribbean Map',
      icon: <MapPin className="w-5 h-5 text-rose-400" />,
    },
    {
      href: '/reels',
      labelKey: 'nav.reels_shorts',
      fallbackLabel: 'Reels & Shorts',
      icon: <Video className="w-5 h-5 text-pink-400" />,
    },
    {
      href: '/sounds',
      labelKey: 'nav.sounds',
      fallbackLabel: 'Caribbean Sounds',
      icon: <Music className="w-5 h-5 text-rose-400" />,
    },
    {
      href: '/live',
      labelKey: 'nav.live_streams',
      fallbackLabel: 'Live Broadcasts',
      icon: <Tv className="w-5 h-5 text-red-400" />,
      badge: 'LIVE',
    },
    {
      href: '/podcasts',
      labelKey: 'nav.podcasts',
      fallbackLabel: 'Podcasts Network',
      icon: <Mic className="w-5 h-5 text-purple-400" />,
    },
  ];

  const COMMERCE_NAV: NavItem[] = [
    {
      href: '/communities',
      labelKey: 'nav.communities',
      fallbackLabel: 'Diaspora Hubs',
      icon: <Users className="w-5 h-5 text-cyan-400" />,
    },
    {
      href: '/marketplace',
      labelKey: 'nav.marketplace',
      fallbackLabel: 'Marketplace',
      icon: <ShoppingBag className="w-5 h-5 text-orange-400" />,
    },
    {
      href: '/events',
      labelKey: 'nav.cultural_events',
      fallbackLabel: 'Cultural Events',
      icon: <Calendar className="w-5 h-5 text-yellow-400" />,
    },
    {
      href: '/pages',
      labelKey: 'nav.pages_stores',
      fallbackLabel: 'Pages & Stores',
      icon: <Building2 className="w-5 h-5 text-brand-sunriseCoral" />,
    },
  ];

  const ACCOUNT_NAV: NavItem[] = [
    {
      href: '/creator-hub',
      fallbackLabel: 'Creator Hub',
      icon: <Sparkles className="w-5 h-5 text-brand-goldenHour" />,
      badge: 'HUB',
    },
    {
      href: '/creator-studio',
      labelKey: 'nav.creator_studio',
      fallbackLabel: 'Creator Studio',
      icon: <Radio className="w-5 h-5 text-brand-goldenHour" />,
      badge: 'STUDIO',
    },
    {
      href: '/financial-center',
      labelKey: 'nav.financial_center',
      fallbackLabel: 'Financial Center',
      icon: <Wallet className="w-5 h-5 text-emerald-400" />,
    },
    {
      href: user ? (isOfficialUser ? '/profile/tukubi' : '/profile') : '/login',
      label: user ? `@${user.username}` : t('nav.sign_in'),
      icon: isOfficialUser ? (
        <Sparkles className="w-5 h-5 text-brand-caribbeanSea" />
      ) : (
        <User className="w-5 h-5 text-slate-300" />
      ),
      badge: isOfficialUser ? 'OFFICIAL' : undefined,
    },
    {
      href: '/settings',
      label: t('nav.settings'),
      fallbackLabel: 'Settings',
      icon: <Settings className="w-5 h-5 text-slate-400" />,
    },
    {
      href: '/help',
      label: 'Help & Learn',
      icon: <HelpCircle className="w-5 h-5 text-slate-400" />,
    },
  ];

  const renderNavGroup = (items: NavItem[], title: string) => (
    <div className="space-y-1">
      <p className="text-[10px] md:text-xs font-black tracking-wider uppercase text-brand-sandstone/50 px-3 py-1.5">
        {title}
      </p>
      {items.map((item) => {
        const isActive =
          item.href === '/'
            ? activePath === '/'
            : item.href === '/friends'
            ? activePath.startsWith('/friends') || activePath.startsWith('/people') || activePath.startsWith('/members')
            : activePath.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center justify-between px-3.5 py-2 md:py-2.5 rounded-2xl text-xs md:text-sm font-bold min-h-[40px] transition-all ${
              isActive
                ? 'bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/10 text-brand-sandstone border border-brand-caribbeanSea/30 shadow-sm'
                : 'text-slate-300 hover:bg-brand-dusk/60 hover:text-brand-sandstone border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="truncate">
                {item.labelKey ? t(item.labelKey) : (item.label || item.fallbackLabel)}
              </span>
            </div>
            {item.badge && (
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                  item.badge === 'OFFICIAL'
                    ? 'bg-brand-caribbeanSea/20 text-[#38BDF8] border-[#0EA5E9]/40'
                    : item.badge === 'LIVE'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                    : item.badge === 'STUDIO'
                    ? 'bg-brand-goldenHour/20 text-brand-goldenHour border-brand-goldenHour/30'
                    : 'bg-brand-dusk text-brand-sandstone/60 border-slate-700'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <nav className="w-full space-y-4 pb-8" aria-label="Primary navigation">
      <div className="glass rounded-3xl p-3 space-y-4">
        {renderNavGroup(SOCIAL_NAV, 'Social & Network')}
        <div className="h-px bg-slate-800/80 my-1" />
        {renderNavGroup(DISCOVERY_NAV, 'Discovery & Media')}
        <div className="h-px bg-slate-800/80 my-1" />
        {renderNavGroup(COMMERCE_NAV, 'Hubs & Commerce')}
        <div className="h-px bg-slate-800/80 my-1" />
        {renderNavGroup(ACCOUNT_NAV, 'Creator & Account')}
      </div>

      {/* Creator Ecosystem Action Card */}
      <div className="glass rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-black text-brand-caribbeanSea uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-brand-goldenHour" /> Caribbean Creator Ecosystem
        </div>
        <p className="text-xs text-slate-300 leading-relaxed text-center">
          Grow your presence, connect with fans, and operate your media business on TUKUBI.
        </p>

        <div className="space-y-2 pt-1">
          <Link
            href="/creator-hub"
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group min-h-[44px]"
          >
            <div>
              <p className="text-xs font-black text-brand-goldenHour flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour" /> Creator Hub
              </p>
              <p className="text-[10px] text-brand-sandstone/70">
                Your home base, audience &amp; business
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-goldenHour opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/creator-studio"
            className="w-full block bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs py-2.5 rounded-2xl transition-all shadow-md shadow-brand-caribbeanSea/20 text-center min-h-[40px] flex items-center justify-center"
          >
            Open Creator Studio
          </Link>
          <p className="text-[10px] text-center text-brand-sandstone/60">
            Create, manage, analyze &amp; monetize content
          </p>
        </div>
      </div>
    </nav>
  );
}
