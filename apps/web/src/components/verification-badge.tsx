import React from 'react';
import { CheckCircle, ShieldCheck, Building2, Landmark, GraduationCap, Star, Sparkles } from 'lucide-react';

export type VerificationLevel =
  | 'unverified'
  | 'email_verified'
  | 'phone_verified'
  | 'identity_verified'
  | 'business_verified'
  | 'government_verified'
  | 'institution_verified'
  | 'creator_verified';

interface VerificationBadgeProps {
  level: VerificationLevel;
  className?: string;
  showLabel?: boolean;
}

export default function VerificationBadge({
  level,
  className = '',
  showLabel = false,
}: VerificationBadgeProps) {
  if (level === 'unverified') return null;

  switch (level) {
    case 'government_verified':
      return (
        <span
          title="Government Verified Civic Entity"
          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm ${className}`}
        >
          <Landmark className="w-3 h-3 text-amber-400" />
          {showLabel && <span>GOVERNMENT</span>}
        </span>
      );

    case 'business_verified':
      return (
        <span
          title="Verified Caribbean Business & Merchant"
          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm ${className}`}
        >
          <Building2 className="w-3 h-3 text-emerald-400" />
          {showLabel && <span>BUSINESS</span>}
        </span>
      );

    case 'creator_verified':
      return (
        <span
          title="Verified Caribbean Creator"
          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm ${className}`}
        >
          <Sparkles className="w-3 h-3 text-sky-400" />
          {showLabel && <span>CREATOR</span>}
        </span>
      );

    case 'institution_verified':
      return (
        <span
          title="Verified Educational / Cultural Institution"
          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm ${className}`}
        >
          <GraduationCap className="w-3 h-3 text-purple-400" />
          {showLabel && <span>INSTITUTION</span>}
        </span>
      );

    case 'identity_verified':
      return (
        <span
          title="Identity Verified Caribbean Citizen / Diaspora"
          className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 ${className}`}
        >
          <CheckCircle className="w-3 h-3 text-sky-400 fill-sky-400/20" />
          {showLabel && <span>VERIFIED</span>}
        </span>
      );

    case 'email_verified':
    case 'phone_verified':
    default:
      return (
        <span
          title="Contact Verified"
          className={`inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 ${className}`}
        >
          <ShieldCheck className="w-3 h-3 text-slate-500" />
        </span>
      );
  }
}
