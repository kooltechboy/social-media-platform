'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  Compass,
  Home,
  Layers,
  Globe,
  MessageSquare,
  PlusCircle,
  Search,
  User,
  PanelLeft,
  X,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { useSidebar } from './sidebar-context';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigation' | 'Actions' | 'Interface';
  action?: () => void;
}

interface KeyboardShortcutsContextValue {
  isShortcutsModalOpen: boolean;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue>({
  isShortcutsModalOpen: false,
  openShortcutsModal: () => {},
  closeShortcutsModal: () => {},
});

export const useKeyboardShortcuts = () => useContext(KeyboardShortcutsContext);

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toggleCollapse } = useSidebar();
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const pendingChordRef = useRef<string | null>(null);
  const chordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openShortcutsModal = useCallback(() => setIsShortcutsModalOpen(true), []);
  const closeShortcutsModal = useCallback(() => setIsShortcutsModalOpen(false), []);

  const focusSearchInput = useCallback(() => {
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[type="search"], input[name="q"], input[placeholder*="Search"], input[placeholder*="search"]'
    );
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }, []);

  const shortcuts: ShortcutItem[] = [
    // Navigation
    {
      keys: ['g', 'h'],
      description: 'Go to Home discovery feed',
      category: 'Navigation',
      action: () => router.push('/'),
    },
    {
      keys: ['g', 'f'],
      description: 'Go to Following feed view',
      category: 'Navigation',
      action: () => router.push('/?tab=following'),
    },
    {
      keys: ['g', 'c'],
      description: 'Go to Caribbean Regional & Diaspora Portal',
      category: 'Navigation',
      action: () => router.push('/caribbean'),
    },
    {
      keys: ['g', 'e'],
      description: 'Go to Explore & Discovery',
      category: 'Navigation',
      action: () => router.push('/explore'),
    },
    {
      keys: ['g', 'm'],
      description: 'Go to Messages',
      category: 'Navigation',
      action: () => router.push('/messages'),
    },
    {
      keys: ['g', 'p'],
      description: 'Go to Profile',
      category: 'Navigation',
      action: () => router.push('/profile'),
    },
    {
      keys: ['g', 's'],
      description: 'Go to Creator Studio',
      category: 'Navigation',
      action: () => router.push('/creator-studio'),
    },

    // Actions
    {
      keys: ['c'],
      description: 'Create new post or media item',
      category: 'Actions',
      action: () => router.push('/create'),
    },
    {
      keys: ['/', 'or', 'Ctrl', 'K'],
      description: 'Focus universal search bar',
      category: 'Actions',
      action: focusSearchInput,
    },

    // Interface
    {
      keys: ['['],
      description: 'Toggle desktop sidebar collapse / rail',
      category: 'Interface',
      action: toggleCollapse,
    },
    {
      keys: ['?'],
      description: 'Show keyboard shortcuts cheat sheet',
      category: 'Interface',
      action: openShortcutsModal,
    },
    {
      keys: ['Esc'],
      description: 'Dismiss modal dialog or close search',
      category: 'Interface',
      action: closeShortcutsModal,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore inputs/textareas/contenteditables (except Esc to blur)
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox');

      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          e.preventDefault();
          setIsShortcutsModalOpen(false);
          return;
        }
        if (isInput) {
          target.blur();
          return;
        }
      }

      if (isInput) {
        return;
      }

      // 2. Global Search: Ctrl+K / Cmd+K or slash '/'
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearchInput();
        return;
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        focusSearchInput();
        return;
      }

      // 3. Question mark '?' (Shift + /)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 4. Bracket '[': Toggle sidebar collapse
      if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleCollapse();
        return;
      }

      // 5. Single key 'c': Create
      if (e.key.toLowerCase() === 'c' && !pendingChordRef.current && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        router.push('/create');
        return;
      }

      // 6. Sequential Chord Navigation (g + [h, f, c, e, m, p, s])
      const key = e.key.toLowerCase();
      if (!pendingChordRef.current) {
        if (key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          pendingChordRef.current = 'g';
          if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
          chordTimerRef.current = setTimeout(() => {
            pendingChordRef.current = null;
          }, 1200);
        }
      } else if (pendingChordRef.current === 'g') {
        pendingChordRef.current = null;
        if (chordTimerRef.current) clearTimeout(chordTimerRef.current);

        switch (key) {
          case 'h':
            e.preventDefault();
            router.push('/');
            break;
          case 'f':
            e.preventDefault();
            router.push('/?tab=following');
            break;
          case 'c':
            e.preventDefault();
            router.push('/caribbean');
            break;
          case 'e':
            e.preventDefault();
            router.push('/explore');
            break;
          case 'm':
            e.preventDefault();
            router.push('/messages');
            break;
          case 'p':
            e.preventDefault();
            router.push('/profile');
            break;
          case 's':
            e.preventDefault();
            router.push('/creator-studio');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
    };
  }, [router, toggleCollapse, isShortcutsModalOpen, focusSearchInput]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        isShortcutsModalOpen,
        openShortcutsModal,
        closeShortcutsModal,
      }}
    >
      {children}

      {/* Accessible Desktop Shortcuts Cheat Sheet Modal */}
      {isShortcutsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={closeShortcutsModal}
        >
          <div
            className="w-full max-w-2xl bg-[#0F0B18]/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-caribbeanSea/20 to-brand-sunriseCoral/20 border border-brand-caribbeanSea/30 text-brand-caribbeanSea">
                  <Keyboard className="w-6 h-6" />
                </div>
                <div>
                  <h2 id="shortcuts-dialog-title" className="text-xl font-black text-white">
                    Desktop Keyboard Shortcuts
                  </h2>
                  <p className="text-xs text-brand-sandstone/70">
                    High-efficiency navigation &amp; controls across TUKUBI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeShortcutsModal}
                className="p-2 rounded-xl text-brand-sandstone/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close shortcuts modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-1">
              {/* Navigation Group */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-caribbeanSea flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> Navigation Chords
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === 'Navigation')
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
                      >
                        <span className="text-brand-sandstone/80">{item.description}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, kIdx) => (
                            <kbd
                              key={kIdx}
                              className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-[11px] font-bold text-white shadow-sm"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Actions & Interface Group */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-sunriseCoral flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {shortcuts
                      .filter((s) => s.category === 'Actions')
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
                        >
                          <span className="text-brand-sandstone/80">{item.description}</span>
                          <div className="flex items-center gap-1">
                            {item.keys.map((k, kIdx) => (
                              <kbd
                                key={kIdx}
                                className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-[11px] font-bold text-white shadow-sm"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-goldenHour flex items-center gap-1.5">
                    <PanelLeft className="w-3.5 h-3.5" /> Interface Controls
                  </h3>
                  <div className="space-y-2">
                    {shortcuts
                      .filter((s) => s.category === 'Interface')
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
                        >
                          <span className="text-brand-sandstone/80">{item.description}</span>
                          <div className="flex items-center gap-1">
                            {item.keys.map((k, kIdx) => (
                              <kbd
                                key={kIdx}
                                className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-[11px] font-bold text-white shadow-sm"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-brand-sandstone/60">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">?</kbd> anytime on desktop to view this guide</span>
              <span>TUKUBI Power Nav</span>
            </div>
          </div>
        </div>
      )}
    </KeyboardShortcutsContext.Provider>
  );
}
