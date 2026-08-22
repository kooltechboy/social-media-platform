import { describe, it, expect } from 'vitest';
import { LOCALES, t, missingKeys, isLocale, dictionaries, DEFAULT_LOCALE } from '../../packages/localization/src/index';

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
});
