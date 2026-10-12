import React from 'react';

export default function TeamPage() {
  const members: Array<{
    name: string;
    email: string;
    role: string;
    access: string;
    status: string;
  }> = [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A1B38] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Roles &amp; Delegated Access</h1>
          <p className="text-sm text-[#FDF2E9]/60">
            Role-based access control (RBAC) protecting business ledger and escrow operations.
          </p>
        </div>
        <a
          href="/business-center?tab=team"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#FFB347] text-[#110D17] font-bold text-sm shadow-md hover:opacity-95 transition-opacity inline-flex items-center justify-center"
        >
          + Manage Team Access
        </a>
      </div>

      <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6">
        {members.length === 0 ? (
          <div className="py-6 text-center space-y-2 text-[#FDF2E9]/50">
            <p className="text-sm font-semibold text-white">No delegated staff members configured</p>
            <p className="text-xs max-w-xl mx-auto">
              Manage verified business page operators and role permissions via the canonical Business Center (`/business-center?tab=team`, `business_team_members` table).
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((m) => (
              <div key={m.email} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2A1B38]/40 pb-4 gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{m.name}</p>
                  <p className="text-xs text-[#00B4D8] font-mono">{m.email}</p>
                  <p className="text-xs text-[#FDF2E9]/60 mt-1">{m.access}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 font-medium">
                    {m.role}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
