'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Plus,
  PlusCircle,
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
  Settings,
  LogOut,
  X,
  Sparkles,
  HelpCircle,
  MapPin,
  ChevronRight,
  ShieldCheck,
  FileText,
  Zap,
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

  const isHomeActive = pathname === '/' || pathname === '/home' || pathname === '/feeds' || pathname.startsWith('/feeds/');
  const isShortsActive = pathname === '/shorts' || pathname.startsWith('/shorts/') || pathname === '/reels' || pathname.startsWith('/reels/');
  const isExploreActive = pathname === '/explore' || pathname.startsWith('/explore/');
  const isMessagesActive = pathname === '/messages' || pathname.startsWith('/messages/');
  const isProfileActive = Boolean(pathname.startsWith('/profile') || (user && pathname === `/profile/${user.username}`));

  // Listen for global ecosystem menu trigger (e.g. from mobile header or profile actions)
  useEffect(() => {
    function handleOpenMenu() {
      setIsMenuSheetOpen(true);
    }
    window.addEventListener('tukubi:open-ecosystem-menu', handleOpenMenu);
    return () => {
      window.removeEventListener('tukubi:open-ecosystem-menu', handleOpenMenu);
    };
  }, []);

  // Core mobile navigation tabs
  const MOBILE_TABS: MobileTab[] = [
    { href: '/', labelKey: 'nav.home', fallbackLabel: 'Home', icon: Home },
    { href: '/explore', labelKey: 'nav.explore', fallbackLabel: 'Explore', icon: Compass },
    { href: '/create', fallbackLabel: 'Create', icon: PlusCircle, isAction: true },
    { href: '/messages', labelKey: 'nav.messages', fallbackLabel: 'Messages', icon: MessageSquare },
    { href: user ? `/profile/${user.username}` : '/login', labelKey: 'nav.profile', fallbackLabel: 'Profile', icon: User },
  ];

  // Indicator condition for message touchpoints:
  const hasUnreadMessagesTab = MOBILE_TABS.some((tab) => tab.href === '/messages' && unreadMessagesCount > 0);

  return (
    <>
      {/* ── 1. Create Quick Actions Bottom Sheet (Midnight Reef) ── */}
      {isCreateSheetOpen && (
        <div
          className="fixed inset-0 z-[60] bg-[#040914]/82 backdrop-blur-md flex items-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Create on TUKUBI"
        >
          <div
            ref={createSheetRef}
            className="w-full bg-[#0D1628]/98 backdrop-blur-2xl border-t border-white/[0.12] rounded-t-3xl px-5 pt-3 pb-5 space-y-4 shadow-2xl animate-slideUp max-h-[85vh] overflow-y-auto"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" aria-hidden="true" />

            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00C2A8] to-[#0EA5E9] flex items-center justify-center text-[#041019] shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-display text-[15px] font-bold text-[#F8FAFC]">Create on TUKUBI</p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Publish across the Caribbean and global diaspora
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSheetOpen(false)}
                aria-label="Close creation menu"
                className="w-9 h-9 rounded-xl bg-[#15213A] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-0.5">
              <Link
                href="/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#00C2A8] bg-[#00C2A8]/12 border-[#00C2A8]/25">
                  <FileText className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Post</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">Story &amp; Photo</span>
              </Link>

              <Link
                href="/shorts?create=true"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#0EA5E9] bg-[#0EA5E9]/12 border-[#0EA5E9]/25">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Shorts</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">Short Video</span>
              </Link>

              <Link
                href="/reels"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#8B5CF6] bg-[#8B5CF6]/12 border-[#8B5CF6]/25">
                  <Film className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Reel</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">9:16 Video</span>
              </Link>

              <Link
                href="/live"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-rose-400 bg-rose-500/12 border-rose-500/25">
                  <Radio className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Go Live</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">Broadcast</span>
              </Link>

              <Link
                href="/events"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#F59E0B] bg-[#F59E0B]/12 border-[#F59E0B]/25">
                  <Calendar className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Event</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">Cultural Fete</span>
              </Link>

              <Link
                href="/marketplace/seller-center/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#F59E0B] bg-[#F59E0B]/12 border-[#F59E0B]/25">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Market</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">Sell Product</span>
              </Link>

              <Link
                href="/communities/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#00C2A8] bg-[#00C2A8]/12 border-[#00C2A8]/25">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Community</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">Diaspora Hub</span>
              </Link>

              <Link
                href="/pages/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#0EA5E9] bg-[#0EA5E9]/12 border-[#0EA5E9]/25">
                  <Building2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Page</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">Brand &amp; Org</span>
              </Link>

              <Link
                href="/podcasts"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#8B5CF6] bg-[#8B5CF6]/12 border-[#8B5CF6]/25">
                  <Mic className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Podcast</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">Audio Show</span>
              </Link>

              <Link
                href="/sounds"
                onClick={() => setIsCreateSheetOpen(false)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-center min-h-[88px] transition-colors gap-1.5"
              >
                <span className="w-9 h-9 rounded-xl border flex items-center justify-center text-[#00C2A8] bg-[#00C2A8]/12 border-[#00C2A8]/25">
                  <Music className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC] leading-tight">Sound</span>
                <span className="text-[10px] text-[#94A3B8] leading-tight">Rhythm Track</span>
              </Link>
            </div>

            <div className="pt-1 pb-1 text-center">
              <Link
                href="/create"
                onClick={() => setIsCreateSheetOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#00C2A8] hover:text-[#0EA5E9] transition-colors"
              >
                Open Full Universal Create Studio →
              </Link>
            </div>
            <div className="h-safe-b pb-1" />
          </div>
        </div>
      )}

      {/* ── 2. Full Platform Menu Sheet (Midnight Reef) ── */}
      {isMenuSheetOpen && (
        <div
          className="fixed inset-0 z-[60] bg-[#040914]/82 backdrop-blur-md flex items-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Ecosystem Menu"
        >
          <div
            ref={menuSheetRef}
            className="w-full bg-[#0D1628]/98 backdrop-blur-2xl border-t border-white/[0.12] rounded-t-3xl px-5 pt-3 pb-5 space-y-4 shadow-2xl animate-slideUp max-h-[88vh] overflow-y-auto"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" aria-hidden="true" />

            {/* User Profile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
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
                  <p className="font-display text-sm font-bold text-[#F8FAFC] truncate">
                    {user?.displayName || 'Sign in to TUKUBI'}
                  </p>
                  <p className="text-xs text-[#94A3B8] truncate">
                    {user ? `@${user.username}` : 'The Caribbean Connected.'}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuSheetOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 rounded-xl bg-[#15213A] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Operating Identity Switcher */}
            <div className="py-0.5">
              <IdentitySwitcher variant="compact" />
            </div>

            {/* Platform Navigation Links */}
            <div className="space-y-1.5 pt-0.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B] px-1.5">
                Platform Destinations
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/pages"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <Building2 className="w-4 h-4 text-[#0EA5E9] shrink-0" />
                  <span>Pages</span>
                </Link>

                <Link
                  href="/pages?tab=my-pages"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>My Pages</span>
                </Link>

                <Link
                  href="/communities"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <Users className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>Communities</span>
                </Link>

                <Link
                  href="/marketplace"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>Marketplace</span>
                </Link>

                <Link
                  href="/events"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <Calendar className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>Cultural Events</span>
                </Link>

                <Link
                  href="/reels"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <Film className="w-4 h-4 text-[#0EA5E9] shrink-0" />
                  <span>Reels &amp; Video</span>
                </Link>

                <Link
                  href="/podcasts"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <Mic className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <span>Podcasts</span>
                </Link>

                <Link
                  href="/live"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <Tv className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Live Broadcasts</span>
                </Link>

                <Link
                  href="/sounds"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <Music className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <span>Sounds &amp; Stems</span>
                </Link>

                <Link
                  href="/map"
                  onClick={() => setIsMenuSheetOpen(false)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#E8EDF5] text-xs font-semibold transition-colors"
                >
                  <MapPin className="w-4 h-4 text-[#00C2A8] shrink-0" />
                  <span>Caribbean Map</span>
                </Link>
              </div>
            </div>

            {/* Creator & Account Section */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B] px-1.5">
                Account &amp; Operations
              </p>

              <Link
                href="/messages"
                aria-label="Messages"
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#00C2A8]/10 hover:bg-[#00C2A8]/15 border border-[#00C2A8]/25 text-[#F8FAFC] text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-[#00C2A8]" />
                  <span>Messages &amp; Direct Chat</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUnreadMessagesTab && (
                    <span className="px-2 py-0.5 rounded-full bg-[#00C2A8] text-[#041019] text-[10px] font-bold">
                      {unreadMessagesCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#64748B]" />
                </div>
              </Link>

              <Link
                href="/creator-studio"
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#F8FAFC] text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Creator Studio</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6]">Studio</span>
              </Link>

              <Link
                href="/financial-center"
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0B1B3B] hover:bg-[#11244D] border border-white/[0.08] text-[#F8FAFC] text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-[#F59E0B]" />
                  <span>Financial Center &amp; Wallet</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#F8FAFC] text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-[#94A3B8]" />
                  <span>Settings &amp; Privacy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </Link>

              <Link
                href="/help"
                onClick={() => setIsMenuSheetOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#111C33]/90 hover:bg-[#162440] border border-white/[0.07] text-[#F8FAFC] text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[#0EA5E9]" />
                  <span>Help &amp; Learn Center</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </Link>
            </div>

            {/* Sign Out */}
            {user && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/18 border border-rose-500/25 text-rose-400 text-xs font-semibold transition-colors min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            <div className="h-safe-b pb-2" />
          </div>
        </div>
      )}

      {/* ── 3. Sleek Flush-Integrated Mobile Bottom Tab Bar (Midnight Reef) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070D1A]/94 backdrop-blur-2xl border-t border-white/[0.08] pb-[max(0.35rem,env(safe-area-inset-bottom))]"
        aria-label="Main mobile navigation"
      >
        <ul className="flex items-center justify-around px-1.5 py-1" role="tablist">
          {/* Tab 1: Home */}
          <li role="presentation">
            <Link
              href="/"
              role="tab"
              aria-selected={isHomeActive}
              aria-label="Home"
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${
                isHomeActive
                  ? 'text-[#00C2A8] font-semibold'
                  : 'text-[#94A3B8] hover:text-white font-medium'
              }`}
            >
              <Home className="w-[20px] h-[20px]" />
              <span className="text-[10px] leading-none">Home</span>
            </Link>
          </li>

          {/* Tab 2: Shorts */}
          <li role="presentation">
            <Link
              href="/shorts"
              role="tab"
              aria-selected={isShortsActive}
              aria-label="TUKUBI Shorts"
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${
                isShortsActive
                  ? 'text-[#00C2A8] font-semibold'
                  : 'text-[#94A3B8] hover:text-white font-medium'
              }`}
            >
              <Film className="w-[20px] h-[20px]" />
              <span className="text-[10px] leading-none">Shorts</span>
            </Link>
          </li>

          {/* Tab 3: Create (Flush-Integrated Teal → Ocean Pill Action) */}
          <li role="presentation">
            <button
              type="button"
              role="tab"
              aria-label="Create on TUKUBI"
              onClick={() => setIsCreateSheetOpen(true)}
              className="flex items-center justify-center px-1.5 py-1 min-w-[44px] min-h-[44px]"
            >
              <span className="w-11 h-8 rounded-xl bg-gradient-to-tr from-[#00C2A8] to-[#0EA5E9] flex items-center justify-center shadow-[0_2px_12px_rgba(0,194,168,0.28)] text-[#041019] active:scale-95 transition-transform">
                <Plus className="w-5 h-5 stroke-[2.6]" />
              </span>
            </button>
          </li>

          {/* Tab 4: Explore */}
          <li role="presentation">
            <Link
              href="/explore"
              role="tab"
              aria-selected={isExploreActive}
              aria-label="Explore Caribbean"
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${
                isExploreActive
                  ? 'text-[#00C2A8] font-semibold'
                  : 'text-[#94A3B8] hover:text-white font-medium'
              }`}
            >
              <Compass className="w-[20px] h-[20px]" />
              <span className="text-[10px] leading-none">Explore</span>
            </Link>
          </li>

          {/* Tab 5: Messages */}
          <li role="presentation">
            <Link
              href="/messages"
              role="tab"
              aria-selected={isMessagesActive}
              aria-label="Messages"
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${
                isMessagesActive
                  ? 'text-[#00C2A8] font-semibold'
                  : 'text-[#94A3B8] hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-[20px] h-[20px]" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[16px] h-4 rounded-full bg-[#00C2A8] text-[#041019] font-bold text-[9px] flex items-center justify-center">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-none">Messages</span>
            </Link>
          </li>

          {/* Tab 6: Profile */}
          <li role="presentation">
            <Link
              href={user ? `/profile/${user.username}` : '/login'}
              role="tab"
              aria-selected={isProfileActive}
              aria-label="Profile"
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${
                isProfileActive
                  ? 'text-[#00C2A8] font-semibold'
                  : 'text-[#94A3B8] hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                {user?.avatarUrl ? (
                  <UserAvatar
                    src={user.avatarUrl}
                    name={user.displayName || user.username}
                    size="xs"
                  />
                ) : (
                  <User className="w-[20px] h-[20px]" />
                )}
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#00C2A8] rounded-full ring-2 ring-[#070D1A]" />
                )}
              </div>
              <span className="text-[10px] leading-none">Profile</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
