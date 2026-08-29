import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '../components/app-shell';
import CaribbeanSunsetBackground from '../components/caribbean-sunset-background';
import { AuthProvider } from '../components/auth-provider';
import { getCurrentUser } from '../lib/supabase/server';

export const metadata: Metadata = {
  title: 'TUKUBI — The Caribbean Connected.',
  description:
    'The premier platform for Caribbean culture, community, creators, businesses, and the global diaspora. The Caribbean Connected.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0612',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen relative overflow-x-hidden antialiased text-white selection:bg-[#FF7A59]/30 selection:text-white"
        suppressHydrationWarning
      >
        {/* Full-screen Caribbean background — always fills the entire viewport */}
        <CaribbeanSunsetBackground />

        {/* Global Auth Provider seeded with server-side authenticated user */}
        <AuthProvider initialUser={user}>
          {/* App shell with gateway page isolation */}
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
