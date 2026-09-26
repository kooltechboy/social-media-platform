'use client';

import React from 'react';
import type { ResolvedContentMetadata } from '@caribbean/media';
import UniversalContentCard from './universal-content-card';

export interface MultiLinkContainerProps {
  previews: ResolvedContentMetadata[];
  onRemovePreview?: (index: number) => void;
  className?: string;
}

export default function MultiLinkContainer({
  previews,
  onRemovePreview,
  className = '',
}: MultiLinkContainerProps) {
  if (!previews || previews.length === 0) return null;

  if (previews.length === 1) {
    return (
      <div className={className}>
        <UniversalContentCard
          metadata={previews[0]}
          onRemove={onRemovePreview ? () => onRemovePreview(0) : undefined}
        />
      </div>
    );
  }

  const [primary, ...secondaries] = previews;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Primary Link: Full Visual Polish */}
      <UniversalContentCard
        metadata={primary}
        onRemove={onRemovePreview ? () => onRemovePreview(0) : undefined}
      />

      {/* Secondary Links: Compact, Clutter-Free Gallery Cards */}
      <div className="space-y-1.5 pt-1">
        {secondaries.map((sec, idx) => (
          <UniversalContentCard
            key={sec.normalizedUrl || idx}
            metadata={sec}
            compact
            onRemove={onRemovePreview ? () => onRemovePreview(idx + 1) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
