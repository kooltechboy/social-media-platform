import React from 'react';
import type { ConnectionState } from '@caribbean/payments';

interface ProviderStatusBadgeProps {
  status: ConnectionState | 'active' | 'sandbox' | 'disabled' | 'pending_approval' | string;
}

export default function ProviderStatusBadge({ status }: ProviderStatusBadgeProps) {
  switch (status) {
    case 'CONNECTED':
    case 'active':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Connected
        </span>
      );
    case 'CONNECTING':
    case 'VERIFYING':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse">
          Verifying
        </span>
      );
    case 'AUTHORIZATION_REQUIRED':
    case 'REAUTH_REQUIRED':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Auth Required
        </span>
      );
    case 'pending_approval':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Underwriting
        </span>
      );
    case 'sandbox':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-goldenHour/20 text-brand-goldenHour border border-brand-goldenHour/30">
          Sandbox Ready
        </span>
      );
    case 'SUSPENDED':
    case 'ERROR':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
          Action Required
        </span>
      );
    case 'NOT_CONNECTED':
    case 'DISCONNECTED':
    case 'disabled':
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
          Not Connected
        </span>
      );
  }
}
