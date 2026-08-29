'use client';

import React from 'react';
import { Building2, ShieldCheck, ExternalLink, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import ProviderStatusBadge from './provider-status-badge';
import type { ConnectionState, ProviderCapability } from '@caribbean/payments';

export interface ProviderConnectionView {
  providerId: string;
  name: string;
  connectionState: ConnectionState;
  maskedIdentifier: string | null;
  connectedAt: string | null;
  lastVerifiedAt: string | null;
  capabilities: ProviderCapability[];
  isConfigured: boolean;
  notes?: string;
}

interface ConnectedAccountsListProps {
  connections: ProviderConnectionView[];
}

export default function ConnectedAccountsList({ connections }: ConnectedAccountsListProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-white">Connected Financial Providers</h2>
        <p className="text-xs text-slate-400">
          Manage integrations with authorized payment processors, merchant settlement gateways, and payout institutions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connections.map((conn) => (
          <div
            key={conn.providerId}
            className="p-5 rounded-2xl bg-brand-dusk/60 border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-brand-sunriseCoral">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{conn.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      {conn.maskedIdentifier || 'No linked account identifier'}
                    </p>
                  </div>
                </div>
                <ProviderStatusBadge status={conn.connectionState} />
              </div>

              {conn.notes && (
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  {conn.notes}
                </p>
              )}

              {/* Capabilities Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Supported Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {conn.capabilities.slice(0, 5).map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700/60"
                    >
                      {cap.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {conn.capabilities.length > 5 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-400">
                      +{conn.capabilities.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">
                {conn.connectedAt
                  ? `Connected ${new Date(conn.connectedAt).toLocaleDateString()}`
                  : 'Pending account linkage'}
              </span>
              <button
                type="button"
                disabled={!conn.isConfigured}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Configure</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
