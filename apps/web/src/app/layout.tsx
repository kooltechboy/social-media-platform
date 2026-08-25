import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '../components/app-shell';
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

        {/* App shell with gateway page isolation */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
