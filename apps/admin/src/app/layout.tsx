import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Caribbean One — Admin Console',
  description: 'Internal administration console for Caribbean One platform operators.',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090D16] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
