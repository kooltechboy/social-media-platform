'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { useAuth } from './auth-provider';
import { usePathname } from 'next/navigation';

interface NotificationsContextValue {
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsRealtimeProvider({
  children,
  initialUnreadCount,
}: {
  children: React.ReactNode;
  initialUnreadCount: number;
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // Reset to initial count on mount and when it changes from server
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    if (pathname === '/notifications') {
      setUnreadCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    if (!user) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`public:notifications:recipient_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          if (pathname !== '/notifications') {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pathname]);

  return (
    <NotificationsContext.Provider value={{ unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useUnreadNotificationsCount() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useUnreadNotificationsCount must be used within a NotificationsRealtimeProvider');
  }
  return context.unreadCount;
}
