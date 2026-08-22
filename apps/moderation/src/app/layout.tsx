import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Caribbean One — Moderation Center',
  description: 'Human-in-the-loop content moderation console for Caribbean One platform trust & safety.',
};

export default function ModerationRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090D16] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
