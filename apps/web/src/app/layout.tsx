import type { Metadata } from 'next';
import './globals.css';
import AppHeader from '../components/app-header';
import AppSidebar from '../components/app-sidebar';
import MobileNav from '../components/mobile-nav';

export const metadata: Metadata = {
  title: 'CARIBBEAN ONE — Caribbean Digital Ecosystem & Diaspora Platform',
  description:
    "The world's premier digital community for Caribbean people, Caribbean culture, Caribbean businesses, and the Caribbean diaspora.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#090D16] text-slate-100 antialiased min-h-screen" suppressHydrationWarning>
        <AppHeader />
        <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 p-4 pb-20 md:pb-4">
          <AppSidebar />
          <main className="col-span-1 md:col-span-3 min-h-screen">
            {children}
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
