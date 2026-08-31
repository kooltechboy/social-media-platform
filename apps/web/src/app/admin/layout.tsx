import React from 'react';
import type { Metadata } from 'next';
import { AdminFooter } from '../../components/admin/admin-footer';

export const metadata: Metadata = {
  title: 'TUKUBI — Admin Console',
  description: 'Cryptographically audited administrative command center for the TUKUBI Caribbean Ecosystem.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090D16] text-brand-sandstone flex flex-col justify-between selection:bg-[#FF7A59]/30">
      <div className="flex-1">
        {children}
      </div>
      <AdminFooter systemRole="Administrator" />
    </div>
  );
}
