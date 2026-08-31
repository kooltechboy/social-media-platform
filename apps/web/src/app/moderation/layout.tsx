import React from 'react';
import type { Metadata } from 'next';
import { AdminFooter } from '../../components/admin/admin-footer';

export const metadata: Metadata = {
  title: 'TUKUBI — Moderation Center',
  description: 'Human-in-the-loop Trust & Safety command center for the TUKUBI Caribbean Ecosystem.',
};

export default function ModerationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone flex flex-col justify-between selection:bg-[#FF7A59]/30">
      <div className="flex-1">
        {children}
      </div>
      <AdminFooter systemRole="Trust & Safety Moderator" />
    </div>
  );
}
