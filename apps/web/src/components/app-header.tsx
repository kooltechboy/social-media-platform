import React from 'react';
import Link from 'next/link';
import { Search, Wallet, Bell, MessageSquare } from 'lucide-react';
import SessionWidget from './session-widget';

export default function AppHeader() {
  return (
    <header
      className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between"
      role="banner"
    >
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] rounded-md"
          aria-label="CARIBBEAN ONE — Home"
        >
          <span className="bg-gradient-to-r from-sky-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
            CARIBBEAN ONE
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/50">
            ECOSYSTEM
          </span>
        </Link>

        <form
          action="/search"
          role="search"
          aria-label="Ask Caribbean AI"
          className="relative hidden md:flex items-center w-80"
        >
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            name="q"
            placeholder="Ask Caribbean... (e.g. Events in Miami)"
            aria-label="Search the Caribbean ecosystem"
            className="w-full bg-slate-900 border border-slate-700/60 rounded-full pl-9 pr-4 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="/spotpay"
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-1.5 rounded-full border border-sky-500/30 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
          aria-label="SpotPay Wallet balance"
        >
          <Wallet className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>SpotPay Wallet</span>
        </a>

        <a
          href="/notifications"
          className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span
            className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"
            aria-label="New notifications available"
          />
        </a>

        <a
          href="/messages"
          className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
          aria-label="Messages"
        >
          <MessageSquare className="w-5 h-5" aria-hidden="true" />
        </a>

        <SessionWidget />
      </div>
    </header>
  );
}
