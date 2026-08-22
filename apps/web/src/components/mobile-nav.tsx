'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, MessageSquare, User, Sparkles } from 'lucide-react';

interface MobileTab {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchExact?: boolean;
}

const TABS: MobileTab[] = [
  { href: '/', label: 'Home', icon: Home, matchExact: true },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/create', label: 'Create', icon: PlusCircle },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090D16]/95 backdrop-blur-md border-t border-slate-800 shadow-2xl"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around px-2 py-2" role="tablist">
        {TABS.map((tab) => {
          const isActive = tab.matchExact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          const Icon = tab.icon;
          const isCreate = tab.href === '/create';

          return (
            <li key={tab.href} role="presentation">
              <Link
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${
                  isCreate
                    ? 'text-slate-950'
                    : isActive
                    ? 'text-sky-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isCreate ? (
                  <span className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center -mt-5 shadow-lg shadow-sky-500/40 border-2 border-slate-950">
                    <Icon className="w-6 h-6 text-slate-950" />
                  </span>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span
                  className={`text-[10px] font-bold ${
                    isCreate ? 'text-sky-400 font-black' : ''
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
