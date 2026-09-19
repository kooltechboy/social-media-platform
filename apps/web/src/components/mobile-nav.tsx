'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Film,
  PlusCircle,
  ShoppingBag,
  User,
  Users,
  Wallet,
  Music,
  Radio,
  MessageSquare,
  Settings,
  LogOut,
  X,
  Sparkles,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useAuth } from './auth-provider';
import UserAvatar from './user-avatar';
import IdentitySwitcher from './identity-switcher';
import { useUnreadMessagesCount } from './notifications-realtime-provider';
import { useTranslation, TranslationKey } from '@caribbean/localization';

interface MobileTab {
  href: string;
  labelKey?: TranslationKey;
  fallbackLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  matchExact?: boolean;
}

const TABS: MobileTab[] = [
  { href: '/', labelKey: 'nav.home', fallbackLabel: 'Home', icon: Home, matchExact: true },
  { href: '/explore', labelKey: 'nav.explore', fallbackLabel: 'Explore', icon: Compass },
  { href: '/create', labelKey: 'nav.create_hub', fallbackLabel: 'Create', icon: PlusCircle },
  { href: '/messages', labelKey: 'nav.messages', fallbackLabel: 'Messages', icon: MessageSquare },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const unreadMessagesCount = useUnreadMessagesCount();
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const createSheetRef = useRef<HTMLDivElement>(null);

  // Close sheets on route change
  useEffect(() => {
    setIsProfileSheetOpen(false);
    setIsCreateSheetOpen(false);
  }, [pathname]);

  // Handle outside taps
  useEffect(() => {
    if (!isProfileSheetOpen && !isCreateSheetOpen) return;
    function handleOutsideTap(e: TouchEvent | MouseEvent) {
      if (
        isProfileSheetOpen &&
        sheetRef.current &&
        !sheetRef.current.contains(e.target as Node)
      ) {
        setIsProfileSheetOpen(false);
      }
      if (
        isCreateSheetOpen &&
        createSheetRef.current &&
        !createSheetRef.current.contains(e.target as Node)
      ) {
        setIsCreateSheetOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideTap);
    document.addEventListener('touchstart', handleOutsideTap);
    return () => {
      document.removeEventListener('mousedown', handleOutsideTap);
      document.removeEventListener('touchstart', handleOutsideTap);
    };
  }, [isProfileSheetOpen, isCreateSheetOpen]);

  const handleSignOut = async () => {
    setIsProfileSheetOpen(false);
    await signOut();
  };

  const isProfileActive = pathname === '/profile' || pathname.startsWith('/profile/');

  return (
    <>
      {/* ── Create Quick Actions Bottom Sheet ── */}
      {isCreateSheetOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Caribbean Creation Hub"
        >
          <div
            ref={createSheetRef}
            className="w-full bg-[#160F22]/95 backdrop-blur-2xl border-t border-brand-sunsetPurple/40 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-slideUp max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-1">
              <div>
                <p className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-sunriseCoral" />
                  Create on TUKUBI
                </p>
                <p className="text-xs text-brand-sandstone/60">
                  Publish across the Caribbean and global diaspora
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSheetOpen(false)}
                aria-label="Close creation menu"
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <Link
                href="/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-twilight/80 hover:bg-brand-dusk border border-white/5 text-center min-h-[85px] transition-all hover:border-brand-sunriseCoral/40"
              >
                <span className="text-2xl mb-1">📝</span>
                <span className="text-xs font-black text-white">Post</span>
                <span className="text-[9px] text-brand-sandstone/60">Story & Discussion</span>
              </Link>

              <Link
                href="/reels"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-twilight/80 hover:bg-brand-dusk border border-white/5 text-center min-h-[85px] transition-all hover:border-brand-sunriseCoral/40"
              >
                <span className="text-2xl mb-1">🎬</span>
                <span className="text-xs font-black text-white">Reel</span>
                <span className="text-[9px] text-brand-sandstone/60">9:16 Video</span>
              </Link>

              <Link
                href="/pages/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-twilight/80 hover:bg-brand-dusk border border-white/5 text-center min-h-[85px] transition-all hover:border-brand-sunriseCoral/40"
              >
                <span className="text-2xl mb-1">🏢</span>
                <span className="text-xs font-black text-white">Page</span>
                <span className="text-[9px] text-brand-sandstone/60">Brand & Store</span>
              </Link>

              <Link
                href="/communities/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-twilight/80 hover:bg-brand-dusk border border-white/5 text-center min-h-[85px] transition-all hover:border-brand-sunriseCoral/40"
              >
                <span className="text-2xl mb-1">🌴</span>
                <span className="text-xs font-black text-white">Hub</span>
                <span className="text-[9px] text-brand-sandstone/60">Diaspora Guild</span>
              </Link>

              <Link
                href="/events"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-twilight/80 hover:bg-brand-dusk border border-white/5 text-center min-h-[85px] transition-all hover:border-brand-sunriseCoral/40"
              >
                <span className="text-2xl mb-1">🎟️</span>
                <span className="text-xs font-black text-white">Event</span>
                <span className="text-[9px] text-brand-sandstone/60">Fete & Gathering</span>
              </Link>

              <Link
                href="/marketplace/seller-center/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-twilight/80 hover:bg-brand-dusk border border-white/5 text-center min-h-[85px] transition-all hover:border-brand-sunriseCoral/40"
              >
                <span className="text-2xl mb-1">🛒</span>
                <span className="text-xs font-black text-white">Market</span>
                <span className="text-[9px] text-brand-sandstone/60">Sell Product</span>
              </Link>

              <Link
                href="/sounds"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-twilight/80 hover:bg-brand-dusk border border-white/5 text-center min-h-[85px] transition-all hover:border-brand-sunriseCoral/40"
              >
                <span className="text-2xl mb-1">🎵</span>
                <span className="text-xs font-black text-white">Sound</span>
                <span className="text-[9px] text-brand-sandstone/60">Beats & Stems</span>
              </Link>

              <Link
                href="/live"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-twilight/80 hover:bg-brand-dusk border border-white/5 text-center min-h-[85px] transition-all hover:border-brand-sunriseCoral/40"
              >
                <span className="text-2xl mb-1">🔴</span>
                <span className="text-xs font-black text-white">Live</span>
                <span className="text-[9px] text-brand-sandstone/60">Broadcast Live</span>
              </Link>

              <Link
                href="/podcasts"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-brand-twilight/80 hover:bg-brand-dusk border border-white/5 text-center min-h-[85px] transition-all hover:border-brand-sunriseCoral/40"
              >
                <span className="text-2xl mb-1">🎙️</span>
                <span className="text-xs font-black text-white">Podcast</span>
                <span className="text-[9px] text-brand-sandstone/60">Audio Episode</span>
              </Link>
            </div>

            <div className="h-safe-b pb-2" />
          </div>
        </div>
      )}

      {/* ── Profile & Ecosystem Drawer Bottom Sheet ── */}
      {isProfileSheetOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Profile and Ecosystem Menu"
        >
          <div
            ref={sheetRef}
            className="w-full bg-[#160F22]/95 backdrop-blur-2xl border-t border-brand-sunsetPurple/40 rounded-t-3xl p-5 space-y-3 shadow-2xl animate-slideUp max-h-[85vh] overflow-y-auto"
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={user?.avatarUrl}
                  name={user?.displayName || 'You'}
                  size="md"
                />
                <div>
                  <p className="text-sm font-extrabold text-white leading-tight">
                    {user?.displayName || 'Caribbean Member'}
                  </p>
                  <p className="text-xs text-brand-sandstone/60">
                    @{user?.username || 'member'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileSheetOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-px bg-white/10" />

            {/* Identity Switcher */}
            <div className="py-1">
              <IdentitySwitcher variant="full" />
            </div>

            <div className="h-px bg-white/10" />

            {/* Ecosystem Navigation Links */}
            <div className="space-y-1.5">
              <Link
                href="/explore"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <Compass className="w-5 h-5 text-brand-goldenHour flex-shrink-0" />
                <span>{t('nav.explore')} &amp; Diaspora</span>
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <User className="w-5 h-5 text-brand-caribbeanSea flex-shrink-0" />
                <span>View Profile</span>
              </Link>

              <Link
                href="/marketplace"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <ShoppingBag className="w-5 h-5 text-brand-sunriseCoral flex-shrink-0" />
                <span>{t('nav.marketplace')}</span>
              </Link>

              <Link
                href="/reels"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <Film className="w-5 h-5 text-brand-goldenHour flex-shrink-0" />
                <span>{t('nav.reels')}</span>
              </Link>

              <Link
                href="/financial-center"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <Wallet className="w-5 h-5 text-brand-goldenHour flex-shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span>{t('nav.financial_center')}</span>
                  <span className="text-[10px] uppercase font-black bg-brand-goldenHour/20 text-brand-goldenHour px-2 py-0.5 rounded-full">
                    Ledger
                  </span>
                </div>
              </Link>

              <Link
                href="/communities"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <Users className="w-5 h-5 text-brand-caribbeanSea flex-shrink-0" />
                <span>{t('nav.communities')}</span>
              </Link>

              <Link
                href="/sounds"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <Music className="w-5 h-5 text-brand-sunriseCoral flex-shrink-0" />
                <span>{t('nav.sounds')}</span>
              </Link>

              <Link
                href="/live"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <Radio className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span>{t('nav.live_streams')}</span>
              </Link>

              <Link
                href="/people"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <Users className="w-5 h-5 text-brand-caribbeanSea flex-shrink-0" />
                <span>People &amp; Network</span>
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <Settings className="w-5 h-5 text-brand-sandstone flex-shrink-0" />
                <span>{t('nav.settings')}</span>
              </Link>

              <Link
                href="/help"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-brand-twilight/70 hover:bg-brand-dusk border border-white/5 text-white text-sm font-bold transition-colors min-h-[44px]"
                onClick={() => setIsProfileSheetOpen(false)}
              >
                <HelpCircle className="w-5 h-5 text-brand-caribbeanSea flex-shrink-0" />
                <span>Help &amp; Learn</span>
              </Link>
            </div>

            <div className="h-px bg-white/10" />

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-sm font-bold transition-colors min-h-[44px] active:scale-[0.98]"
              aria-label="Sign out of your TUKUBI account"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Sign Out</span>
            </button>

            {/* Safe area spacer */}
            <div className="h-safe-b pb-2" />
          </div>
        </div>
      )}

      {/* ── Bottom Tab Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#110D17]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl"
        aria-label="Main navigation"
      >
        <ul className="flex items-center justify-around px-2 py-2" role="tablist">
          {TABS.map((tab) => {
            const isActive = tab.matchExact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            const Icon = tab.icon;
            const isCreate = tab.href === '/create';
            const tabLabel = tab.labelKey ? t(tab.labelKey) : tab.fallbackLabel;

            return (
              <li key={tab.href} role="presentation">
                {isCreate ? (
                  <button
                    type="button"
                    role="tab"
                    aria-label="Open Creation Menu"
                    onClick={() => setIsCreateSheetOpen(true)}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] justify-center text-slate-950"
                  >
                    <span className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral flex items-center justify-center -mt-5 shadow-lg shadow-brand-caribbeanSea/40 border-2 border-slate-950">
                      <Icon className="w-6 h-6 text-slate-950" />
                    </span>
                    <span className="text-[10px] font-black text-brand-caribbeanSea">
                      {tabLabel}
                    </span>
                  </button>
                ) : (
                  <Link
                    href={tab.href}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={tabLabel}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] justify-center ${
                      isActive
                        ? 'text-brand-caribbeanSea font-bold'
                        : 'text-brand-sandstone/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {tab.href === '/messages' && unreadMessagesCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-caribbeanSea rounded-full animate-pulse shadow-[0_0_6px_rgba(0,168,150,0.9)]" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold">{tabLabel}</span>
                  </Link>
                )}
              </li>
            );
          })}

          {/* Profile tab — triggers bottom sheet */}
          <li role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={isProfileActive || isProfileSheetOpen}
              aria-haspopup="dialog"
              aria-expanded={isProfileSheetOpen}
              aria-label={user ? `Profile menu for @${user.username}` : 'Profile'}
              onClick={() => setIsProfileSheetOpen((prev) => !prev)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] justify-center ${
                isProfileActive || isProfileSheetOpen
                  ? 'text-brand-caribbeanSea font-bold'
                  : 'text-brand-sandstone/60 hover:text-slate-200'
              }`}
            >
              {user?.avatarUrl ? (
                <span
                  className={`w-5 h-5 rounded-full overflow-hidden ring-2 ${
                    isProfileSheetOpen ? 'ring-brand-caribbeanSea' : 'ring-transparent'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    aria-hidden="true"
                  />
                </span>
              ) : (
                <User className="w-5 h-5" aria-hidden="true" />
              )}
              <span className="text-[10px] font-bold">
                {t('nav.profile' as any) || 'Profile'}
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
