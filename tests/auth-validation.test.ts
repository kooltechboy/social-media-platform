import { describe, it, expect } from 'vitest';
import {
  validateUsername,
  generateUsernameSuggestions,
  calculatePasswordStrength,
  sanitizeRedirectUrl,
} from '../apps/web/src/lib/auth/validation';

describe('Auth Validation Utilities', () => {
  describe('validateUsername', () => {
    it('accepts valid usernames', () => {
      expect(validateUsername('daniel2401').isValid).toBe(true);
      expect(validateUsername('carib_vibes').isValid).toBe(true);
      expect(validateUsername('island.life').isValid).toBe(true);
    });

    it('rejects short usernames', () => {
      const res = validateUsername('dj');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/at least 3 characters/i);
    });

    it('rejects usernames with invalid symbols or spaces', () => {
      expect(validateUsername('user@name').isValid).toBe(false);
      expect(validateUsername('user name').isValid).toBe(false);
      expect(validateUsername('bad!name').isValid).toBe(false);
    });

    it('identifies reserved platform usernames', () => {
      const res = validateUsername('admin');
      expect(res.isValid).toBe(false);
      expect(res.isReserved).toBe(true);
      expect(res.error).toMatch(/reserved/i);
    });
  });

  describe('generateUsernameSuggestions', () => {
    it('generates culturally resonant suggestions when handle is taken', () => {
      const suggestions = generateUsernameSuggestions('trini');
      expect(suggestions.length).toBeGreaterThanOrEqual(3);
      expect(suggestions.some((s) => s.includes('carib') || s.includes('vibes') || s.includes('trini'))).toBe(true);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('scores weak passwords properly', () => {
      const res = calculatePasswordStrength('12345');
      expect(res.score).toBeLessThanOrEqual(1);
      expect(res.meetsMinimum).toBe(false);
    });

    it('scores strong passwords meeting Fortune-100 standards', () => {
      const res = calculatePasswordStrength('Tukubi#2026!Connected');
      expect(res.score).toBeGreaterThanOrEqual(3);
      expect(res.meetsMinimum).toBe(true);
    });
  });

  describe('sanitizeRedirectUrl', () => {
    it('allows valid internal paths', () => {
      expect(sanitizeRedirectUrl('/explore')).toBe('/explore');
      expect(sanitizeRedirectUrl('/profile/trini_user')).toBe('/profile/trini_user');
      expect(sanitizeRedirectUrl('/events?island=JM')).toBe('/events?island=JM');
    });

    it('blocks open-redirect and protocol-relative URLs', () => {
      expect(sanitizeRedirectUrl('//evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('https://malicious.site')).toBe('/');
      expect(sanitizeRedirectUrl('/\\evil.com')).toBe('/');
      expect(sanitizeRedirectUrl('/../traversal')).toBe('/');
    });
  });
});
