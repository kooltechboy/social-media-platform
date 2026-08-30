'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, MessageSquare, User, Sparkles } from 'lucide-react';

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
  { href: '/profile', labelKey: 'nav.profile', fallbackLabel: 'Profile', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090D16]/95 backdrop-blur-md border-t border-slate-800 shadow-2xl"
      aria-label={t('a11y.open_menu')}
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
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${
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
      </ul>
    </nav>
  );
}
