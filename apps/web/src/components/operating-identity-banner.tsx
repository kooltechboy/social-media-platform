'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Building2, Users, ArrowRight, UserCheck, X } from 'lucide-react';
import { useAuth } from './auth-provider';

interface ActiveIdentityState {
  id: string;
  type: 'personal' | 'creator' | 'business' | 'community';
  name: string;
  handle: string;
  badge?: string;
}

export default function OperatingIdentityBanner() {
  const router = useRouter();
  const { user } = useAuth();
  const [identity, setIdentity] = useState<ActiveIdentityState | null>(null);

  useEffect(() => {
    if (!user) {
      setIdentity(null);
      return;
    }

    function checkActiveIdentity() {
      if (typeof window === 'undefined') return;
      const type = localStorage.getItem('tukubi_active_identity_type') as ActiveIdentityState['type'] | null;
      const id = localStorage.getItem('tukubi_active_identity_id');

      if (id && type && type !== 'personal') {
        setIdentity({
          id,
          type,
          name: localStorage.getItem('tukubi_active_identity_name') || 'Managed Entity',
          handle: localStorage.getItem('tukubi_active_identity_handle') || 'entity',
        });
      } else {
        setIdentity(null);
      }
    }

    checkActiveIdentity();

    function handleSwitch(e: any) {
      const detail = e.detail;
      if (detail && detail.type && detail.type !== 'personal') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('tukubi_active_identity_name', detail.name || '');
          localStorage.setItem('tukubi_active_identity_handle', detail.handle || '');
        }
        setIdentity({
          id: detail.id,
          type: detail.type,
          name: detail.name,
          handle: detail.handle,
          badge: detail.badge,
        });
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tukubi_active_identity_name');
          localStorage.removeItem('tukubi_active_identity_handle');
        }
        setIdentity(null);
      }
    }

    window.addEventListener('tukubi_identity_switched', handleSwitch);
    return () => window.removeEventListener('tukubi_identity_switched', handleSwitch);
  }, [user]);

  if (!user || !identity || identity.type === 'personal') {
    return null;
  }

  const handleRevertToPersonal = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tukubi_active_identity_id');
      localStorage.removeItem('tukubi_active_identity_type');
      localStorage.removeItem('tukubi_active_identity_name');
      localStorage.removeItem('tukubi_active_identity_handle');
      window.dispatchEvent(
        new CustomEvent('tukubi_identity_switched', {
          detail: {
            id: user.id,
            type: 'personal',
            name: user.displayName || `@${user.username}`,
            handle: user.username,
            badge: 'Personal',
          },
        })
      );
    }
    setIdentity(null);
    router.refresh();
  };

  const getIcon = () => {
    switch (identity.type) {
      case 'creator':
        return <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour shrink-0" />;
      case 'business':
        return <Building2 className="w-3.5 h-3.5 text-brand-sunriseCoral shrink-0" />;
      case 'community':
        return <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />;
    }
  };

  const getManageHref = () => {
    if (identity.type === 'business') {
      return `/pages/${identity.handle}/manage`;
    }
    if (identity.type === 'community') {
      return `/communities/${identity.handle}/manage`;
    }
    if (identity.type === 'creator') {
      return '/creator-studio';
    }
    return null;
  };

  const manageHref = getManageHref();

  return (
    <aside
      aria-label="Operating identity notice"
      className="w-full bg-gradient-to-r from-brand-twilight via-slate-900 to-brand-twilight border-b border-brand-caribbeanSea/30 px-4 py-2 text-xs text-brand-sandstone transition-all sticky top-0 z-40 shadow-lg backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {getIcon()}
          <span className="text-slate-300">
            Operating as <strong className="text-white font-black">{identity.name}</strong> ({identity.type}) — Interactions and posts will be published under this profile.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {manageHref && (
            <Link
              href={manageHref}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          <button
            type="button"
            onClick={handleRevertToPersonal}
            className="px-3 py-1 rounded-full bg-brand-caribbeanSea/20 hover:bg-brand-caribbeanSea/30 text-brand-caribbeanSea border border-brand-caribbeanSea/30 font-bold text-[11px] transition-colors cursor-pointer"
          >
            Switch to @{user.username}
          </button>
        </div>
      </div>
    </aside>
  );
}
