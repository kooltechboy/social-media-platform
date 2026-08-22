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
      <body className="caribbean-gradient-bg text-slate-100 antialiased min-h-screen relative overflow-x-hidden" suppressHydrationWarning>
        {/* Caribbean Multi-Layered Radiant Atmosphere */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Azure Ocean Water Glow top right */}
          <div className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-sky-500/25 via-cyan-500/15 to-transparent blur-[110px] animate-pulse-glow" />
          {/* Emerald Island Bloom mid left */}
          <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-transparent blur-[120px] animate-pulse-glow" />
          {/* Coral Sunset Glow bottom right */}
          <div className="absolute bottom-10 -right-20 w-[450px] h-[450px] rounded-full bg-gradient-to-tl from-amber-500/15 via-rose-500/10 to-transparent blur-[130px]" />
          {/* Fine Caribbean Water Ripple Texture Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />
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


