'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { SessionUser } from '../lib/supabase/server';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';
import { signOutAction } from '../lib/auth/actions';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(!initialUser);

  const fetchCurrentProfile = useCallback(async (authUserId: string, authEmail?: string, userMeta?: any) => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, is_official, is_verified')
        .eq('id', authUserId)
        .maybeSingle();

      const username = profile?.username || userMeta?.username || authEmail?.split('@')[0] || 'member';
      const displayName = profile?.display_name || userMeta?.display_name || authEmail || 'Member';
      const avatarUrl = profile?.avatar_url || userMeta?.avatar_url || undefined;
      const isOfficial = profile?.is_official ?? false;
      const isVerified = profile?.is_verified ?? false;

      return {
        id: authUserId,
        email: authEmail || '',
        username,
        displayName,
        avatarUrl,
        isOfficial,
        isVerified,
      };
    } catch {
      return {
        id: authUserId,
        email: authEmail || '',
        username: userMeta?.username || authEmail?.split('@')[0] || 'member',
        displayName: userMeta?.display_name || authEmail || 'Member',
      };
    }
  }, []);

  const refresh = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const sessionUser = await fetchCurrentProfile(
        session.user.id,
        session.user.email,
        session.user.user_metadata
      );
      setUser(sessionUser);
    } catch {
      // Keep existing user if network fails
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentProfile]);

  useEffect(() => {
    let ignore = false;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Set up active auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        if (!ignore) {
          setUser(null);
          setLoading(false);
        }
      } else if (session?.user) {
        const sessionUser = await fetchCurrentProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata
        );
        if (!ignore) {
          setUser(sessionUser);
          setLoading(false);
        }
      }
    });

    // If initialUser was not supplied by SSR, perform immediate client session check
    if (!initialUser) {
      void refresh();
    } else {
      setLoading(false);
    }

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [initialUser, fetchCurrentProfile, refresh]);

  const signOut = useCallback(async () => {
    setUser(null);
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    await signOutAction();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
