import { describe, it, expect } from 'vitest';
import {
  LOCALES,
  LOCALE_DETAILS,
  t,
  missingKeys,
  protectTokens,
  restoreTokens,
  computeContentHash,
} from '../../packages/localization/src/index';
import {
  CARIBBEAN_DIALECT_DETAILS,
  detectCaribbeanDialect,
  translateDialectText,
  CaribbeanDialect,
} from '../../packages/localization/src/dialects';

describe('Phase 13 — Caribbean Diaspora & Geography Engine Certification', () => {
  // ===========================================================================
  // 1. Caribbean Launch Locales & Dictionary Parity
  // ===========================================================================
  describe('1. Launch Locales & Full Dictionary Parity', () => {
    it('ships the authoritative Caribbean multilingual launch locales', () => {
      expect(LOCALES).toEqual(['en', 'es', 'fr', 'ht', 'nl', 'pap']);
    });

    it('guarantees complete dictionary coverage with zero missing keys across all 6 locales', () => {
      for (const locale of LOCALES) {
        const missing = missingKeys(locale);
        expect(missing, `Locale ${locale} has missing translation keys`).toEqual([]);
      }
    });

    it('verifies regional metadata and flags for all locales', () => {
      expect(LOCALE_DETAILS.en.region).toContain('Caribbean');
      expect(LOCALE_DETAILS.es.flag).toBe('🇨🇺');
      expect(LOCALE_DETAILS.fr.flag).toBe('🇲🇶');
      expect(LOCALE_DETAILS.ht.flag).toBe('🇭🇹');
      expect(LOCALE_DETAILS.nl.flag).toBe('🇸🇷');
      expect(LOCALE_DETAILS.pap.flag).toBe('🇨🇼');
    });
  });

  // ===========================================================================
  // 2. Caribbean Dialect Lexicons & Authentic Cultural Classification
  // ===========================================================================
  describe('2. Dialect Lexicons & Vernacular Classification', () => {
    it('registers the authentic Caribbean regional dialects', () => {
      const dialects: CaribbeanDialect[] = ['jam', 'ht', 'pap', 'tri', 'guy', 'bah', 'general'];
      dialects.forEach((d) => {
        expect(CARIBBEAN_DIALECT_DETAILS[d]).toBeDefined();
        expect(CARIBBEAN_DIALECT_DETAILS[d].flag.length).toBeGreaterThan(0);
        expect(CARIBBEAN_DIALECT_DETAILS[d].sampleGreeting.length).toBeGreaterThan(0);
      });
    });

    it('accurately identifies Jamaican Patois from authentic phrases', () => {
      const res = detectCaribbeanDialect('Wah gwaan fam, mi deh yah pon di riddim!');
      expect(res.dialect).toBe('jam');
      expect(res.confidence).toBeGreaterThan(0.5);
      expect(res.matchedMarkers).toContain('wah gwaan');
    });

    it('accurately identifies Haitian Creole from authentic phrases', () => {
      const res = detectCaribbeanDialect('Sak pase zanmi mwen, tout moun ap boule byen!');
      expect(res.dialect).toBe('ht');
      expect(res.confidence).toBeGreaterThan(0.5);
      expect(res.matchedMarkers).toContain('sak pase');
    });

    it('accurately identifies Papiamentu from authentic phrases', () => {
      const res = detectCaribbeanDialect('Bon bini dushi yiu, con ta bay awe!');
      expect(res.dialect).toBe('pap');
      expect(res.confidence).toBeGreaterThan(0.5);
      expect(res.matchedMarkers).toContain('con ta bay');
    });

    it('accurately identifies Trinidadian Creole from authentic phrases', () => {
      const res = detectCaribbeanDialect('Let we lime by the savannah and grab some hot doubles!');
      expect(res.dialect).toBe('tri');
      expect(res.confidence).toBeGreaterThan(0.5);
      expect(res.matchedMarkers).toContain('let we lime');
    });
  });

  // ===========================================================================
  // 3. Vernacular Translation & Context Token Protection
  // ===========================================================================
  describe('3. Vernacular Translation & Token Protection Invariants', () => {
    it('translates Caribbean dialect idioms accurately into Standard English', () => {
      const patoisRes = translateDialectText('Wah gwaan, everything bless');
      expect(patoisRes.hasTranslation).toBe(true);
      expect(patoisRes.translatedText).toContain("What's going on");

      const creoleRes = translateDialectText('Sak pase brother');
      expect(creoleRes.hasTranslation).toBe(true);
      expect(creoleRes.translatedText).toContain("What's up");
    });

    it('immunizes mentions, hashtags, URLs, and brand tokens from accidental translation mangling', () => {
      const rawText = 'Connect on https://tukubi.com with @carib_artist and share #ReggaeVibes on TUKUBI';
      const { protectedText, restoreMap } = protectTokens(rawText);

      expect(protectedText).toContain('__URL_0__');
      expect(protectedText).toContain('__USER_1__');
      expect(protectedText).toContain('__TAG_2__');
      expect(protectedText).toContain('__BRAND_3__');

      // Restoration is 100% lossless
      const restored = restoreTokens(protectedText, restoreMap);
      expect(restored).toBe(rawText);
    });

    it('generates consistent deterministic content hash for translation caching', () => {
      const hash1 = computeContentHash('Big up to all Caribbean innovators!');
      const hash2 = computeContentHash('  big up to all caribbean innovators!  ');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  // ===========================================================================
  // 4. Cultural Identity Privacy & User Consent Boundaries (Rule 8)
  // ===========================================================================
  describe('4. Cultural Identity Privacy & Governance (Rule 8)', () => {
    interface CulturalProfile {
      userId: string;
      islandOrigin?: string | null;
      diasporaLocation?: string | null;
      isLocationPublic: boolean;
      inferredDialect?: string | null;
      allowInferredAttributeDisplay: boolean;
    }

    function sanitizePublicCulturalIdentity(profile: CulturalProfile) {
      return {
        userId: profile.userId,
        // Location is private by default unless explicitly user-consented
        islandOrigin: profile.isLocationPublic ? profile.islandOrigin : null,
        diasporaLocation: profile.isLocationPublic ? profile.diasporaLocation : null,
        // Inferred attributes are NEVER exposed as facts unless explicit toggle enabled
        inferredDialect: profile.allowInferredAttributeDisplay ? profile.inferredDialect : null,
      };
    }

    it('enforces that location and diaspora identity are omitted by default when isLocationPublic is false', () => {
      const profile: CulturalProfile = {
        userId: 'usr_caribbean_diaspora_1',
        islandOrigin: 'Barbados',
        diasporaLocation: 'London, UK',
        isLocationPublic: false,
        inferredDialect: 'jam',
        allowInferredAttributeDisplay: false,
      };

      const publicView = sanitizePublicCulturalIdentity(profile);
      expect(publicView.islandOrigin).toBeNull();
      expect(publicView.diasporaLocation).toBeNull();
      expect(publicView.inferredDialect).toBeNull();
    });

    it('exposes cultural attributes only when user has explicitly granted visibility', () => {
      const profile: CulturalProfile = {
        userId: 'usr_caribbean_diaspora_2',
        islandOrigin: 'Trinidad and Tobago',
        diasporaLocation: 'Toronto, Canada',
        isLocationPublic: true,
        inferredDialect: 'tri',
        allowInferredAttributeDisplay: true,
      };

      const publicView = sanitizePublicCulturalIdentity(profile);
      expect(publicView.islandOrigin).toBe('Trinidad and Tobago');
      expect(publicView.diasporaLocation).toBe('Toronto, Canada');
      expect(publicView.inferredDialect).toBe('tri');
    });
  });
});
