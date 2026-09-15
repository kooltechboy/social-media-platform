import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TUKUBI Creator Studio — Caribbean Diaspora Creator Platform',
  description: 'Manage your Caribbean content, audience analytics, media transcoding, and subscription revenue.',
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF7A59] via-[#FFB347] to-[#8B5CF6] flex items-center justify-center font-black text-white shadow-lg shadow-[#FF7A59]/20">
                T
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-[#FF7A59] to-[#FFB347] bg-clip-text text-transparent">
                  TUKUBI
                </span>
                <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                  Creator Studio
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-6 text-sm font-medium">
              <a href="/" className="text-white hover:text-[#FF7A59] transition-colors">
                Dashboard
              </a>
              <a href="/analytics" className="text-[#FDF2E9]/70 hover:text-[#FF7A59] transition-colors">
                Analytics
              </a>
              <a href="/vault" className="text-[#FDF2E9]/70 hover:text-[#FF7A59] transition-colors">
                Media Vault
              </a>
              <a href="/schedule" className="text-[#FDF2E9]/70 hover:text-[#FF7A59] transition-colors">
                Schedule
              </a>
              <a href="/monetization" className="text-[#FDF2E9]/70 hover:text-[#FF7A59] transition-colors">
                Monetization
              </a>
            </nav>


            <div className="flex items-center gap-3">
              <span className="text-xs text-[#00B4D8] bg-[#00B4D8]/10 border border-[#00B4D8]/30 px-2.5 py-1 rounded-full font-mono">
                Verified Creator
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF7A59] to-[#8B5CF6] ring-2 ring-[#FF7A59]/40" />
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
