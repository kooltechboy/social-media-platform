import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TUKUBI — Admin Console',
  description: 'Internal administration console for TUKUBI platform operators.',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#090D16] text-brand-sandstone antialiased min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
