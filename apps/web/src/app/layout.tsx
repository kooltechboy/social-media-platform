import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import AppShell from '../components/app-shell';
import CaribbeanSunsetBackground from '../components/caribbean-sunset-background';
import { AuthProvider } from '../components/auth-provider';
import { getCurrentUser } from '../lib/supabase/server';
import {
  I18nProvider,
  Locale,
  isLocale,
  DEFAULT_LOCALE,
  LOCALE_DETAILS,
} from '@caribbean/localization';

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
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const cookieLocale = cookieStore.get('tukubi_locale')?.value;
  const userLocale = (user as any)?.language_preference;
  const rawLocale = userLocale || cookieLocale || DEFAULT_LOCALE;
  const activeLocale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dir = LOCALE_DETAILS[activeLocale]?.dir || 'ltr';

  return (
    <html lang={activeLocale} dir={dir} className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen relative overflow-x-hidden antialiased text-white selection:bg-[#FF7A59]/30 selection:text-white"
        suppressHydrationWarning
      >
        {/* Full-screen Caribbean background — always fills the entire viewport */}
        <CaribbeanSunsetBackground />

        {/* Global Localization & Auth Providers */}
        <I18nProvider initialLocale={activeLocale}>
          <AuthProvider initialUser={user}>
            {/* App shell with gateway page isolation */}
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
