import type { Metadata } from 'next';
import './globals.css';
import AppHeader from '../components/app-header';
import AppSidebar from '../components/app-sidebar';
import MobileNav from '../components/mobile-nav';
import CaribbeanSunsetBackground from '../components/caribbean-sunset-background';

export const metadata: Metadata = {
  title: 'CARIBBEAN ONE — Caribbean Digital Ecosystem & Diaspora Platform',
  description:
    "The world's premier digital platform for Caribbean people, culture, businesses, creators, and the global diaspora.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#0B132B] text-slate-100 antialiased min-h-screen relative overflow-x-hidden" suppressHydrationWarning>
        {/* High Definition Caribbean Beach Sunset Atmosphere */}
        <CaribbeanSunsetBackground />

        {/* Main Application Shell */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <AppHeader />
          <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 p-4 pb-24 md:pb-6">
            <AppSidebar />
            <main className="col-span-1 md:col-span-3 min-h-screen">
              {children}
            </main>
          </div>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}


