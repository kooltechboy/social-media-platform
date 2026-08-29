import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TUKUBI — Moderation Center',
  description: 'Human-in-the-loop content moderation console for TUKUBI platform trust & safety.',
};

export default function ModerationRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#090D16] text-brand-sandstone antialiased min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
