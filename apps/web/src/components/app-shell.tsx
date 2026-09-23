'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import AppHeader from './app-header';
import AppSidebar from './app-sidebar';
import MobileNav from './mobile-nav';
import OperatingIdentityBanner from './operating-identity-banner';
import { SidebarProvider, useSidebar } from './sidebar-context';
import { KeyboardShortcutsProvider } from './keyboard-shortcuts-provider';

const GATEWAY_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/admin/bootstrap',
  '/embed',
];

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
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
        <main className="flex-1 w-full pb-20 md:pb-0">{children}</main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      <OperatingIdentityBanner />
      <AppHeader />
      <div className="flex-1 w-full max-w-[2560px] 5xl:max-w-[2800px] mx-auto flex">
        {/* Left Navigation: Responsive 240-260px expanded, 72px compact rail when collapsed */}
        <aside
          className={`hidden md:block shrink-0 sticky top-[58px] h-[calc(100vh-58px)] overflow-y-auto px-2 sm:px-3 py-6 scrollbar-none z-20 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-[72px]' : 'w-[240px] xl:w-[260px]'
          }`}
          aria-label="Desktop primary navigation"
        >
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

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <KeyboardShortcutsProvider>
        <AppShellContent>{children}</AppShellContent>
      </KeyboardShortcutsProvider>
    </SidebarProvider>
  );
}
