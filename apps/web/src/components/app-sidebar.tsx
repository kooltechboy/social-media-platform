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
  UserPlus,
  Radio,
  ArrowRight,
  HelpCircle,
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

const PRIMARY_NAV: NavItem[] = [
  { href: '/', labelKey: 'nav.home', fallbackLabel: 'Home Feed', icon: <Home className="w-5 h-5 text-brand-caribbeanSea" /> },
  { href: '/people', fallbackLabel: 'People & Network', icon: <Users className="w-5 h-5 text-brand-caribbeanSea" /> },
  { href: '/create', labelKey: 'nav.create_hub', fallbackLabel: 'Create Hub', icon: <PlusCircle className="w-5 h-5 text-brand-sunriseCoral" />, badge: 'NEW' },
  { href: '/explore', labelKey: 'nav.explore', fallbackLabel: 'Explore & Diaspora', icon: <Compass className="w-5 h-5 text-brand-goldenHour" /> },
  { href: '/map', labelKey: 'nav.map', fallbackLabel: 'Caribbean Map', icon: <MapPin className="w-5 h-5 text-rose-400" /> },
  { href: '/reels', labelKey: 'nav.reels_shorts', fallbackLabel: 'Reels & Shorts', icon: <Video className="w-5 h-5 text-pink-400" /> },
  { href: '/sounds', labelKey: 'nav.sounds', fallbackLabel: 'Caribbean Sounds', icon: <Music className="w-5 h-5 text-rose-400" />, badge: 'NEW' },
  { href: '/live', labelKey: 'nav.live_streams', fallbackLabel: 'Live Streams', icon: <Tv className="w-5 h-5 text-red-400" />, badge: 'LIVE' },
  { href: '/podcasts', labelKey: 'nav.podcasts', fallbackLabel: 'Podcasts Network', icon: <Mic className="w-5 h-5 text-purple-400" /> },
  { href: '/communities', labelKey: 'nav.communities', fallbackLabel: 'Diaspora Hubs', icon: <Users className="w-5 h-5 text-cyan-400" /> },
];

const COMMERCE_NAV: NavItem[] = [
  { href: '/marketplace', labelKey: 'nav.marketplace', fallbackLabel: 'Marketplace', icon: <ShoppingBag className="w-5 h-5 text-orange-400" /> },
  { href: '/events', labelKey: 'nav.cultural_events', fallbackLabel: 'Cultural Events', icon: <Calendar className="w-5 h-5 text-yellow-400" /> },
  { href: '/pages', labelKey: 'nav.pages_stores', fallbackLabel: 'Pages & Stores', icon: <Building2 className="w-5 h-5 text-brand-sunriseCoral" />, badge: 'VERIFIED' },
  { href: '/financial-center', labelKey: 'nav.financial_center', fallbackLabel: 'Financial Center', icon: <Wallet className="w-5 h-5 text-brand-sunriseCoral" /> },
  { href: '/creator-hub', fallbackLabel: 'Creator Hub', icon: <Sparkles className="w-5 h-5 text-brand-goldenHour" />, badge: 'HUB' },
  { href: '/creator-studio', labelKey: 'nav.creator_studio', fallbackLabel: 'Creator Studio', icon: <Radio className="w-5 h-5 text-brand-caribbeanSea" /> },
];

interface AppSidebarProps {
  currentPath?: string;
}

export default function AppSidebar({ currentPath }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useTranslation();
  const activePath = currentPath || pathname || '/';

  const isOfficialUser = user?.isOfficial || user?.username?.toLowerCase() === 'tukubi';

  const personalNav: NavItem[] = [
    { href: '/messages', label: t('nav.messages'), icon: <MessageSquare className="w-5 h-5 text-slate-300" /> },
    { href: '/notifications', label: t('nav.notifications'), icon: <Bell className="w-5 h-5 text-slate-300" /> },
    {
      href: user ? (isOfficialUser ? '/profile/tukubi' : '/profile') : '/login',
      label: user ? `@${user.username}` : t('nav.sign_in'),
      icon: isOfficialUser ? <Sparkles className="w-5 h-5 text-brand-caribbeanSea" /> : <User className="w-5 h-5 text-slate-300" />,
      badge: isOfficialUser ? 'OFFICIAL' : undefined,
    },
    { href: '/settings', label: t('nav.settings'), icon: <Settings className="w-5 h-5 text-slate-300" /> },
    { href: '/help', label: 'Help & Learn', icon: <HelpCircle className="w-5 h-5 text-slate-300" /> },
  ];
  const renderNavGroup = (items: NavItem[], title?: string) => (
    <div className="space-y-1">
      {title && (
        <p className="text-[10px] md:text-xs font-black tracking-wider uppercase text-brand-sandstone/50 px-3 py-1.5">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive =
          item.href === '/'
            ? activePath === '/'
            : item.href === '/people'
            ? activePath.startsWith('/people') || activePath.startsWith('/members') || activePath.startsWith('/friends')
            : activePath.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center justify-between px-3.5 py-2.5 md:py-3 rounded-2xl text-xs md:text-[15px] font-bold min-h-[42px] md:min-h-[46px] transition-all ${
              isActive
                ? 'bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/10 text-brand-sandstone border border-brand-caribbeanSea/30 shadow-sm'
                : 'text-slate-300 hover:bg-brand-dusk/60 hover:text-brand-sandstone border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3 md:gap-3.5">
              {item.icon}
              <span>{item.labelKey ? t(item.labelKey) : (item.label || item.fallbackLabel)}</span>
            </div>
            {item.badge && (
              <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full border ${
                item.badge === 'OFFICIAL'
                  ? 'bg-brand-caribbeanSea/20 text-[#38BDF8] border-[#0EA5E9]/40 font-black'
                  : item.badge === 'LIVE'
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
    <nav className="w-full space-y-5 pb-8" aria-label="Primary navigation">
      <div className="glass rounded-2xl p-3 space-y-4">
        {renderNavGroup(PRIMARY_NAV, t('nav.explore_connect'))}
        <div className="h-px bg-brand-dusk/60 my-2" />
        
        {/* Accordion for secondary features to reduce visual clutter */}
        <details className="group">
          <summary className="text-[10px] md:text-xs font-black tracking-wider uppercase text-brand-sandstone/50 px-3 py-2 cursor-pointer list-none flex justify-between items-center hover:text-slate-300 transition-colors">
            {t('nav.economy_culture')}
            <span className="transition group-open:rotate-180">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
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
                  className={`flex items-center justify-between px-3.5 py-2.5 md:py-3 rounded-2xl text-xs md:text-[15px] font-bold min-h-[42px] md:min-h-[46px] transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/10 text-brand-sandstone border border-brand-caribbeanSea/30 shadow-sm'
                      : 'text-slate-300 hover:bg-brand-dusk/60 hover:text-brand-sandstone border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-3.5">
                    {item.icon}
                    <span>{item.labelKey ? t(item.labelKey) : (item.label || item.fallbackLabel)}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full border ${
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
        {renderNavGroup(personalNav, t('settings.account'))}
      </div>

      {/* Creator Ecosystem Action Card */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-black text-brand-caribbeanSea uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-brand-goldenHour" /> Caribbean Creator Ecosystem
        </div>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed text-center">
          Grow your presence, connect with fans, and operate your media business on TUKUBI.
        </p>

        <div className="space-y-2 pt-1">
          <Link
            href="/creator-hub"
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left group min-h-[44px]"
          >
            <div>
              <p className="text-xs md:text-sm font-black text-brand-goldenHour flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" /> Creator Hub
              </p>
              <p className="text-[10px] md:text-xs text-brand-sandstone/70">
                Your home base, audience &amp; business
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-goldenHour opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/creator-studio"
            className="w-full block bg-gradient-to-r from-brand-caribbeanSea to-brand-sunriseCoral hover:brightness-110 text-slate-950 font-black text-xs md:text-sm py-2.5 md:py-3 rounded-xl transition-all shadow-md shadow-brand-caribbeanSea/20 text-center min-h-[44px]"
          >
            Open Creator Studio
          </Link>
          <p className="text-[10px] md:text-xs text-center text-brand-sandstone/60">
            Create, manage, analyze &amp; monetize content
          </p>
        </div>
      </div>
    </nav>
  );
}
