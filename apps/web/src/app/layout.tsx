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
  themeColor: '#0a0612',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen relative overflow-x-hidden antialiased text-white selection:bg-[#FF7A59]/30 selection:text-white"
        suppressHydrationWarning
      >
        {/* Full-screen Caribbean background — always fills the entire viewport */}
        <CaribbeanSunsetBackground />

        {/* App shell sits on top — full width, no box, no border */}
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
        </div>
      </body>
    </html>
  );
}
