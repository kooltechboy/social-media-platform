'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, ChevronDown, Check } from 'lucide-react';

export interface LanguageOption {
  code: 'en' | 'es' | 'fr' | 'ht' | 'nl' | 'pap';
  label: string;
  nativeLabel: string;
  flag: string;
}

export const CARIBBEAN_LOCALES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇩🇴' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'ht', label: 'Haitian Creole', nativeLabel: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', flag: '🇳🇱' },
  { code: 'pap', label: 'Papiamento', nativeLabel: 'Papiamentu', flag: '🇨🇼' },
];

export function LanguageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<LanguageOption>(CARIBBEAN_LOCALES[0]);

  return (
    <div className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-xl text-xs font-semibold text-white transition-all active:scale-95 shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea" />
        <span>{selectedLang.flag}</span>
        <span className="hidden sm:inline">{selectedLang.nativeLabel}</span>
        <ChevronDown className="w-3 h-3 text-white/60 transition-transform duration-200" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0C1322]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-1.5 z-50 animate-fadeIn">
            <div className="px-3 py-1.5 text-[10px] font-bold text-brand-sandstone/40 uppercase tracking-wider">
              Caribbean Launch Locales
            </div>
            {CARIBBEAN_LOCALES.map((locale) => {
              const isSelected = selectedLang.code === locale.code;
              return (
                <button
                  key={locale.code}
                  type="button"
                  onClick={() => {
                    setSelectedLang(locale);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea font-bold'
                      : 'text-brand-sandstone/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{locale.flag}</span>
                    <div className="text-left">
                      <p className="leading-tight">{locale.nativeLabel}</p>
                      <p className="text-[10px] text-brand-sandstone/40">{locale.label}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-caribbeanSea stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
