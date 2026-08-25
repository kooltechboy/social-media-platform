'use client';

import React, { useState, useEffect } from 'react';

const TAGLINES = [
  '59M+ Caribbean people and global diaspora.',
  'Connect. Create. Discover. Transact.',
  'Culture without borders.',
  'From Kingston to Toronto, Port of Spain to London.',
  'From Santo Domingo to New York, Bridgetown to Miami.',
  'One Caribbean. One Community. One Digital Home.',
  'Your people. Your culture. Your global network.',
];

export function RotatingTaglines() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % TAGLINES.length);
        setFade(true);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-7 flex items-center">
      <p
        className={`text-brand-sandstone/70 text-sm font-medium tracking-wide transition-all duration-500 ease-in-out ${
          fade ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        {TAGLINES[index]}
      </p>
    </div>
  );
}
