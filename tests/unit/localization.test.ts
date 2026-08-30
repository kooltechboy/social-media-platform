import { describe, it, expect } from 'vitest';
import {
  LOCALES,
  t,
  missingKeys,
  isLocale,
  dictionaries,
  DEFAULT_LOCALE,
  formatRelativeTime,
  formatCurrency,
  formatNumber,
} from '../../packages/localization/src/index';

describe('Localization (six launch locales)', () => {
  it('ships all six Caribbean launch locales', () => {
    expect(LOCALES).toEqual(['en', 'es', 'fr', 'ht', 'nl', 'pap']);
  });

  it('has complete dictionaries for every locale (no missing keys)', () => {
    for (const locale of LOCALES) {
      expect(missingKeys(locale)).toEqual([]);
    }
  });

  it('translates navigation and composer keys in every locale', () => {
    expect(t('en', 'nav.home')).toBe('Home');
    expect(t('es', 'nav.home')).toBe('Inicio');
    expect(t('fr', 'nav.home')).toBe('Accueil');
    expect(t('ht', 'nav.home')).toBe('Akèy');
    expect(t('nl', 'nav.home')).toBe('Home');
    expect(t('pap', 'nav.home')).toBe('Kas');
    expect(t('pap', 'composer.placeholder')).toContain('pasando');
  });

  it('validates locale codes and falls back to English keys', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('pt')).toBe(false);
    expect(dictionaries[DEFAULT_LOCALE]['common.retry']).toBeDefined();
  });

  it('interpolates parameters in translation strings', () => {
    expect(t('en', 'post.translate', { lang: 'Spanish' })).toBe('Translate to Spanish');
    expect(t('es', 'post.translate', { lang: 'Inglés' })).toBe('Traducir al Inglés');
    expect(t('ht', 'post.translate', { lang: 'Kreyòl' })).toBe('Tradwi an Kreyòl');
  });

  it('supports pluralization helper tPlural', () => {
    expect(t('en', 'time.minutes_ago', { count: 5 })).toBe('5m ago');
    expect(t('ht', 'time.minutes_ago', { count: 12 })).toBe('Sa gen 12m');
    expect(t('pap', 'time.hours_ago', { count: 3 })).toBe('3o pasá');
  });

  it('formats dates, relative times, numbers, and currencies according to locale', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 10000, 'en')).toBe('Just now');
    expect(formatRelativeTime(now - 10000, 'es')).toBe('Hace un momento');
    expect(formatRelativeTime(now - 10000, 'ht')).toBe('Kounye a');
    expect(formatRelativeTime(now - 10000, 'pap')).toBe('Djis awor');

    const formattedCurrencyUSD = formatCurrency(45.5, 'USD', 'en');
    expect(formattedCurrencyUSD).toContain('45.50');

    const formattedNumber = formatNumber(1250000, 'en');
    expect(formattedNumber).toContain('1,250,000');
  });
});
