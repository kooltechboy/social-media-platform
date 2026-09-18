'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Sparkles,
  Building2,
  Users,
  Check,
  ChevronDown,
  RefreshCw,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from './auth-provider';
import UserAvatar from './user-avatar';
import { createSupabaseBrowserClient } from '../lib/supabase/browser';

export type OperatingMode = 'personal' | 'creator' | 'business' | 'community';

export interface IdentityProfile {
  id: string;
  type: OperatingMode;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  badge: string;
  isVerified?: boolean;
}

interface IdentitySwitcherProps {
  variant?: 'compact' | 'full' | 'dropdown' | 'composer';
  className?: string;
  onIdentityChange?: (identity: IdentityProfile) => void;
}

export default function IdentitySwitcher({
  variant = 'compact',
  className = '',
  onIdentityChange,
}: IdentitySwitcherProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdentity, setActiveIdentity] = useState<IdentityProfile | null>(null);
  const [identities, setIdentities] = useState<IdentityProfile[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Load identities from user and Supabase
  useEffect(() => {
    if (!user) return;

    async function loadIdentities() {
      setLoading(true);
      const personal: IdentityProfile = {
        id: user!.id,
        type: 'personal',
        name: user!.displayName || `@${user!.username}`,
        handle: user!.username,
        avatarUrl: user!.avatarUrl,
        badge: user!.isOfficial ? 'Official' : 'Personal',
        isVerified: user!.isOfficial,
      };

      const identityList: IdentityProfile[] = [personal];

      try {
        const supabase = createSupabaseBrowserClient();
        if (supabase) {
          // Check for creator account
          const { data: creatorAcc } = await supabase
            .from('creator_accounts')
            .select('id, is_verified, category')
            .eq('profile_id', user!.id)
            .maybeSingle();

          if (creatorAcc) {
            identityList.push({
              id: creatorAcc.id,
              type: 'creator',
              name: `${user!.displayName || user!.username} (Creator)`,
              handle: user!.username,
              avatarUrl: user!.avatarUrl,
              badge: 'Creator Studio',
              isVerified: creatorAcc.is_verified,
            });
          }

          // Check for owned businesses
          const { data: businesses } = await supabase
            .from('businesses')
            .select('id, name, slug, is_verified')
            .eq('owner_id', user!.id)
            .limit(10);

          if (businesses) {
            businesses.forEach((b) => {
              identityList.push({
                id: b.id,
                type: 'business',
                name: b.name,
                handle: b.slug,
                avatarUrl: null,
                badge: 'Business Page',
                isVerified: b.is_verified,
              });
            });
          }

          // Check for managed communities
          const { data: communities } = await supabase
            .from('community_members')
            .select('community_id, communities(id, name, slug, cover_image_url)')
            .eq('profile_id', user!.id)
            .in('role', ['admin', 'moderator'])
            .limit(10);

          if (communities) {
            communities.forEach((cm: any) => {
              const c = cm.communities;
              if (c) {
                identityList.push({
                  id: c.id,
                  type: 'community',
                  name: c.name,
                  handle: c.slug,
                  avatarUrl: c.cover_image_url,
                  badge: 'Hub Lead',
                  isVerified: false,
                });
              }
            });
          }
        }
      } catch {
        // fallback to personal only
      } finally {
        setIdentities(identityList);

        // Check active identity in localStorage
        const stored = typeof window !== 'undefined' ? localStorage.getItem('tukubi_active_identity_id') : null;
        const matching = identityList.find((i) => i.id === stored);
        const selected = matching || personal;
        setActiveIdentity(selected);
        if (onIdentityChange) {
          onIdentityChange(selected);
        }
        setLoading(false);
      }
    }

    loadIdentities();
  }, [user]);

  function handleSelectIdentity(identity: IdentityProfile) {
    setActiveIdentity(identity);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tukubi_active_identity_id', identity.id);
      localStorage.setItem('tukubi_active_identity_type', identity.type);
      window.dispatchEvent(new CustomEvent('tukubi_identity_switched', { detail: identity }));
    }
    if (onIdentityChange) {
      onIdentityChange(identity);
    }
    setIsOpen(false);
  }

  if (!user || !activeIdentity) {
    return null;
  }

  const getBadgeStyle = (type: OperatingMode) => {
    switch (type) {
      case 'creator':
        return 'bg-brand-goldenHour/20 text-brand-goldenHour border-brand-goldenHour/30';
      case 'business':
        return 'bg-brand-sunriseCoral/20 text-brand-sunriseCoral border-brand-sunriseCoral/30';
      case 'community':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'personal':
      default:
        return 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea border-brand-caribbeanSea/30';
    }
  };

  const getIcon = (type: OperatingMode) => {
    switch (type) {
      case 'creator':
        return <Sparkles className="w-3.5 h-3.5 text-brand-goldenHour shrink-0" />;
      case 'business':
        return <Building2 className="w-3.5 h-3.5 text-brand-sunriseCoral shrink-0" />;
      case 'community':
        return <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'personal':
      default:
        return <User className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Switch identity. Currently operating as ${activeIdentity.name}`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-caribbeanSea/40 transition-all text-left group min-h-[38px] cursor-pointer"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {getIcon(activeIdentity.type)}
          <span className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[160px]">
            {activeIdentity.name}
          </span>
          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${getBadgeStyle(activeIdentity.type)} uppercase tracking-wider hidden sm:inline-block`}>
            {activeIdentity.badge}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/50 group-hover:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover / Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-72 sm:w-80 rounded-3xl bg-[#110D17]/95 backdrop-blur-2xl border border-white/15 p-3 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 px-1">
            <div>
              <p className="text-xs font-black text-white flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-brand-caribbeanSea" /> Operating Identity
              </p>
              <p className="text-[10px] text-brand-sandstone/60">
                Switch between your personal, creator &amp; business profiles
              </p>
            </div>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {identities.map((item) => {
              const isSelected = item.id === activeIdentity.id && item.type === activeIdentity.type;
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => handleSelectIdentity(item)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all text-left ${
                    isSelected
                      ? 'bg-gradient-to-r from-brand-caribbeanSea/20 to-brand-sunriseCoral/10 border border-brand-caribbeanSea/30 text-white'
                      : 'hover:bg-white/5 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      src={item.avatarUrl}
                      name={item.name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-white truncate">{item.name}</p>
                        {item.isVerified && (
                          <ShieldCheck className="w-3 h-3 text-brand-caribbeanSea shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-white/50 truncate">@{item.handle}</span>
                        <span className="text-white/20">•</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${getBadgeStyle(item.type)}`}>
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-brand-caribbeanSea text-slate-950 flex items-center justify-center shrink-0 ml-2 shadow-sm shadow-brand-caribbeanSea/40">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 px-1">
            <Link
              href="/pages/create"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-brand-caribbeanSea hover:underline flex items-center gap-1 min-h-[30px]"
            >
              <Plus className="w-3 h-3" /> Create Page
            </Link>
            <Link
              href="/creator-hub"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-brand-goldenHour hover:underline flex items-center gap-1 min-h-[30px]"
            >
              <Sparkles className="w-3 h-3" /> Creator Studio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
