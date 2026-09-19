'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Layers,
  Compass,
  PlusCircle,
  Menu,
  ShoppingBag,
  User,
  Users,
  Building2,
  Wallet,
  Music,
  Radio,
  Tv,
  Film,
  Calendar,
  Mic,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  X,
  Sparkles,
  HelpCircle,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from './auth-provider';
import UserAvatar from './user-avatar';
import IdentitySwitcher from './identity-switcher';
import { useUnreadMessagesCount, useUnreadNotificationsCount } from './notifications-realtime-provider';
import { useTranslation, TranslationKey } from '@caribbean/localization';

interface MobileTab {
  href: string;
  labelKey?: TranslationKey;
  fallbackLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isAction?: boolean;
}

export default function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const unreadMessagesCount = useUnreadMessagesCount();
  const unreadNotificationsCount = useUnreadNotificationsCount();
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const menuSheetRef = useRef<HTMLDivElement>(null);
  const createSheetRef = useRef<HTMLDivElement>(null);

  // Close sheets on route change
  useEffect(() => {
    setIsMenuSheetOpen(false);
    setIsCreateSheetOpen(false);
  }, [pathname]);

  // Handle outside taps
  useEffect(() => {
    if (!isMenuSheetOpen && !isCreateSheetOpen) return;
    function handleOutsideTap(e: TouchEvent | MouseEvent) {
      if (
        isMenuSheetOpen &&
        menuSheetRef.current &&
        !menuSheetRef.current.contains(e.target as Node)
      ) {
        setIsMenuSheetOpen(false);
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
  }, [isMenuSheetOpen, isCreateSheetOpen]);

  const handleSignOut = async () => {
    setIsMenuSheetOpen(false);
    await signOut();
  };

  const isHomeActive = pathname === '/' || pathname === '/home';
  const isFeedsActive = pathname === '/feeds' || pathname.startsWith('/feeds/');
  const isExploreActive = pathname === '/explore' || pathname.startsWith('/explore/');

  // Core 5 mobile navigation items
  const MOBILE_TABS: MobileTab[] = [
    { href: '/', labelKey: 'nav.home', fallbackLabel: 'Home', icon: Home },
    { href: '/feeds', fallbackLabel: 'Feeds', icon: Layers },
    { href: '/create', fallbackLabel: 'Create', icon: PlusCircle, isAction: true },
    { href: '/explore', labelKey: 'nav.explore', fallbackLabel: 'Explore', icon: Compass },
  ];

  return (
    <>
      {/* ── 1. Create Quick Actions Bottom Sheet ── */}
      {isCreateSheetOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Create on TUKUBI"
        >
          <div
            ref={createSheetRef}
            className="w-full bg-[#140D20]/98 backdrop-blur-2xl border-t border-white/15 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-slideUp max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral flex items-center justify-center text-slate-950 font-black shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-base font-black text-white">Create on TUKUBI</p>
                  <p className="text-[11px] text-brand-sandstone/60">
                    Publish across the Caribbean and global diaspora
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSheetOpen(false)}
                aria-label="Close creation menu"
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <Link
                href="/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center min-h-[88px] transition-all"
              >
                <span className="text-2xl mb-1">📝</span>
                <span className="text-xs font-black text-white">Post</span>
                <span className="text-[10px] text-brand-sandstone/60">Story &amp; Photo</span>
              </Link>

              <Link
                href="/reels"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center min-h-[88px] transition-all"
              >
                <span className="text-2xl mb-1">🎬</span>
                <span className="text-xs font-black text-white">Reel</span>
                <span className="text-[10px] text-brand-sandstone/60">9:16 Video</span>
              </Link>

              <Link
                href="/live"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center min-h-[88px] transition-all"
              >
                <span className="text-2xl mb-1">🔴</span>
                <span className="text-xs font-black text-rose-400">Go Live</span>
                <span className="text-[10px] text-brand-sandstone/60">Broadcast</span>
              </Link>

              <Link
                href="/events"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center min-h-[88px] transition-all"
              >
                <span className="text-2xl mb-1">🎟️</span>
                <span className="text-xs font-black text-white">Event</span>
                <span className="text-[10px] text-brand-sandstone/60">Cultural Fete</span>
              </Link>

              <Link
                href="/marketplace/seller-center/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center min-h-[88px] transition-all"
              >
                <span className="text-2xl mb-1">🛒</span>
                <span className="text-xs font-black text-white">Market</span>
                <span className="text-[10px] text-brand-sandstone/60">Sell Product</span>
              </Link>

              <Link
                href="/communities/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center min-h-[88px] transition-all"
              >
                <span className="text-2xl mb-1">🌴</span>
                <span className="text-xs font-black text-white">Community</span>
                <span className="text-[10px] text-brand-sandstone/60">Diaspora Hub</span>
              </Link>

              <Link
                href="/pages/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center min-h-[88px] transition-all"
              >
                <span className="text-2xl mb-1">🏢</span>
                <span className="text-xs font-black text-white">Page</span>
                <span className="text-[10px] text-brand-sandstone/60">Brand &amp; Org</span>
              </Link>

              <Link
                href="/podcasts"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center min-h-[88px] transition-all"
              >
                <span className="text-2xl mb-1">🎙️</span>
                <span className="text-xs font-black text-white">Podcast</span>
                <span className="text-[10px] text-brand-sandstone/60">Audio Show</span>
              </Link>

              <Link
                href="/sounds"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center min-h-[88px] transition-all"
              >
                <span className="text-2xl mb-1">🎵</span>
                <span className="text-xs font-black text-white">Sound</span>
                <span className="text-[10px] text-brand-sandstone/60">Rhythm Track</span>
              </Link>
            </div>

            <div className="pt-2 pb-2 text-center">
              <Link
                href="/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-black text-brand-caribbeanSea hover:underline"
              >
                Open Full Universal Create Studio →
              </Link>
            </div>
            <div className="h-safe-b pb-2" />
          </div>
        </div>
      )}

      {/* ── 2. Full Ecosystem Menu Sheet ── */}
      {isMenuSheetOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="TUKUBI Ecosystem Menu"
        >
          <div
            ref={menuSheetRef}
            className="w-full bg-[#140D20]/98 backdrop-blur-2xl border-t border-white/15 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-slideUp max-h-[88vh] overflow-y-auto"
          >
            {/* User Profile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <Link
                href={user ? `/profile/${user.username}` : '/login'}
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center gap-3 min-w-0"
              >
                <UserAvatar
                  src={user?.avatarUrl}
                  name={user?.displayName || 'Caribbean Member'}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-white truncate">
                    {user?.displayName || 'Sign in to TUKUBI'}
                  </p>
                  <p className="text-xs text-brand-sandstone/60 truncate">
                    {user ? `@${user.username}` : 'The Caribbean Connected'}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuSheetOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Operating Identity Switcher */}
            <div className="py-0.5">
              <IdentitySwitcher variant="compact" />
            </div>

            {/* Ecosystem Navigation Links */}
            <div className="space-y-1 pt-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-brand-sandstone/50 px-2 py-1">
                Ecosystem Destinations
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/pages"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors"
                >
                  <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Pages</span>
                </Link>

                <Link
                  href="/communities"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors"
                >
                  <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Communities</span>
                </Link>

                <Link
                  href="/marketplace"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-brand-sunriseCoral shrink-0" />
                  <span>Marketplace</span>
                </Link>

                <Link
                  href="/events"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors"
                >
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Cultural Events</span>
                </Link>

                <Link
                  href="/reels"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors"
                >
                  <Film className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Reels &amp; Video</span>
                </Link>

                <Link
                  href="/podcasts"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors"
                >
                  <Mic className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Podcasts</span>
                </Link>

                <Link
                  href="/live"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors"
                >
                  <Tv className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Live Broadcasts</span>
                </Link>

                <Link
                  href="/sounds"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors"
                >
                  <Music className="w-4 h-4 text-rose-300 shrink-0" />
                  <span>Sounds &amp; Stems</span>
                </Link>

                <Link
                  href="/map"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-colors"
                >
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Caribbean Map</span>
                </Link>
              </div>
            </div>

            {/* Creator & Account Section */}
            <div className="space-y-1.5 pt-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-brand-sandstone/50 px-2 py-1">
                Account &amp; Operations
              </p>

              <Link
                href="/creator-studio"
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-brand-goldenHour/15 to-transparent border border-brand-goldenHour/30 text-white text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-brand-goldenHour" />
                  <span>Creator Studio</span>
                </div>
                <span className="text-[10px] font-black uppercase text-brand-goldenHour">Studio</span>
              </Link>

              <Link
                href="/financial-center"
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Financial Center &amp; Wallet</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings &amp; Privacy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </Link>

              <Link
                href="/help"
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Help &amp; Learn Center</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </Link>
            </div>

            {/* Sign Out */}
            {user && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            <div className="h-safe-b pb-3" />
          </div>
        </div>
      )}

      {/* ── 3. Bottom 5-Tab Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#110D17]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl"
        aria-label="Main mobile navigation"
      >
        <ul className="flex items-center justify-around px-2 py-1.5" role="tablist">
          {/* Tab 1: Home */}
          <li role="presentation">
            <Link
              href="/"
              role="tab"
              aria-selected={isHomeActive}
              aria-label="Home"
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] justify-center ${
                isHomeActive
                  ? 'text-brand-caribbeanSea font-black'
                  : 'text-brand-sandstone/60 hover:text-slate-200 font-bold'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Home</span>
            </Link>
          </li>

          {/* Tab 2: Feeds */}
          <li role="presentation">
            <Link
              href="/feeds"
              role="tab"
              aria-selected={isFeedsActive}
              aria-label="Feeds"
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] justify-center ${
                isFeedsActive
                  ? 'text-brand-caribbeanSea font-black'
                  : 'text-brand-sandstone/60 hover:text-slate-200 font-bold'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[10px]">Feeds</span>
            </Link>
          </li>

          {/* Tab 3: Create (Floating Action Button) */}
          <li role="presentation">
            <button
              type="button"
              role="tab"
              aria-label="Create on TUKUBI"
              onClick={() => setIsCreateSheetOpen(true)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-2xl transition-all min-w-[44px] min-h-[44px] justify-center"
            >
              <span className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral flex items-center justify-center -mt-4 shadow-lg shadow-brand-caribbeanSea/40 border-2 border-[#110D17] text-slate-950 hover:scale-105 active:scale-95 transition-transform">
                <PlusCircle className="w-6 h-6 text-slate-950" />
              </span>
              <span className="text-[10px] font-black text-brand-caribbeanSea">Create</span>
            </button>
          </li>

          {/* Tab 4: Explore */}
          <li role="presentation">
            <Link
              href="/explore"
              role="tab"
              aria-selected={isExploreActive}
              aria-label="Explore Caribbean"
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] justify-center ${
                isExploreActive
                  ? 'text-brand-caribbeanSea font-black'
                  : 'text-brand-sandstone/60 hover:text-slate-200 font-bold'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[10px]">Explore</span>
            </Link>
          </li>

          {/* Tab 5: Menu */}
          <li role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={isMenuSheetOpen}
              aria-haspopup="dialog"
              aria-expanded={isMenuSheetOpen}
              aria-label="Ecosystem Menu"
              onClick={() => setIsMenuSheetOpen((prev) => !prev)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] justify-center ${
                isMenuSheetOpen
                  ? 'text-brand-caribbeanSea font-black'
                  : 'text-brand-sandstone/60 hover:text-slate-200 font-bold'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px]">Menu</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
