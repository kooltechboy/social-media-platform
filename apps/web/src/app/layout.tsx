import type { Metadata } from 'next';
import './globals.css';
import AppHeader from '../components/app-header';
import AppSidebar from '../components/app-sidebar';
import MobileNav from '../components/mobile-nav';

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
      <body className="bg-[#070B12] text-slate-100 antialiased min-h-screen relative overflow-x-hidden" suppressHydrationWarning>
        {/* Layer 1 & 2: Atmospheric Ambient Ocean & Emerald Glows */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sky-500/10 blur-[120px]" />
          <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[130px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-amber-500/05 blur-[140px]" />
        </div>

        {/* Main Application Container */}
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

