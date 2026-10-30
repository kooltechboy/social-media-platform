import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import './globals.css';

export const metadata: Metadata = {
  title: 'TUKUBI Creator Studio — Caribbean Diaspora Creator Platform',
  description: 'Manage your Caribbean content, audience analytics, media transcoding, and subscription revenue.',
  icons: {
    icon: '/brand/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#110D17] text-[#FDF2E9] antialiased">
        <header className="border-b border-[#2A1B38] bg-[#1D1429]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="inline-flex items-center gap-2.5">
                <Image
                  src="/brand/tukubi-symbol.svg"
                  alt="TUKUBI"
                  width={36}
                  height={36}
                  className="object-contain drop-shadow-[0_2px_8px_rgba(0,194,168,0.3)]"
                />
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl tracking-wider bg-gradient-to-r from-[#00C2A8] via-[#0EA5E9] to-[#F59E0B] bg-clip-text text-transparent">
                    TUKUBI
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 uppercase tracking-wide">
                    Creator Studio
                  </span>
                </div>
              </a>
            </div>

            <nav className="flex items-center gap-6 text-sm font-medium">
              <a href="/" className="text-white hover:text-[#00C2A8] transition-colors">
                Dashboard
              </a>
              <a href="/analytics" className="text-[#FDF2E9]/70 hover:text-[#00C2A8] transition-colors">
                Analytics
              </a>
              <a href="/vault" className="text-[#FDF2E9]/70 hover:text-[#00C2A8] transition-colors">
                Media Vault
              </a>
              <a href="/schedule" className="text-[#FDF2E9]/70 hover:text-[#00C2A8] transition-colors">
                Schedule
              </a>
              <a href="/monetization" className="text-[#FDF2E9]/70 hover:text-[#00C2A8] transition-colors">
                Monetization
              </a>
            </nav>


            <div className="flex items-center gap-3">
              <span className="text-xs text-[#00C2A8] bg-[#00C2A8]/10 border border-[#00C2A8]/30 px-2.5 py-1 rounded-full font-mono">
                Verified Creator
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C2A8] to-[#8B5CF6] ring-2 ring-[#00C2A8]/40" />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
