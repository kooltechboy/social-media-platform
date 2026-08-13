import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CARIBBEAN ONE — Caribbean Digital Ecosystem & Diaspora Platform',
  description: "The world's premier digital community for Caribbean people, Caribbean culture, Caribbean businesses, and the Caribbean diaspora.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090D16] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
