'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { useAuth } from './auth-provider';
import { usePathname } from 'next/navigation';

interface NotificationsContextValue {
  unreadCount: number;
  unreadMessagesCount: number;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsRealtimeProvider({
  children,
  initialUnreadCount,
  initialUnreadMessagesCount = 0,
}: {
  children: React.ReactNode;
  initialUnreadCount: number;
  initialUnreadMessagesCount?: number;
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(initialUnreadMessagesCount);
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    setUnreadMessagesCount(initialUnreadMessagesCount);
  }, [initialUnreadMessagesCount]);

  useEffect(() => {
    if (pathname === '/notifications') {
      setUnreadCount(0);
    }
    if (pathname?.startsWith('/messages')) {
      setUnreadMessagesCount(0);
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
        (payload: { new?: { kind?: string } }) => {
          if (pathname !== '/notifications') {
            setUnreadCount((prev) => prev + 1);
          }
          if (payload.new?.kind === 'message' && !pathname?.startsWith('/messages')) {
            setUnreadMessagesCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pathname]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, unreadMessagesCount }}>
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

export function useUnreadMessagesCount() {
  const context = useContext(NotificationsContext);
  if (!context) {
    return 0;
  }
  return context.unreadMessagesCount;
}

