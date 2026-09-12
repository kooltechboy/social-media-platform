import React from 'react';

export default function TeamPage() {
  const members = [
    {
      name: 'Nia Campbell',
      email: 'nia@bluemountain.store',
      role: 'Owner & Administrator',
      access: 'Full financial, ledger, payout & ad permissions',
      status: 'Active',
    },
    {
      name: 'Tariq Sterling',
      email: 'tariq@bluemountain.store',
      role: 'Fulfillment Manager',
      access: 'Order dispatch, shipping labels, inventory management',
      status: 'Active',
    },
    {
      name: 'Chloe Davis',
      email: 'chloe@caribagency.com',
      role: 'Marketing Specialist',
      access: 'Campaign creation, audience telemetry, analytics only',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A1B38] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Roles & Delegated Access</h1>
          <p className="text-sm text-[#FDF2E9]/60">
            Role-based access control (RBAC) protecting business ledger and escrow operations.
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#FFB347] text-white font-semibold text-sm shadow-md hover:opacity-95 transition-opacity">
          + Invite Team Member
        </button>
      </div>

      <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6">
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
      </div>
    </div>
  );
}
