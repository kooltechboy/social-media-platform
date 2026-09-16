'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import AppHeader from './app-header';
import AppSidebar from './app-sidebar';
import MobileNav from './mobile-nav';
const GATEWAY_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/admin/bootstrap',
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isGateway = GATEWAY_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

  if (isGateway) {
    return (
      <div className="fixed inset-0 z-20 overflow-y-auto">
        {children}
      </div>
    );
  }

  const isPublicLanding = pathname === '/' && !user;
  const isMapRoute = pathname === '/map';

  if (isPublicLanding) {
    return (
      <div className="relative z-10 flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 w-full">{children}</main>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      <AppHeader />
      <div className="flex-1 w-full max-w-[2560px] 5xl:max-w-[2800px] mx-auto flex">
        {/* Left Navigation: Fixed 240-260px width, sticky on desktop with independent scroll */}
        <aside className="hidden md:block w-[240px] xl:w-[260px] shrink-0 sticky top-[58px] h-[calc(100vh-58px)] overflow-y-auto px-2.5 sm:px-3.5 py-6 scrollbar-none z-20">
          <AppSidebar />
        </aside>

        {/* Fluid Main Workspace & Experience Canvas */}
        <main
          className={`flex-1 min-w-0 ${
            isMapRoute
              ? 'p-0'
              : 'px-3.5 sm:px-6 lg:px-8 3xl:px-10 py-6'
          } pb-24 md:pb-6 min-h-[85vh]`}
        >
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
