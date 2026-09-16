'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Search, X, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category_title: string | null;
}

interface HelpSearchProps {
  placeholder?: string;
  size?: 'sm' | 'lg';
  autoFocus?: boolean;
}

export default function HelpSearch({ placeholder = 'Search for help...', size = 'sm', autoFocus = false }: HelpSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/help/search?q=${encodeURIComponent(q)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/help/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const inputClasses = size === 'lg'
    ? 'w-full bg-white/10 border border-white/20 rounded-2xl pl-14 pr-12 py-5 text-lg text-white placeholder-white/40 focus:outline-none focus:border-brand-caribbeanSea/60 focus:ring-2 focus:ring-brand-caribbeanSea/20 transition-all'
    : 'w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-caribbeanSea/60 transition-all';

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-white/40 ${size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'}`} />
          <input
            type="search"
            value={query}
            onChange={handleChange}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            aria-label="Search help articles"
            className={inputClasses}
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1D1429] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-brand-sandstone/60">Searching…</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-brand-sandstone/60">No results found for &quot;{query}&quot;</p>
              <Link
                href={`/help/search?q=${encodeURIComponent(query)}`}
                className="text-xs text-brand-caribbeanSea hover:underline mt-1 block"
                onClick={() => setIsOpen(false)}
              >
                View all search results →
              </Link>
            </div>
          ) : (
            <>
              <ul>
                {results.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/help/${r.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-brand-caribbeanSea mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.title}</p>
                        {r.description && (
                          <p className="text-xs text-brand-sandstone/60 truncate">{r.description}</p>
                        )}
                        {r.category_title && (
                          <p className="text-[10px] text-brand-caribbeanSea/80 mt-0.5">{r.category_title}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-2.5 border-t border-white/10">
                <Link
                  href={`/help/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 text-xs text-brand-caribbeanSea hover:underline"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> See all results for &quot;{query}&quot;
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
