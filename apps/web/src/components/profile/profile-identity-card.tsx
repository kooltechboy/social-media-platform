'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  MapPin,
  Globe,
  Calendar,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus,
  MessageSquare,
} from 'lucide-react';
import type { SanitizedProfileIdentity } from '../../lib/profile/privacy-sanitizer';
import { TukubiCulturalPassport } from '../gateway/TukubiCulturalPassport';

interface ProfileIdentityCardProps {
  displayName: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  accountType?: string;
  identity: SanitizedProfileIdentity;
  isOwnProfile: boolean;
  isVerified?: boolean;
  isOfficial?: boolean;
}

export function ProfileIdentityCard({
  displayName,
  username,
  bio,
  avatarUrl,
  accountType = 'personal',
  identity,
  isOwnProfile,
  isVerified,
  isOfficial,
}: ProfileIdentityCardProps) {
  const [showPassport, setShowPassport] = useState(false);

  return (
    <div className="bg-[#0C1424]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/40 space-y-4">
      {/* Top Banner: Passport Toggle & Privacy Indicator */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-caribbeanSea to-brand-goldenHour p-[1px] flex items-center justify-center">
            <div className="w-full h-full bg-[#080D18] rounded-lg flex items-center justify-center text-[10px] font-black text-brand-caribbeanSea">
              🌴
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Caribbean Identity & Roots
            </h3>
            <p className="text-[10px] text-brand-sandstone/50 font-medium">
              Tukubi Cultural Passport
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPassport(!showPassport)}
          className="text-[11px] font-bold text-brand-caribbeanSea hover:text-cyan-300 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/25"
        >
          <Sparkles className="w-3 h-3 text-brand-goldenHour" />
          <span>{showPassport ? 'Hide Passport' : 'View Passport'}</span>
        </button>
      </div>

      {/* Island Roots & Diaspora Details (Strictly Privacy Sanitized) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {identity.originCountryIso ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-caribbeanSea/10 border border-brand-caribbeanSea/30 text-xs font-bold text-white shadow-sm">
            <span>{identity.originFlag || '🌴'}</span>
            <span className="text-brand-caribbeanSea">{identity.originCountryName || identity.originCountryIso}</span>
            <span className="text-[10px] text-brand-sandstone/40">· Origin</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-brand-sandstone/60">
            <Globe className="w-3 h-3 text-brand-sandstone/40" />
            <span>Caribbean Citizen</span>
          </div>
        )}

        {identity.isDiaspora && identity.diasporaCountryName && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-goldenHour/10 border border-brand-goldenHour/30 text-xs font-bold text-white shadow-sm">
            <span>{identity.diasporaFlag || '🌎'}</span>
            <span className="text-brand-goldenHour">{identity.diasporaCountryName}</span>
            <span className="text-[10px] text-brand-sandstone/40">· Diaspora</span>
          </div>
        )}

        {isOwnProfile && !identity.isOwnerOrPublic && (
          <div className="inline-flex items-center gap-1 text-[10px] text-brand-sandstone/40 px-2 py-0.5 rounded-full bg-white/5">
            <EyeOff className="w-3 h-3 text-brand-sandstone/40" />
            <span>Origin set to Private (Visible only to you)</span>
          </div>
        )}
      </div>

      {/* Expandable Cultural Passport Card */}
      {showPassport && (
        <div className="pt-2 animate-fadeIn">
          <TukubiCulturalPassport
            displayName={displayName}
            username={username}
            originCountryName={identity.originCountryName || 'Caribbean'}
            originCountryIso={identity.originCountryIso || 'CAR'}
            originFlag={identity.originFlag || '🌴'}
            diasporaCountryName={identity.diasporaCountryName || 'Global Diaspora'}
            diasporaFlag={identity.diasporaFlag || '🌎'}
            accountType={accountType}
          />
        </div>
      )}
    </div>
  );
}
