'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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

    updateLanguageAction(code).catch(() => {});
    router.refresh();
  };

  return (
    <div className={`relative inline-block text-left select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-xl border transition-colors ${
          variant === 'compact'
            ? 'px-3 h-10 bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-[13px] font-medium text-[#C3CCDA] hover:text-white'
            : 'px-3.5 h-10 bg-white/[0.06] hover:bg-white/[0.10] border-white/[0.10] text-[13px] font-medium text-white'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 text-brand-mist shrink-0" />
        <span className={variant === 'compact' ? 'hidden xl:inline' : 'hidden sm:inline'}>
          {selectedLang.nativeLabel}
        </span>
        <span className={variant === 'compact' ? 'xl:hidden uppercase text-xs font-semibold' : 'sm:hidden uppercase text-xs font-semibold'}>
          {selectedLang.code}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-brand-mist transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0B1424]/96 backdrop-blur-2xl border border-white/[0.09] shadow-panel-lg p-1.5 z-50 animate-fadeIn">
            <div className="px-3 py-1.5 tk-section-label">
              Language
            </div>
            {CARIBBEAN_LOCALES.map((localeItem) => {
              const isSelected = selectedLang.code === localeItem.code;
              return (
                <button
                  key={localeItem.code}
                  type="button"
                  onClick={() => handleSelect(localeItem.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-brand-caribbeanSea/[0.14] text-white font-semibold'
                      : 'text-[#C3CCDA] hover:bg-white/[0.05] hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base shrink-0">{localeItem.flag}</span>
                    <div className="text-left">
                      <p className="leading-tight">{localeItem.nativeLabel}</p>
                      <p className="text-[11px] text-brand-mist">{localeItem.label}</p>
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
