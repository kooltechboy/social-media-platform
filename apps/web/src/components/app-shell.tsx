'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AppHeader from './app-header';
import AppSidebar from './app-sidebar';
import MobileNav from './mobile-nav';
import { NewDeviceAlert } from './gateway/NewDeviceAlert';

const GATEWAY_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGateway = GATEWAY_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

  if (isGateway) {
    return (
      <div className="fixed inset-0 z-20 overflow-y-auto bg-[#060A13]">
        {children}
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      <AppHeader />
      <div className="flex-1 w-full max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 px-3 sm:px-6 lg:px-10 py-6 pb-24 md:pb-6">
        <aside className="hidden md:block md:col-span-3 xl:col-span-2">
          <AppSidebar />
        </aside>
        <main className="col-span-1 md:col-span-9 xl:col-span-10 min-h-[80vh]">
          {children}
        </main>
      </div>
      <MobileNav />
      <NewDeviceAlert />
    </div>
  );
}
