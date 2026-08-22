import React from 'react';
import {
  Home,
  Compass,
  Video,
  Tv,
  Mic,
  Users,
  Wallet,
  Calendar,
  ShoppingBag,
  MessageSquare,
  Bell,
  User,
  Sparkles,
  Settings,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
  { href: '/explore', label: 'Explore & Diaspora', icon: <Compass className="w-4 h-4" /> },
  { href: '/reels', label: 'Reels & Shorts', icon: <Video className="w-4 h-4" /> },
  { href: '/live', label: 'Live Streams', icon: <Tv className="w-4 h-4" /> },
  { href: '/podcasts', label: 'Caribbean Podcasts', icon: <Mic className="w-4 h-4" /> },
  { href: '/communities', label: 'Communities', icon: <Users className="w-4 h-4" /> },
  { href: '/spotpay', label: 'SpotPay Wallet', icon: <Wallet className="w-4 h-4 text-emerald-400" /> },
  { href: '/events', label: 'Cultural Events', icon: <Calendar className="w-4 h-4" /> },
  { href: '/marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-4 h-4" /> },
  { href: '/messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  { href: '/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { href: '/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { href: '/creator-studio', label: 'Creator Studio', icon: <Sparkles className="w-4 h-4" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

interface AppSidebarProps {
  currentPath?: string;
}

export default function AppSidebar({ currentPath = '/' }: AppSidebarProps) {
  return (
    <aside className="hidden md:block col-span-1 space-y-6" aria-label="Primary navigation">
      <nav className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                isActive
                  ? 'bg-sky-600/20 text-sky-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800/80 rounded-2xl p-4 text-center">
        <h4 className="text-sm font-bold text-white mb-1">Are you a Creator or Business?</h4>
        <p className="text-xs text-slate-400 mb-3">
          Host podcasts, stream live, accept SpotPay, and reach 59M+ Caribbean people worldwide.
        </p>
        <a
          href="/creator-studio"
          className="w-full block bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          Open Creator Studio
        </a>
      </div>
    </aside>
  );
}
