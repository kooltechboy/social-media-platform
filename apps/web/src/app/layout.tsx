import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppHeader from '../components/app-header';
import AppSidebar from '../components/app-sidebar';
import MobileNav from '../components/mobile-nav';
import CaribbeanSunsetBackground from '../components/caribbean-sunset-background';

export const metadata: Metadata = {
  title: 'ANTILIA - Caribbean Digital Ecosystem & Diaspora Platform',
  description:
    "The world's premier digital platform for Caribbean people, culture, businesses, creators, and the global diaspora.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#110D17',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#0a070f] text-brand-sandstone antialiased min-h-screen relative overflow-x-hidden selection:bg-brand-sunriseCoral/30" suppressHydrationWarning>
        {/* High Definition Caribbean Atmosphere */}
        <CaribbeanSunsetBackground />

        {/* Main Application Shell - Premium Spatial UI */}
        <div className="relative z-10 flex flex-col min-h-screen pt-0 sm:pt-4 md:pt-6 pb-24 md:pb-6 px-0 sm:px-4 md:px-8 lg:px-12 max-w-[1920px] mx-auto w-full">
          {/* Glassmorphism Container */}
          <div className="flex flex-col flex-1 bg-brand-twilight/65 backdrop-blur-[50px] border-x border-b sm:border border-white/10 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] rounded-none sm:rounded-[2.5rem] overflow-hidden">
            <AppHeader />
            <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 p-4 sm:p-6 lg:p-10">
              <div className="md:col-span-3 xl:col-span-3 hidden md:block">
                <AppSidebar />
              </div>
              <main className="md:col-span-9 xl:col-span-9 min-h-[75vh]">
                {children}
              </main>
            </div>
          </div>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
