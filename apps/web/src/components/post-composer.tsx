'use client';

import React from 'react';
import UniversalComposer from './universal-composer';

export default function PostComposer({ displayName }: { displayName: string }) {
  return (
    <UniversalComposer
      displayName={displayName}
      avatarInitials={displayName.slice(0, 2).toUpperCase()}
    />
  );
}
