'use client';

import React, { useState, useEffect } from 'react';

export interface ToCItem {
  id: string;
  label: string;
  level: number;
}

export interface TableOfContentsProps {
  items: ToCItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="space-y-1">
      <p className="text-xs font-black uppercase tracking-wider text-brand-sandstone/40 px-2 mb-3">On This Page</p>
      {items.map(({ id, label, level }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`block text-xs py-1.5 px-2 rounded-lg transition-colors ${
            level > 1 ? 'pl-5' : ''
          } ${
            activeId === id
              ? 'text-brand-caribbeanSea font-semibold bg-brand-caribbeanSea/10'
              : 'text-brand-sandstone/60 hover:text-brand-sandstone hover:bg-white/5'
          }`}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
