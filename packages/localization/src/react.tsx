'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Locale,
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_DETAILS,
  LocaleMeta,
  TranslationKey,
  t as translateKey,
  tPlural as translatePlural,
  formatDate as formatLocaleDate,
  formatRelativeTime as formatLocaleRelativeTime,
  formatNumber as formatLocaleNumber,
  formatCurrency as formatLocaleCurrency,
  isLocale,
} from './index';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  tPlural: (key: TranslationKey, count: number, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string | number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency: string) => string;
  dir: 'ltr' | 'rtl';
  locales: LocaleMeta[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  initialLocale?: Locale | string;
  children: React.ReactNode;
}

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  const safeInitial: Locale = initialLocale && isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE;
  const [locale, setLocaleState] = useState<Locale>(safeInitial);

  // Sync with browser cookie or localStorage if initial is default and client-side cookie exists
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)tukubi_locale=([^;]+)/);
      if (match && isLocale(match[1]) && match[1] !== locale) {
        setLocaleState(match[1]);
      }
    }
  }, []);

  // Sync if initialLocale changes on Server Component navigation or router.refresh()
  useEffect(() => {
    if (initialLocale && isLocale(initialLocale) && initialLocale !== locale) {
      setLocaleState(initialLocale);
    }
  }, [initialLocale]);

  const setLocale = useCallback((newLocale: Locale) => {
    if (!isLocale(newLocale)) return;
    setLocaleState(newLocale);

    if (typeof document !== 'undefined') {
      document.cookie = `tukubi_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      try {
        localStorage.setItem('tukubi_locale', newLocale);
      } catch {
        // LocalStorage may be blocked
      }
      document.documentElement.lang = newLocale;
      const meta = LOCALE_DETAILS[newLocale];
      document.documentElement.dir = meta ? meta.dir : 'ltr';
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return translateKey(locale, key, params);
    },
    [locale]
  );

  const tPlural = useCallback(
    (key: TranslationKey, count: number, params?: Record<string, string | number>) => {
      return translatePlural(locale, key, count, params);
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatLocaleDate(date, locale, options);
    },
    [locale]
  );

  const formatRelativeTime = useCallback(
    (date: Date | string | number) => {
      return formatLocaleRelativeTime(date, locale);
    },
    [locale]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return formatLocaleNumber(value, locale, options);
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (amount: number, currency: string) => {
      return formatLocaleCurrency(amount, currency, locale);
    },
    [locale]
  );

  const localesList = useMemo(() => LOCALES.map((code) => LOCALE_DETAILS[code]), []);
  const currentMeta: LocaleMeta = (locale in LOCALE_DETAILS ? LOCALE_DETAILS[locale] : null) || LOCALE_DETAILS[DEFAULT_LOCALE];

  const value: I18nContextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      tPlural,
      formatDate,
      formatRelativeTime,
      formatNumber,
      formatCurrency,
      dir: currentMeta.dir,
      locales: localesList,
    }),
    [
      locale,
      setLocale,
      t,
      tPlural,
      formatDate,
      formatRelativeTime,
      formatNumber,
      formatCurrency,
      currentMeta.dir,
      localesList,
    ]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider or during SSR
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) =>
        translateKey(DEFAULT_LOCALE, key, params),
      tPlural: (key: TranslationKey, count: number, params?: Record<string, string | number>) =>
        translatePlural(DEFAULT_LOCALE, key, count, params),
      formatDate: (date, options) => formatLocaleDate(date, DEFAULT_LOCALE, options),
      formatRelativeTime: (date) => formatLocaleRelativeTime(date, DEFAULT_LOCALE),
      formatNumber: (val, options) => formatLocaleNumber(val, DEFAULT_LOCALE, options),
      formatCurrency: (amt, curr) => formatLocaleCurrency(amt, curr, DEFAULT_LOCALE),
      dir: 'ltr',
      locales: LOCALES.map((code) => LOCALE_DETAILS[code]),
    };
  }
  return context;
}

export function useLocale(): [Locale, (newLocale: Locale) => void] {
  const { locale, setLocale } = useTranslation();
  return [locale, setLocale];
}
