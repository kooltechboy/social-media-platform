'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, MessageSquare, User, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from './auth-provider';
import UserAvatar from './user-avatar';

import { useTranslation, TranslationKey } from '@caribbean/localization';

interface MobileTab {
  href: string;
  labelKey: TranslationKey;
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
  const { user, signOut, loading } = useAuth();
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close profile sheet on outside tap or route change
  useEffect(() => {
    setIsProfileSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isProfileSheetOpen) return;
    function handleOutsideTap(e: TouchEvent | MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setIsProfileSheetOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideTap);
    document.addEventListener('touchstart', handleOutsideTap);
    return () => {
      document.removeEventListener('mousedown', handleOutsideTap);
      document.removeEventListener('touchstart', handleOutsideTap);
    };
  }, [isProfileSheetOpen]);

  const handleSignOut = async () => {
    setIsProfileSheetOpen(false);
    await signOut();
  };

  const isProfileActive = pathname === '/profile' || pathname.startsWith('/profile/');

  return (
    <>
      {/* ── Profile Bottom Sheet ── */}
      {isProfileSheetOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end"
          role="dialog"
          aria-modal="true"
          aria-label="Profile menu"
        >
          <div
            ref={sheetRef}
            className="w-full bg-[#0C1322] border-t border-slate-800 rounded-t-3xl p-5 space-y-3 shadow-2xl animate-slideUp"
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
                    {user?.displayName || 'Member'}
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
                className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-px bg-slate-800" />

            {/* Profile & Settings links */}
            <Link
              href="/profile"
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-white text-sm font-bold transition-colors min-h-[44px]"
              onClick={() => setIsProfileSheetOpen(false)}
            >
              <User className="w-5 h-5 text-brand-caribbeanSea flex-shrink-0" />
              <span>View Profile</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-white text-sm font-bold transition-colors min-h-[44px]"
              onClick={() => setIsProfileSheetOpen(false)}
            >
              <Settings className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span>Settings</span>
            </Link>

            <div className="h-px bg-slate-800" />

            {/* Sign Out — prominent, accessible, 44px+ touch target */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-sm font-bold transition-colors min-h-[44px] active:scale-[0.98]"
              aria-label="Sign out of your TUKUBI account"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Sign Out</span>
            </button>

            {/* Safe area spacer for home indicator */}
            <div className="h-safe-b pb-2" />
          </div>
        </div>
      )}

      {/* ── Bottom Tab Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090D16]/95 backdrop-blur-md border-t border-slate-800 shadow-2xl"
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
                <Link
                  href={tab.href}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tabLabel}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] justify-center ${
                    isCreate
                      ? 'text-slate-950'
                      : isActive
                      ? 'text-brand-caribbeanSea font-bold'
                      : 'text-brand-sandstone/60 hover:text-slate-200'
                  }`}
                >
                  {isCreate ? (
                    <span className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-caribbeanSea to-brand-sunriseCoral flex items-center justify-center -mt-5 shadow-lg shadow-brand-caribbeanSea/40 border-2 border-slate-950">
                      <Icon className="w-6 h-6 text-slate-950" />
                    </span>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <span
                    className={`text-[10px] font-bold ${
                      isCreate ? 'text-brand-caribbeanSea font-black' : ''
                    }`}
                  >
                    {tabLabel}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Profile tab — triggers bottom sheet with logout */}
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
                <span className={`w-5 h-5 rounded-full overflow-hidden ring-2 ${isProfileSheetOpen ? 'ring-brand-caribbeanSea' : 'ring-transparent'}`}>
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
