'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation, Locale } from '@caribbean/localization';
import { updateLanguageAction } from '../../lib/settings/settings-actions';

export interface LanguageOption {
  code: Locale;
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

export interface LanguageDropdownProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function LanguageDropdown({ className = '', variant = 'default' }: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale } = useTranslation();
  const router = useRouter();

  const selectedLang = CARIBBEAN_LOCALES.find((l) => l.code === locale) || CARIBBEAN_LOCALES[0];

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);

    if (typeof document !== 'undefined') {
      document.cookie = `tukubi_locale=${code}; path=/; max-age=31536000; SameSite=Lax`;
      try {
        localStorage.setItem('tukubi_locale', code);
      } catch {
        // Ignored
      }
    }

    // Persist to user profile in Supabase in the background if signed in
    updateLanguageAction(code).catch(() => {});

    // Refresh Server Components so Next.js server rendered trees update
    router.refresh();
  };

  return (
    <div className={`relative inline-block text-left select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-full border backdrop-blur-xl font-semibold transition-all active:scale-95 shadow-sm ${
          variant === 'compact'
            ? 'px-3 py-1.5 bg-brand-twilight/80 hover:bg-brand-twilight border-slate-700/80 text-xs text-brand-sandstone hover:border-brand-caribbeanSea/60'
            : 'px-3.5 py-1.5 bg-white/10 hover:bg-white/15 border-white/15 text-xs text-white'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Change language"
      >
        <Globe className="w-3.5 h-3.5 text-brand-caribbeanSea shrink-0" />
        <span>{selectedLang.flag}</span>
        <span className={variant === 'compact' ? 'hidden lg:inline' : 'hidden sm:inline'}>
          {selectedLang.nativeLabel}
        </span>
        <ChevronDown className={`w-3 h-3 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0C1322]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-1.5 z-50 animate-fadeIn">
            <div className="px-3 py-1.5 text-[10px] font-bold text-brand-sandstone/40 uppercase tracking-wider">
              Caribbean Launch Locales
            </div>
            {CARIBBEAN_LOCALES.map((localeItem) => {
              const isSelected = selectedLang.code === localeItem.code;
              return (
                <button
                  key={localeItem.code}
                  type="button"
                  onClick={() => handleSelect(localeItem.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-brand-caribbeanSea/20 text-brand-caribbeanSea font-bold'
                      : 'text-brand-sandstone/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base shrink-0">{localeItem.flag}</span>
                    <div className="text-left">
                      <p className="leading-tight">{localeItem.nativeLabel}</p>
                      <p className="text-[10px] text-brand-sandstone/40">{localeItem.label}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-caribbeanSea stroke-[2.5] shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
