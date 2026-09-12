import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  resolveAgeTier,
  getSafetySettingsForTier,
  canInitiateDirectMessage,
} from '../../apps/web/src/lib/safety/age-service';

describe('TUKUBI Child Safety & Age Verification Engine', () => {
  describe('Age & Tier Resolution', () => {
    it('accurately calculates age from birth date', () => {
      const dob10YearsAgo = new Date();
      dob10YearsAgo.setFullYear(dob10YearsAgo.getFullYear() - 10);
      expect(calculateAge(dob10YearsAgo)).toBe(10);

      const dob25YearsAgo = new Date();
      dob25YearsAgo.setFullYear(dob25YearsAgo.getFullYear() - 25);
      expect(calculateAge(dob25YearsAgo)).toBe(25);
    });

    it('assigns under_13 tier for children under 13', () => {
      expect(resolveAgeTier(10)).toBe('under_13');
      expect(resolveAgeTier(12)).toBe('under_13');
    });

    it('assigns 13_to_17 tier for protected teens', () => {
      expect(resolveAgeTier(13)).toBe('13_to_17');
      expect(resolveAgeTier(16)).toBe('13_to_17');
      expect(resolveAgeTier(17)).toBe('13_to_17');
    });

    it('assigns 18_plus tier for adults', () => {
      expect(resolveAgeTier(18)).toBe('18_plus');
      expect(resolveAgeTier(35)).toBe('18_plus');
    });
  });

  describe('Minor Safety Settings', () => {
    it('enforces maximum privacy defaults for minor accounts', () => {
      const minorSettings = getSafetySettingsForTier('13_to_17');
      expect(minorSettings.dmRestrictions).toBe('followers_only');
      expect(minorSettings.safeContentMode).toBe(true);
      expect(minorSettings.blockTargetedAds).toBe(true);
    });

    it('allows full open settings for adult accounts', () => {
      const adultSettings = getSafetySettingsForTier('18_plus');
      expect(adultSettings.dmRestrictions).toBe('everyone');
      expect(adultSettings.safeContentMode).toBe(false);
      expect(adultSettings.blockTargetedAds).toBe(false);
    });
  });

  describe('Direct Message Safety Containment', () => {
    it('blocks adults from messaging minors unless the minor follows them', () => {
      const checkBlocked = canInitiateDirectMessage({
        senderTier: '18_plus',
        recipientTier: '13_to_17',
        isFollowing: false,
      });

      expect(checkBlocked.allowed).toBe(false);
      expect(checkBlocked.reason).toContain('protect minors');
    });

    it('allows adults to message minors if the minor follows them', () => {
      const checkAllowed = canInitiateDirectMessage({
        senderTier: '18_plus',
        recipientTier: '13_to_17',
        isFollowing: true,
      });

      expect(checkAllowed.allowed).toBe(true);
    });

    it('always blocks stranger DMs to under-13 accounts', () => {
      const checkUnder13 = canInitiateDirectMessage({
        senderTier: '18_plus',
        recipientTier: 'under_13',
        isFollowing: false,
      });

      expect(checkUnder13.allowed).toBe(false);
      expect(checkUnder13.reason).toContain('under-13');
    });
  });
});
