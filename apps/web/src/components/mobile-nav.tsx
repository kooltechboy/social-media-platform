'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, MessageSquare, User } from 'lucide-react';

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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800"
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
              <a
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] ${
                  isCreate
                    ? 'text-slate-950'
                    : isActive
                      ? 'text-sky-400'
                      : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isCreate ? (
                  <span className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center -mt-4 shadow-lg shadow-sky-500/30">
                    <Icon className="w-5 h-5 text-slate-950" />
                  </span>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span
                  className={`text-[10px] font-semibold ${
                    isCreate ? 'text-sky-400' : ''
                  }`}
                >
                  {tab.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
