import React from 'react';
import type { Metadata } from 'next';
import MarketplaceSubNav from '../../components/marketplace/marketplace-sub-nav';

export const metadata: Metadata = {
  title: 'TUKUBI Marketplace — Caribbean Commerce, Artisans & Merchants',
  description: 'Discover and shop authentic Caribbean products, arts, crafts, culinary specialties, and diaspora fashion directly from local sellers.',
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <MarketplaceSubNav />
      {children}
    </div>
  );
}
