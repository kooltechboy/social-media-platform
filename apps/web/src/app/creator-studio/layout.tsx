import React from 'react';
import type { Metadata } from 'next';
import CreatorStudioSubNav from '../../components/creator/creator-studio-sub-nav';

export const metadata: Metadata = {
  title: 'TUKUBI Creator Studio — Caribbean Media, Analytics & Monetization',
  description: 'Manage Caribbean podcasts, video series, reels, live stream broadcasts, track audience analytics, and collect fan tips.',
};

export default function CreatorStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <CreatorStudioSubNav />
      {children}
    </div>
  );
}
